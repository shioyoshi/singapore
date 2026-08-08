import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "よりみち. | 海城のための心のセルフチェック",
  description: "診断ではなく、今日の自分に気づくための3分セルフチェック。",
  authors: [{ name: "GIC Kaijo G Group" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
