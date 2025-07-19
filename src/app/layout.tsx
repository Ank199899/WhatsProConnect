import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RealTimeProvider } from "@/contexts/RealTimeContext";
import { ToastContainer } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WhatsApp Pro - Advanced Manager",
  description: "Professional WhatsApp management platform with multi-account support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                // Always default to light mode
                const theme = localStorage.getItem('theme') || 'light';
                // Force light mode regardless of system preference
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                // Set theme to light in localStorage if not set
                if (!localStorage.getItem('theme')) {
                  localStorage.setItem('theme', 'light');
                }
              } catch (e) {
                document.documentElement.classList.add('light');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <RealTimeProvider>
            {children}
            <ToastContainer />
          </RealTimeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
