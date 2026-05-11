"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getApiBaseUrl, readSession } from "../../lib/auth";
import styles from "./page.module.scss";

type SeriesPoint = {
  label: string;
  value: number;
  orders: number;
};

const sections = [
  { title: "Daily revenue", endpoint: "/api/analytics/revenue/daily" },
  { title: "Products", endpoint: "/api/analytics/revenue/products" },
  { title: "Regions", endpoint: "/api/analytics/revenue/regions" },
  { title: "Campaigns", endpoint: "/api/analytics/revenue/campaigns" },
];

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<Record<string, SeriesPoint[]>>({});
  const [status, setStatus] = useState("Loading analytics");

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login");
      return;
    }

    void loadAnalytics();
  }, [router]);

  async function loadAnalytics() {
    try {
      const refreshResponse = await fetch(`${getApiBaseUrl()}/api/analytics/refresh`, {
        method: "POST",
      });

      if (!refreshResponse.ok) {
        throw new Error("Unable to refresh analytics");
      }

      const responses = await Promise.all(
        sections.map((section) => fetch(`${getApiBaseUrl()}${section.endpoint}`)),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error("Unable to load analytics");
      }

      const payloads = await Promise.all(
        responses.map((response) => response.json() as Promise<SeriesPoint[]>),
      );
      const nextData: Record<string, SeriesPoint[]> = {};

      sections.forEach((section, index) => {
        nextData[section.title] = payloads[index];
      });

      setData(nextData);
      setStatus("Analytics refreshed from staging orders");
    } catch {
      setStatus("Run a pipeline job before viewing analytics");
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 4</p>
          <h1>Analytics</h1>
          <p>{status}</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/pipelines">Pipelines</Link>
          <button onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className={styles.grid}>
        {sections.map((section) => (
          <article key={section.title}>
            <h2>{section.title}</h2>
            <BarList data={data[section.title] ?? []} />
          </article>
        ))}
      </section>
    </main>
  );
}

function BarList({ data }: { data: SeriesPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (!data.length) {
    return <p className={styles.empty}>No rows available.</p>;
  }

  return (
    <ul className={styles.barList}>
      {data.map((point) => (
        <li key={point.label}>
          <div>
            <strong>{point.label}</strong>
            <span>
              {formatCurrency(point.value)} · {point.orders} orders
            </span>
          </div>
          <meter max={maxValue} value={point.value} />
        </li>
      ))}
    </ul>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
