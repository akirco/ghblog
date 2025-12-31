import { AuthSessionProvider } from "@/components/session-provider";
import { auth } from "@/lib/auth";
import "@/styles/globals.css";
import type { Metadata } from "next";
import type React from "react";

import { Noto_Serif } from "next/font/google";

const notoSeriF = Noto_Serif({
  subsets: ["latin"],
  weight: ["400"],
});
export const metadata: Metadata = {
  title: "Blog - Minimalist Blogging",
  description: "A minimalist blogging platform powered by GitHub Issues",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', theme === 'dark');

                window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
                  document.documentElement.classList.toggle('dark', e.matches);
                });
              })();
            `,
          }}
        />
        {/* Highlight.js styles for code syntax highlighting */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github.min.css"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.11.1/styles/github-dark.min.css"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className={`font-sans antialiased ${notoSeriF.className}`}>
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
