"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getApiBaseUrl, readSession } from "../../lib/auth";
import styles from "./page.module.scss";

type SourceType = "ECOMMERCE" | "CRM" | "MARKETING" | "SUPPORT" | "CSV";

type DataSource = {
  id: string;
  name: string;
  type: SourceType;
  status: "DRAFT" | "CONNECTED" | "FAILED" | "DISABLED";
  schedule: string;
  lastConnectionMessage?: string;
  lastConnectionTestAt?: string;
};

const sourceTypes: SourceType[] = ["ECOMMERCE", "CRM", "MARKETING", "SUPPORT", "CSV"];

export default function SourcesPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [sources, setSources] = useState<DataSource[]>([]);
  const [name, setName] = useState("Demo Commerce Source");
  const [type, setType] = useState<SourceType>("ECOMMERCE");
  const [schedule, setSchedule] = useState("daily");
  const [configValue, setConfigValue] = useState('{"provider":"shopify","apiKey":"local-demo-key"}');
  const [status, setStatus] = useState("Loading sources");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    setToken(session.token);
    void loadSources(session.token);
  }, [router]);

  useEffect(() => {
    if (type === "CSV") {
      setConfigValue('{"path":"./database/seeds/demo-orders.csv"}');
      return;
    }

    setConfigValue(`{"provider":"${type.toLowerCase()}-mock","apiKey":"local-demo-key"}`);
  }, [type]);

  async function loadSources(authToken: string) {
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/api/data-sources`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      setError("Unable to load data sources");
      return;
    }

    const payload = (await response.json()) as DataSource[];
    setSources(payload);
    setStatus(payload.length ? "Sources loaded" : "No sources registered");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configValue) as Record<string, unknown>;
    } catch {
      setError("Configuration must be valid JSON");
      return;
    }

    const response = await fetch(`${getApiBaseUrl()}/api/data-sources`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, type, schedule, config }),
    });

    if (!response.ok) {
      setError("Unable to create data source");
      return;
    }

    setName(`${type} Source ${sources.length + 2}`);
    await loadSources(token);
  }

  async function handleTest(id: string) {
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/api/data-sources/${id}/test-connection`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setError("Connection test failed");
      return;
    }

    await loadSources(token);
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 2</p>
          <h1>Data sources</h1>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard">Dashboard</Link>
          <button onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <form className={styles.form} onSubmit={handleCreate}>
          <h2>Register source</h2>
          <label>
            Name
            <input onChange={(event) => setName(event.target.value)} required value={name} />
          </label>
          <label>
            Type
            <select onChange={(event) => setType(event.target.value as SourceType)} value={type}>
              {sourceTypes.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {sourceType}
                </option>
              ))}
            </select>
          </label>
          <label>
            Schedule
            <input onChange={(event) => setSchedule(event.target.value)} value={schedule} />
          </label>
          <label>
            Configuration JSON
            <textarea
              onChange={(event) => setConfigValue(event.target.value)}
              rows={6}
              value={configValue}
            />
          </label>
          {error ? <p className={styles.error}>{error}</p> : null}
          <button className={styles.primary} type="submit">
            Create source
          </button>
        </form>

        <section className={styles.list} aria-label="Registered data sources">
          <div className={styles.listHeader}>
            <h2>Registered sources</h2>
            <span>{status}</span>
          </div>

          {sources.length ? (
            sources.map((source) => (
              <article className={styles.source} key={source.id}>
                <div>
                  <span className={styles.status}>{source.status}</span>
                  <h3>{source.name}</h3>
                  <p>
                    {source.type} · {source.schedule}
                  </p>
                  {source.lastConnectionMessage ? (
                    <p className={styles.message}>{source.lastConnectionMessage}</p>
                  ) : null}
                </div>
                <button onClick={() => handleTest(source.id)} type="button">
                  Test
                </button>
              </article>
            ))
          ) : (
            <p className={styles.empty}>Create a fake API source or CSV source to begin.</p>
          )}
        </section>
      </section>
    </main>
  );
}
