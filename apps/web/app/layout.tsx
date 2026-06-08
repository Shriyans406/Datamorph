import type { Metadata } from "next"
import { Inter } from "next/font/google"

import "./globals.css"

import { Toaster } from "@/components/ui/sonner"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "DataMorph",
  description:
    "AI-powered analytics platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="font-sans antialiased bg-slate-950 text-slate-100">
        {children}

        <Toaster />
      </body>
    </html>
  )
}