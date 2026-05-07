import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "asdf",
  description: "Built with NoCMS",
};

// Inspector script is gated server-side by env (set only by the editor when
// spawning preview dev servers). The script self-no-ops without ?nocms-edit=1.
const editorOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {editorOrigin && (
          <script async src={`${editorOrigin}/nocms-inspector.js`} />
        )}
      </head>
      <body className="font-body antialiased">
        {children}
      </body>
    </html>
  );
}
