import "./globals.css";

import type { Metadata } from "next";
import { fontMono, fontSans, fontSerif } from "./font";
import { CodeSidebar, CodeSidebarProvider } from "@/components/ui/code-sidebar";
import { SettingsSidebar, SettingsSidebarProvider } from "@/components/ui/settings-sidebar";
import { BackgroundProvider } from "@/lib/background-context";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DrapesUI",
  description: "Backgrounds",
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icon1.png", sizes: "96x96", type: "image/png" },
      { url: "/icon0.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
  other: {
    "apple-mobile-web-app-title": "DrapesUI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-title" content="DrapesUI" />
      </head>
      <body
        className={cn(
          "min-h-screen min-w-[300px] w-full bg-[#0a0a0a] relative ",
          fontSans.variable, fontMono.variable, fontSerif.variable
        )}
        suppressHydrationWarning
      >
        <div
          aria-hidden='true'
          className="inset-0 z-0 fixed"
          style={{
            backgroundImage: `
                radial-gradient(ellipse at 20% 30%, rgba(56, 189, 248, 0.4) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 70%),
                radial-gradient(ellipse at 60% 20%, rgba(236, 72, 153, 0.25) 0%, transparent 50%),
                radial-gradient(ellipse at 40% 80%, rgba(34, 197, 94, 0.2) 0%, transparent 65%)
              `,
          }}
        />
        <div
          aria-hidden='true'
          className="relative z-10 min-h-screen overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(35px)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 80px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div aria-hidden='true' className="inset-0 z-0 pointer-events-none grain-overlay opacity-20 fixed" />

          <BackgroundProvider>
            <CodeSidebarProvider>
              <SettingsSidebarProvider>
                <div className="relative z-10 w-full h-full max-w-500 mx-auto">
                  {children}
                </div>
                <SettingsSidebar />
                <CodeSidebar />
              </SettingsSidebarProvider>
            </CodeSidebarProvider>
          </BackgroundProvider>
        </div>
      </body>
    </html>
  );
}
