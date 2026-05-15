import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SemAuth — Intent Integrity Authorization",
  description: "Semantic Authorization: detecting CVIC in multi-agent systems",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-zinc-50 text-zinc-900 min-h-screen antialiased">
        <nav className="bg-white border-b border-zinc-200 px-6 py-3.5 flex items-center gap-8 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-900 font-bold text-base tracking-tight">SemAuth</span>
              <span className="text-xs text-zinc-500 border border-zinc-200 rounded-full px-2 py-0.5 bg-zinc-50">
                Intent Integrity
              </span>
            </div>
          </div>
          <div className="flex gap-1 text-sm">
            <a href="/" className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Workflow
            </a>
            <a href="/agents" className="px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors font-medium">
              Agents
            </a>
          </div>
        </nav>
        <main className="px-6 py-8 max-w-7xl mx-auto">{children}</main>
      </body>
    </html>
  );
}
