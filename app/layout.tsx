import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "سایر آثار نویسنده",
  description: "ساخت و مدیریت فهرست سایر آثار نویسنده",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
