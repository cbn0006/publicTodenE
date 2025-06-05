import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider as NextThemesProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Toden-E Tool",
  description: "Toden-E Web Tool",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        <body className={inter.className}>{children}</body>
      </NextThemesProvider>
    </html>
  );
}
