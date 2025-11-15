import {
  Martian_Mono as FontMono,
  Fira_Code as FontMonoCode,
  Baskervville as FontSerif,
  Instrument_Sans as FontSans
} from "next/font/google";

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: "500",
});

export const fontMonoCode = FontMonoCode({
  subsets: ["latin"],
  variable: "--font-mono-code",
  weight: "500",
});

export const fontSerif = FontSerif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "500",
});

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: "500",
});

