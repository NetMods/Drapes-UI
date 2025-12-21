import "./globals.css";
import type { Metadata } from "next";
import { fontMono, fontMonoCode, fontSans, fontSerif } from "./font";
import { CodeSidebar, CodeSidebarProvider } from "@/components/ui/code-sidebar";
import { SettingsSidebar, SettingsSidebarProvider } from "@/components/ui/settings-sidebar";
import { BackgroundProvider } from "@/lib/background-context";
import { cn } from "@/lib/utils";
import { CommandPalette } from "@/components/layout/command-palette";
import { CommandPaletteContextProvider } from "@/components/layout/command-palette/context";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Drapes UI – Beautiful Animated Canvas Backgrounds for Your Website",
  description:
    "Stunning, performant, animated canvas backgrounds you can add in seconds. Zero dependencies, fully customizable, new design every week. Built with React + Tailwind.",
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
  openGraph: {
    title: "Drapes UI – Live Animated Canvas Backgrounds (Free & Open Source)",
    description:
      "Drop-in animated backgrounds for React & Next.js. Zero dependencies · Weekly new designs · Fully customizable",
    url: "https://drapes-ui.vercel.app",
    siteName: "Drapes UI",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Drapes UI – Animated Canvas Backgrounds Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Drapes UI – Live Animated Canvas Backgrounds (Free & Open Source)",
    description: "Add gorgeous live backgrounds to your site in 2 clicks. New design every week ⚡",
    images: ["/og.png"],
  },
  keywords:
    "animated background, canvas background, react background, tailwind background, live wallpaper web, nextjs background, particles background, drapes ui, free canvas animation",

  metadataBase: new URL("https://drapes-ui.vercel.app"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  other: {
    "apple-mobile-web-app-title": "Drapes UI",
    "application-name": "Drapes UI",
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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BSYPXYRCXJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-BSYPXYRCXJ');
          `}
        </Script>
      </head>
      <body
        className={cn(
          "min-h-screen min-w-[320px] w-full bg-[#0a0a0a] relative",
          fontSans.variable, fontMono.variable, fontSerif.variable, fontMonoCode.variable
        )}
        suppressHydrationWarning
      >
        <div
          aria-hidden='true'
          className="inset-0 z-0 fixed"
        />
        <div
          aria-hidden='true'
          className="relative z-10 min-h-screen overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(35px)",
            borderTop: "2px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 0 80px rgba(0, 0, 0, 0.25)",
          }}
        >
          <div aria-hidden='true' className="inset-0 z-0 pointer-events-none grain-overlay opacity-20 fixed" />

          <CommandPaletteContextProvider>
            <BackgroundProvider>
              <CodeSidebarProvider>
                <SettingsSidebarProvider>
                  <div className="relative z-10 w-full h-full max-w-500 mx-auto">
                    {children}
                  </div>
                  <SettingsSidebar />
                  <CodeSidebar />
                  <CommandPalette />
                </SettingsSidebarProvider>
              </CodeSidebarProvider>
            </BackgroundProvider>
          </CommandPaletteContextProvider>
        </div>
      </body>
    </html>
  );
}
