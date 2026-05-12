import Link from "next/link";
import styles from "./page.module.scss";

const platformAreas = [
  "Connect operational data sources and verify them before ingestion.",
  "Run warehouse pipelines that land data into raw, staging, and analytics layers.",
  "Operate dashboards, analyst workflows, and reporting from one workspace.",
];

const appSections = [
  { label: "Login", path: "/login" },
  { label: "Dashboard", path: "/dashboard" },
  { label: "Sources", path: "/sources" },
  { label: "Pipelines", path: "/pipelines" },
  { label: "Analytics", path: "/analytics" },
  { label: "AI Analyst", path: "/ai" },
  { label: "Reports", path: "/reports" },
];

const runtimeServices = [
  "Next.js workspace served from Render",
  "NestJS API with PostgreSQL-backed auth, ETL, and analytics endpoints",
  "FastAPI ETL worker on the private deployment network",
  "FastAPI AI analyst with guarded read-only queries",
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Live Deployment</p>
        <h1>InsightFlow AI</h1>
        <p className={styles.lead}>
          Business intelligence automation across ingestion, ETL, analytics,
          AI-assisted exploration, and reporting.
        </p>
        <div className={styles.actions}>
          <Link href="/login" prefetch={false}>
            Enter workspace
          </Link>
          <Link href="/dashboard" prefetch={false}>
            Open dashboard
          </Link>
        </div>
      </section>

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <span>Platform</span>
          <strong>Next.js + NestJS + FastAPI</strong>
        </article>
        <article className={styles.metricCard}>
          <span>Warehouse</span>
          <strong>PostgreSQL raw, staging, analytics</strong>
        </article>
        <article className={styles.metricCard}>
          <span>Runtime</span>
          <strong>Render Blueprint runtime</strong>
        </article>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Platform Flow</h2>
          <ul>
            {platformAreas.map((area) => (
              <li key={area}>{area}</li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>App Sections</h2>
          <ul>
            {appSections.map((section) => (
              <li key={section.path}>
                <Link href={section.path} prefetch={false}>
                  <code>{section.path}</code> {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>Runtime Services</h2>
          <ul>
            {runtimeServices.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
