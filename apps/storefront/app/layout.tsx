import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Personal Marketing Store — Pens, Stationery & Art Supplies",
  description:
    "India's premium wholesale stationery store. Shop pens, notebooks, planners, art supplies & more. COD available above ₹500.",
  keywords: ["stationery", "pens", "notebooks", "art supplies", "wholesale"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var shouldUseDark = theme === 'dark' || theme === 'system' && systemDark || !theme && systemDark;
                  if (shouldUseDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

