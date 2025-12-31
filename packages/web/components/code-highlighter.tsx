"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface CodeHighlighterProps {
  html: string
}

export function CodeHighlighter({ html }: CodeHighlighterProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isHighlightedRef = useRef(false)

  useEffect(() => {
    const initHighlight = async () => {
      try {
        // Dynamically import highlight.js to avoid bundling it on the server
        const hljs = await import("highlight.js")

        // Apply syntax highlighting to all code blocks
        if (!isHighlightedRef.current) {
          // Use highlightAll which will highlight all <pre><code> blocks on the page
          // This is safe since we only have code blocks in the blog content
          // hljs is the default export
          const hljsInstance = hljs.default || hljs
          if (hljsInstance.highlightAll) {
            hljsInstance.highlightAll()
          }
          isHighlightedRef.current = true
        }
      } catch (error) {
        console.error("Failed to load highlight.js:", error)
      }
    }

    initHighlight()
  }, [html]) // Re-run when html changes

  return (
    <div
      ref={containerRef}
      className="max-w-none prose prose-lg"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}