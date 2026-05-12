"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import {
  AuthUser,
  clearSession,
  fetchProfile,
  getApiBaseUrl,
  readSession,
  writeSession,
} from "../../lib/auth";
import styles from "./page.module.scss";

type Overview = {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  averageOrderValue: number;
};

type SeriesPoint = {
  label: string;
  value: number;
  orders: number;
};

const quickLinks = [
  {
    title: "Manage sources",
    description: "Register connectors, review connection status, and prepare inputs.",
    href: "/sources",
  },
  {
    title: "Run pipelines",
    description: "Trigger ETL jobs and inspect stage-level execution logs.",
    href: "/pipelines",
  },
  {
    title: "Explore analytics",
    description: "Open the revenue views used by dashboards and reporting.",
    href: "/analytics",
  },
  {
    title: "Ask the analyst",
    description: "Query the warehouse through guarded read-only analytical prompts.",
    href: "/ai",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState("Checking your workspace session.");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<SeriesPoint[]>([]);
  const [regions, setRegions] = useState<SeriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<SeriesPoint[]>([]);
  const [analyticsStatus, setAnalyticsStatus] = useState(
    "Refreshing the analytics mart from the latest staged orders.",
  );

  useEffect(() => {
    const session = readSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    fetchProfile(session.token)
      .then((profile) => {
        writeSession({ ...session, user: profile });
        setUser(profile);
        setStatus("Workspace session active.");
        void loadAnalytics();
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  async function loadAnalytics() {
    try {
      const refreshResponse = await fetch(`${getApiBaseUrl()}/api/analytics/refresh`, {
        method: "POST",
      });

      if (!refreshResponse.ok) {
        throw new Error();
      }

      const [overviewResponse, productResponse, regionResponse, campaignResponse] =
        await Promise.all([
          fetch(`${getApiBaseUrl()}/api/analytics/overview`),
          fetch(`${getApiBaseUrl()}/api/analytics/revenue/products`),
          fetch(`${getApiBaseUrl()}/api/analytics/revenue/regions`),
          fetch(`${getApiBaseUrl()}/api/analytics/revenue/campaigns`),
        ]);

      if (
        !overviewResponse.ok ||
        !productResponse.ok ||
        !regionResponse.ok ||
        !campaignResponse.ok
      ) {
        throw new Error();
      }

      const [overviewPayload, productPayload, regionPayload, campaignPayload] =
        await Promise.all([
          overviewResponse.json() as Promise<Overview>,
          productResponse.json() as Promise<SeriesPoint[]>,
          regionResponse.json() as Promise<SeriesPoint[]>,
          campaignResponse.json() as Promise<SeriesPoint[]>,
        ]);

      setOverview(overviewPayload);
      setProducts(productPayload);
      setRegions(regionPayload);
      setCampaigns(campaignPayload);
      setAnalyticsStatus("Analytics refreshed from the current warehouse snapshot.");
    } catch {
      setAnalyticsStatus("No analytics snapshot is available yet. Run a pipeline and refresh.");
    }
  }

  if (!user) {
    return (
      <main className={styles.loading}>
        <p>{status}</p>
      </main>
    );
  }

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/analytics" prefetch={false}>
            Revenue views
          </Link>
          <Link className={workspace.actionLink} href="/reports" prefetch={false}>
            Reporting contract
          </Link>
        </>
      }
      description="Monitor KPI health, move between operational workflows, and review the latest warehouse outputs from one workspace."
      eyebrow="Executive overview"
      title={`Welcome back, ${user.name}`}
    >
      <section className={workspace.metricGrid} aria-label="Business KPI metrics">
        <article className={workspace.metric}>
          <span className={workspace.metricLabel}>Revenue</span>
          <strong className={workspace.metricValue}>
            {formatCurrency(overview?.totalRevenue ?? 0)}
          </strong>
          <p className={workspace.metricNote}>Gross sales currently available in analytics.</p>
        </article>
        <article className={workspace.metric}>
          <span className={workspace.metricLabel}>Orders</span>
          <strong className={workspace.metricValue}>{overview?.totalOrders ?? 0}</strong>
          <p className={workspace.metricNote}>Order rows loaded into the fact table.</p>
        </article>
        <article className={workspace.metric}>
          <span className={workspace.metricLabel}>Customers</span>
          <strong className={workspace.metricValue}>{overview?.totalCustomers ?? 0}</strong>
          <p className={workspace.metricNote}>Distinct buyers represented in analytics.</p>
        </article>
        <article className={workspace.metric}>
          <span className={workspace.metricLabel}>Average order value</span>
          <strong className={workspace.metricValue}>
            {formatCurrency(overview?.averageOrderValue ?? 0)}
          </strong>
          <p className={workspace.metricNote}>Mean revenue per order.</p>
        </article>
      </section>

      <section className={workspace.grid}>
        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Revenue by product</h2>
              <p className={workspace.panelDescription}>{analyticsStatus}</p>
            </div>
            <span className={workspace.statusPill}>Live analytics</span>
          </div>
          <BarList data={products} />
        </article>

        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Workspace status</h2>
              <p className={workspace.panelDescription}>
                Session and access context for the current analyst.
              </p>
            </div>
          </div>
          <div className={workspace.stack}>
            <div className={styles.identityRow}>
              <span className={workspace.neutralPill}>Session active</span>
              <strong>{user.role}</strong>
            </div>
            <p className={workspace.message}>{user.email}</p>
            <p className={workspace.message}>{status}</p>
          </div>
        </article>

        <article className={`${workspace.panel} ${workspace.fullWidth}`}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Operational workflow</h2>
              <p className={workspace.panelDescription}>
                Jump directly into the next step in the data operations cycle.
              </p>
            </div>
          </div>
          <div className={styles.quickLinkGrid}>
            {quickLinks.map((item) => (
              <Link className={styles.quickLinkCard} href={item.href} key={item.href} prefetch={false}>
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </Link>
            ))}
          </div>
        </article>

        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Revenue by region</h2>
              <p className={workspace.panelDescription}>
                Compare sales distribution across commercial territories.
              </p>
            </div>
          </div>
          <BarList data={regions} />
        </article>

        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Campaign performance</h2>
              <p className={workspace.panelDescription}>
                Review campaign impact on the current revenue mix.
              </p>
            </div>
          </div>
          <BarList data={campaigns} />
        </article>
      </section>
    </AppShell>
  );
}

function BarList({ data }: { data: SeriesPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (!data.length) {
    return <p className={workspace.emptyState}>No analytics rows are available yet.</p>;
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
