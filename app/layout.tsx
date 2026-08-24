import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { RoleProvider } from "@/lib/permissions";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Apex School ERP - Enterprise Frontend",
  description: "Next-generation enterprise frontend school management system for K-12 institutions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <RoleProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </RoleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
