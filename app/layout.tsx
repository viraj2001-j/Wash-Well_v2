import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import DynamicTitle from "@/components/DynamicTitle";
import Navbar from "@/components/layout/Navbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GoClean - Wash & Well",
  description: "GoClean Laundry & Dry Cleaning Delivery Management System",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} font-sans h-full antialiased`}
    >
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>
        <DynamicTitle />
        <Navbar />
        {children}
      </body>
    </html>
  );
}