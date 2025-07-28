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
  title: "WhatsPro Connect - Professional WhatsApp Business Solution",
  description: "Professional WhatsApp business management platform with advanced messaging capabilities and multi-account support",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', type: 'image/x-icon' }
    ],
    apple: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <head>

      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
        style={{
          '--color-primary': '#296073',
          '--color-secondary': '#3596B5',
          '--color-accent': '#ADC5CF',
          '--color-dark': '#1E293B',
          '--color-light': '#F8FAFC',
          '--color-bg-primary': '#FFFFFF',
          '--color-bg-secondary': '#F8FAFC',
          '--color-bg-tertiary': '#F1F5F9',
          '--color-text-primary': '#1E293B',
          '--color-text-secondary': '#64748B',
          '--color-border': '#E2E8F0'
        } as React.CSSProperties}
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
