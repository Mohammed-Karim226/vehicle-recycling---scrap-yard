import type { Metadata } from "next";
import { Toaster } from "sonner";
import { workSans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vehicle Recycling Scrap Yard",
  description: "Peterborough's premium vehicle breakers yard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${workSans.variable} h-full font-sans antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster position="top-right" richColors style={{ fontFamily: "inherit" }} />
      </body>
    </html>
  );
}
