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
  const runtimeConfig = {
    apiBaseUrl:
      process.env.API_BASE_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      "http://localhost:3001",
    aiBaseUrl:
      process.env.AI_BASE_URL ??
      process.env.NEXT_PUBLIC_AI_URL ??
      "http://localhost:8002",
  };

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__INSIGHTFLOW_CONFIG__ = ${JSON.stringify(runtimeConfig)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
