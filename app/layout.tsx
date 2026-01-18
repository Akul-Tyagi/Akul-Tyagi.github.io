import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import localFont from 'next/font/local';
import "./globals.css";

const soriaFont = localFont({
  src: "../public/soria-font.ttf",
  variable: "--font-soria",
});

const vercettiFont = localFont({
  src: "../public/Vercetti-Regular.woff",
  variable: "--font-vercetti",
});

const buzzerFont = localFont({
  src: "../public/buzzer.otf",
  variable: "--font-buzzer",
});
const monicaFont = localFont({
  src: "../public/monica.otf",
  variable: "--font-monica",
});
const cvFont = localFont({
  src: "../public/cv.otf",
  variable: "--font-cv",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? '';

  return (
    <html lang="en" className="overscroll-y-none">
      <head>
        {/* Preload video with correct syntax */}
        <link rel="preload" href="/videos/Falling.mp4" as="fetch" type="video/mp4" crossOrigin="anonymous" />
      </head>
      <body
        className={`${soriaFont.variable} ${vercettiFont.variable} ${buzzerFont.variable} ${monicaFont.variable} ${cvFont.variable} font-sans antialiased`}
      >
        {children}
      </body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}