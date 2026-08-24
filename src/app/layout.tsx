import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Filipa Cabecinha — Portfolio",
  description: "A catalog of paintings by Filipa Cabecinha.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bone text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
