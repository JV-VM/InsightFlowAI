import type { Metadata } from "next";
import "../styles/globals.scss";

export const metadata: Metadata = {
  title: "InsightFlow AI",
  description: "Revenue operations workspace for ETL, analytics, AI-assisted exploration, and reporting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
