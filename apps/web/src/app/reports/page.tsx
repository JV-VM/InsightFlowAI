"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, readSession } from "../../lib/auth";
import styles from "./page.module.scss";

const views = [
  "analytics.pbi_sales_overview",
  "analytics.pbi_sales_detail",
  "analytics.pbi_daily_revenue",
  "analytics.pbi_revenue_by_product",
  "analytics.pbi_revenue_by_region",
  "analytics.pbi_revenue_by_campaign",
];

const pages = [
  {
    title: "Executive Overview",
    visuals: "KPI cards, daily revenue trend, top product and region tables",
  },
  {
    title: "Sales Performance",
    visuals: "Sales detail table, revenue by product, units sold by SKU",
  },
  {
    title: "Customers and Regions",
    visuals: "Customers by region, revenue by region, order distribution",
  },
  {
    title: "Marketing",
    visuals: "Campaign revenue, campaign customers, campaign order volume",
  },
  {
    title: "Pipeline Health",
    visuals: "ETL job status, processed rows, rejected rows, latest run timestamps",
  },
];

export default function ReportsPage() {
  const router = useRouter();

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login");
    }
  }, [router]);

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 6</p>
          <h1>Reports</h1>
          <p>Power BI reporting contracts and rebuild instructions.</p>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/analytics">Analytics</Link>
          <button onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className={styles.grid}>
        <article>
          <h2>Connection</h2>
          <dl>
            <div>
              <dt>Host</dt>
              <dd>localhost</dd>
            </div>
            <div>
              <dt>Port</dt>
              <dd>5432</dd>
            </div>
            <div>
              <dt>Database</dt>
              <dd>insightflow</dd>
            </div>
            <div>
              <dt>Schema</dt>
              <dd>analytics</dd>
            </div>
          </dl>
        </article>

        <article>
          <h2>Power BI views</h2>
          <ul>
            {views.map((view) => (
              <li key={view}>{view}</li>
            ))}
          </ul>
        </article>

        <article className={styles.wide}>
          <h2>Report pages</h2>
          <div className={styles.pageList}>
            {pages.map((page) => (
              <section key={page.title}>
                <h3>{page.title}</h3>
                <p>{page.visuals}</p>
              </section>
            ))}
          </div>
        </article>

        <article className={styles.wide}>
          <h2>Build procedure</h2>
          <ol>
            <li>Run an ETL job from the Pipelines page.</li>
            <li>Refresh analytics from the Dashboard or Analytics page.</li>
            <li>Open Power BI Desktop and choose PostgreSQL database.</li>
            <li>Connect to localhost:5432 and select the analytics views.</li>
            <li>Build report pages from the documented visual mappings.</li>
          </ol>
        </article>
      </section>
    </main>
  );
}
