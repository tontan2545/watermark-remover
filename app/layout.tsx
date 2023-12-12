import "./globals.css";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Watermark Remover",
  description: "Watermark Remover Project",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={cn(
          inter.className,
          "min-h-screen w-screen overflow-x-hidden bg-background antialiased",
        )}
      >
        {children}
      </body>
    </html>
  );
}
