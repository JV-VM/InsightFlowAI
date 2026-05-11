"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const navItems = [
  { label: "Dashboard", href: "/dashboard", enabled: true },
  { label: "Sources", href: "/sources", enabled: true },
  { label: "Pipelines", href: "/pipelines", enabled: true },
  { label: "Analytics", href: "/analytics", enabled: true },
  { label: "AI Analyst", href: "/ai", enabled: true },
  { label: "Reports", href: "/reports", enabled: true },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState("Checking session");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [products, setProducts] = useState<SeriesPoint[]>([]);
  const [regions, setRegions] = useState<SeriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<SeriesPoint[]>([]);
  const [analyticsStatus, setAnalyticsStatus] = useState("Loading analytics");

  useEffect(() => {
    const session = readSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    fetchProfile(session.token)
      .then((profile) => {
        const refreshedSession = { ...session, user: profile };
        writeSession(refreshedSession);
        setUser(profile);
        setStatus("Authenticated");
        void loadAnalytics();
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  async function loadAnalytics() {
    try {
      const refreshResponse = await fetch(`${getApiBaseUrl()}/api/analytics/refresh`, {
        method: "POST",
      });

      if (!refreshResponse.ok) {
        throw new Error("Unable to refresh analytics");
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
        throw new Error("Unable to load analytics");
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
      setAnalyticsStatus("Analytics refreshed");
    } catch {
      setAnalyticsStatus("Run an ETL job to populate analytics");
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
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Primary navigation">
        <div>
          <p className={styles.brand}>InsightFlow AI</p>
          <nav>
            {navItems.map((item) => (
              item.enabled ? (
                <Link
                  className={item.label === "Dashboard" ? styles.activeNav : ""}
                  href={item.href}
                  key={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <button disabled key={item.label} type="button">
                  {item.label}
                </button>
              )
            ))}
          </nav>
        </div>
        <button className={styles.logout} onClick={handleLogout} type="button">
          Logout
        </button>
      </aside>

      <section className={styles.content}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Analytics dashboard</p>
            <h1>Welcome, {user.name}</h1>
          </div>
          <div className={styles.profile}>
            <strong>{user.role}</strong>
            <span>{user.email}</span>
          </div>
        </header>

        <section className={styles.metrics} aria-label="Business KPI metrics">
          <article className={styles.metric}>
            <span>Revenue</span>
            <strong>{formatCurrency(overview?.totalRevenue ?? 0)}</strong>
            <p>Total sales</p>
          </article>
          <article className={styles.metric}>
            <span>Orders</span>
            <strong>{overview?.totalOrders ?? 0}</strong>
            <p>Processed orders</p>
          </article>
          <article className={styles.metric}>
            <span>Customers</span>
            <strong>{overview?.totalCustomers ?? 0}</strong>
            <p>Unique buyers</p>
          </article>
          <article className={styles.metric}>
            <span>Average</span>
            <strong>{formatCurrency(overview?.averageOrderValue ?? 0)}</strong>
            <p>Order value</p>
          </article>
        </section>

        <section className={styles.workspace}>
          <article className={styles.panelWide}>
            <div className={styles.panelHeader}>
              <h2>Revenue by product</h2>
              <span>{analyticsStatus}</span>
            </div>
            <BarList data={products} />
          </article>
          <article>
            <div className={styles.panelHeader}>
              <h2>Revenue by region</h2>
            </div>
            <BarList data={regions} />
          </article>
          <article className={styles.panelWide}>
            <div className={styles.panelHeader}>
              <h2>Campaign performance</h2>
            </div>
            <BarList data={campaigns} />
          </article>
          <article>
            <h2>Session</h2>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{status}</dd>
              </div>
              <div>
                <dt>User</dt>
                <dd>{user.email}</dd>
              </div>
            </dl>
          </article>
        </section>
      </section>
    </main>
  );
}

function BarList({ data }: { data: SeriesPoint[] }) {
  const maxValue = Math.max(...data.map((point) => point.value), 1);

  if (!data.length) {
    return <p className={styles.empty}>No analytics rows available.</p>;
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
