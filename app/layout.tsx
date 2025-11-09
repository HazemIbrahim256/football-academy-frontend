export const metadata = {
  title: "Football Academy",
  description: "Manage groups, players, and evaluations",
};

import "./globals.css";
import React from "react";
import Navbar from "@/components/Navbar";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-white text-black ${inter.className}`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}