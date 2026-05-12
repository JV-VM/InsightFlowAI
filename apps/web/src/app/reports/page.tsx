"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import { readSession } from "../../lib/auth";

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

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/dashboard" prefetch={false}>
            Executive overview
          </Link>
          <Link className={workspace.actionLink} href="/analytics" prefetch={false}>
            Analytics source
          </Link>
        </>
      }
      description="Use this page as the reporting contract for Power BI or any external BI surface consuming the warehouse views."
      eyebrow="Reporting layer"
      title="Reports"
    >
      <section className={workspace.grid}>
        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Connection model</h2>
              <p className={workspace.panelDescription}>
                The reporting layer is designed around the managed PostgreSQL analytics schema used by the deployment environment.
              </p>
            </div>
          </div>
          <div className={workspace.stack}>
            <p className={workspace.message}>Database: PostgreSQL</p>
            <p className={workspace.message}>Schema: analytics</p>
            <p className={workspace.message}>
              Access method: use the deployment-managed reporting connection string for the active environment.
            </p>
          </div>
        </article>

        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Published views</h2>
              <p className={workspace.panelDescription}>
                Stable view names available to external reporting tools.
              </p>
            </div>
          </div>
          <ul className={workspace.cleanList}>
            {views.map((view) => (
              <li className={workspace.listItem} key={view}>
                <strong className={workspace.itemTitle}>{view}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className={`${workspace.panel} ${workspace.fullWidth}`}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Recommended report pages</h2>
              <p className={workspace.panelDescription}>
                Suggested information architecture for the executive and operational report pack.
              </p>
            </div>
          </div>
          <div className={workspace.triGrid}>
            {pages.map((page) => (
              <section className={workspace.summaryCard} key={page.title}>
                <strong className={workspace.itemTitle}>{page.title}</strong>
                <p className={workspace.message}>{page.visuals}</p>
              </section>
            ))}
          </div>
        </article>

        <article className={`${workspace.panel} ${workspace.fullWidth}`}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Build procedure</h2>
              <p className={workspace.panelDescription}>
                Recommended sequence for refreshing the reporting model before distribution.
              </p>
            </div>
          </div>
          <ol className={workspace.cleanList}>
            <li className={workspace.listItem}>Run the orders pipeline from the Pipelines workspace.</li>
            <li className={workspace.listItem}>Refresh the analytics mart from the Dashboard or Analytics view.</li>
            <li className={workspace.listItem}>Connect your reporting tool to the managed PostgreSQL environment.</li>
            <li className={workspace.listItem}>Import the documented `analytics.pbi_*` views.</li>
            <li className={workspace.listItem}>Publish the report pack after validating metrics against the app.</li>
          </ol>
        </article>
      </section>
    </AppShell>
  );
}
