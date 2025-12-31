import { Node, mergeAttributes } from "@tiptap/core";

export interface BilibiliOptions {
  /**
   * Whether the video should be inline
   * @default false
   */
  inline: boolean;
  /**
   * Whether to allow fullscreen
   * @default true
   */
  allowFullscreen: boolean;
  /**
   * Additional HTML attributes for the iframe
   */
  HTMLAttributes: Record<string, unknown>;
  /**
   * Whether to add nocookie domain (not applicable for bilibili)
   * @default true
   */
  nocookie: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    bilibili: {
      /**
       * Add a bilibili video
       */
      setBilibili: (options: { src: string }) => ReturnType;
    };
  }
}

/**
 * Tiptap extension for embedding Bilibili videos
 * Supports BV IDs, AV IDs (old format), and full URLs
 * Automatically converts pasted Bilibili URLs to embedded players
 */
export const Bilibili = Node.create<BilibiliOptions>({
  name: "bilibili",

  addOptions() {
    return {
      inline: false,
      allowFullscreen: true,
      HTMLAttributes: {
        class: "rounded-lg my-4 w-full aspect-video max-w-3xl",
      },
      nocookie: true,
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      bvid: {
        default: null,
      },
      avid: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "div[data-bilibili-video] iframe",
      },
    ];
  },

  renderHTML({ node }) {
    const src = node.attrs.src;
    if (!src) {
      return [
        "div",
        mergeAttributes(this.options.HTMLAttributes, {
          "data-bilibili-video": true,
        }),
        "Invalid Bilibili URL",
      ];
    }

    // Parse URL to extract video ID and page number
    let videoId = "";
    let isBVID = false;
    let isAVID = false;
    let page = "1";

    // Try to match BV ID (new format)
    const bvMatch = src.match(/(BV[a-zA-Z0-9]{10})/i);
    if (bvMatch) {
      videoId = bvMatch[1];
      isBVID = true;
    }
    // Try to match AV ID (old format)
    else {
      const avMatch = src.match(/(?:av|AV)(\d+)/i);
      if (avMatch) {
        videoId = avMatch[1];
        isAVID = true;
      }
    }

    // Try to extract page number from URL query parameters
    let urlObj = null;
    try {
      // Handle protocol-relative URLs and absolute URLs
      const urlToParse = src.startsWith("//") ? `https:${src}` : src;
      if (urlToParse.startsWith("http")) {
        urlObj = new URL(urlToParse);
      }
    } catch {
      // URL parsing failed, ignore
    }
    if (urlObj) {
      const p = urlObj.searchParams.get("p");
      if (p) {
        page = p;
      }
    }

    // Build iframe src
    let iframeSrc = "";
    if (isBVID) {
      iframeSrc = `//player.bilibili.com/player.html?isOutside=true&bvid=${videoId}&p=${page}`;
    } else if (isAVID) {
      iframeSrc = `//player.bilibili.com/player.html?isOutside=true&aid=${videoId}&p=${page}`;
    } else if (src.includes("b23.tv")) {
      // Short URL - we can't embed directly, show a link instead
      return [
        "div",
        mergeAttributes(this.options.HTMLAttributes, {
          "data-bilibili-video": true,
        }),
        [
          "a",
          {
            href: src,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "text-primary underline",
          },
          src,
        ],
      ];
    } else {
      // Unknown format, try to use as-is
      iframeSrc = src;
    }

    const iframeAttrs = mergeAttributes(
      {
        src: iframeSrc,
        width: "100%",
        height: "100%",
        frameborder: "no",
        allowfullscreen: this.options.allowFullscreen ? "true" : null,
        scrolling: "no",
        border: "0",
        framespacing: "0",
        allow:
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
        style: "position: absolute; top: 0; left: 0;",
      },
      this.options.HTMLAttributes
    );

    // Responsive container
    return [
      "div",
      mergeAttributes(
        {
          "data-bilibili-video": true,
          style:
            "position: relative; width: 100%; padding-bottom: 56.25%; height: 0; overflow: hidden;",
        },
        this.options.HTMLAttributes
      ),
      ["iframe", iframeAttrs],
    ];
  },

  addCommands() {
    return {
      setBilibili:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addPasteRules() {
    return [
      {
        // Match Bilibili video URLs with BV ID
        find: /https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/(BV[a-zA-Z0-9]{10})(?:\/|\?|$)/gi,
        handler: ({ state, range, match }) => {
          const [fullMatch] = match;
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({ src: fullMatch }));
        },
      },
      {
        // Match Bilibili video URLs with AV ID (old format)
        find: /https?:\/\/(?:www\.|m\.)?bilibili\.com\/video\/av(\d+)(?:\/|\?|$)/gi,
        handler: ({ state, range, match }) => {
          const [fullMatch] = match;
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({ src: fullMatch }));
        },
      },
      {
        // Match Bilibili short URLs (b23.tv)
        find: /https?:\/\/b23\.tv\/[a-zA-Z0-9]+/gi,
        handler: ({ state, range, match }) => {
          const [url] = match;
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.replaceWith(start, end, this.type.create({ src: url }));
        },
      },
      {
        // Match direct BV IDs in text
        find: /\b(BV[a-zA-Z0-9]{10})\b/gi,
        handler: ({ state, range, match }) => {
          const [bvid] = match;
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          const url = `https://www.bilibili.com/video/${bvid}`;
          tr.replaceWith(start, end, this.type.create({ src: url }));
        },
      },
      {
        // Match direct AV IDs in text (old format)
        find: /\bav(\d+)\b/gi,
        handler: ({ state, range, match }) => {
          const [, avid] = match;
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          const url = `https://www.bilibili.com/video/av${avid}`;
          tr.replaceWith(start, end, this.type.create({ src: url }));
        },
      },
    ];
  },
});
