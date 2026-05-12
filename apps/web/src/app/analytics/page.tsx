"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import { getApiBaseUrl, readSession } from "../../lib/auth";

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
  const [status, setStatus] = useState(
    "Refreshing the analytics mart and loading the latest breakdowns.",
  );

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
        throw new Error();
      }

      const responses = await Promise.all(
        sections.map((section) => fetch(`${getApiBaseUrl()}${section.endpoint}`)),
      );

      if (responses.some((response) => !response.ok)) {
        throw new Error();
      }

      const payloads = await Promise.all(
        responses.map((response) => response.json() as Promise<SeriesPoint[]>),
      );
      const nextData: Record<string, SeriesPoint[]> = {};

      sections.forEach((section, index) => {
        nextData[section.title] = payloads[index];
      });

      setData(nextData);
      setStatus("Analytics synced from staged order data.");
    } catch {
      setStatus("Analytics are not available yet. Run a pipeline before opening this view.");
    }
  }

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/dashboard" prefetch={false}>
            Overview
          </Link>
          <Link className={workspace.actionLink} href="/reports" prefetch={false}>
            Reporting views
          </Link>
        </>
      }
      description="Inspect the warehouse breakdowns that drive KPI cards, AI answers, and downstream reporting."
      eyebrow="Analytics mart"
      title="Analytics"
    >
      <section className={workspace.grid}>
        <article className={`${workspace.panel} ${workspace.fullWidth}`}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Refresh state</h2>
              <p className={workspace.panelDescription}>
                The analytics refresh is triggered on page load so the warehouse view stays current.
              </p>
            </div>
            <span className={workspace.statusPill}>Auto refresh</span>
          </div>
          <p className={workspace.message}>{status}</p>
        </article>

        {sections.map((section) => (
          <article className={workspace.panel} key={section.title}>
            <div className={workspace.panelHeader}>
              <div>
                <h2 className={workspace.panelTitle}>{section.title}</h2>
                <p className={workspace.panelDescription}>
                  Revenue and order volume for this analytics slice.
                </p>
              </div>
            </div>
            <BarList data={data[section.title] ?? []} />
          </article>
        ))}
      </section>
    </AppShell>
  );
}

function BarList({ data }: { data: SeriesPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (!data.length) {
    return <p className={workspace.emptyState}>No rows are available for this slice yet.</p>;
  }

  return (
    <ul className={workspace.barList}>
      {data.map((point) => (
        <li className={workspace.barItem} key={point.label}>
          <div className={workspace.barLabelRow}>
            <strong>{point.label}</strong>
            <span className={workspace.barMeta}>
              {formatCurrency(point.value)} · {point.orders} orders
            </span>
          </div>
          <meter className={workspace.barMeter} max={maxValue} value={point.value} />
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
