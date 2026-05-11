import styles from "./page.module.scss";

const phases = [
  "Next.js app shell with Sass Modules",
  "NestJS API with health and auth endpoints",
  "Python ETL worker health API",
  "Python AI analyst health and question API",
];

const routes = [
  { label: "Login", path: "/login" },
  { label: "Dashboard", path: "/dashboard" },
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>Phase 1 Foundation</p>
        <h1>InsightFlow AI</h1>
        <p className={styles.lead}>
          A full-stack business intelligence platform combining Next.js,
          NestJS, Python services, PostgreSQL, and Power BI.
        </p>
      </section>

      <section className={styles.grid}>
        <article className={styles.card}>
          <h2>Current Focus</h2>
          <ul>
            {phases.map((phase) => (
              <li key={phase}>{phase}</li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>Planned Routes</h2>
          <ul>
            {routes.map((route) => (
              <li key={route.path}>
                <code>{route.path}</code> {route.label}
              </li>
            ))}
          </ul>
        </article>

        <article className={styles.card}>
          <h2>Service Endpoints</h2>
          <ul>
            <li>
              <code>GET /api/health</code> on the API service
            </li>
            <li>
              <code>GET /health</code> on the ETL worker
            </li>
            <li>
              <code>GET /health</code> on the AI analyst
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
