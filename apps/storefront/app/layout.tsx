import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import ThemeInitializer from "@/components/ThemeInitializer";
export const metadata: Metadata = {
  title: "Personal Marketing Store - Stationery & Art Supplies",
  description:
    "India's premium wholesale stationery store. Shop pens, notebooks, planners, art supplies & more. COD available above ₹500.",
  keywords: ["stationery", "pens", "notebooks", "art supplies", "wholesale"],
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head />
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <ThemeInitializer />
        {children}
        <Toaster />
      </body>
    </html>
  );
}

