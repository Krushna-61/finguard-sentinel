'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SystemProvider } from "@/contexts/SystemContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <SystemProvider>
              {children}
            </SystemProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
