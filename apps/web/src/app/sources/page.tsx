"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import { getApiBaseUrl, readSession } from "../../lib/auth";

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
  const [name, setName] = useState("");
  const [type, setType] = useState<SourceType>("ECOMMERCE");
  const [schedule, setSchedule] = useState("daily");
  const [configValue, setConfigValue] = useState("");
  const [status, setStatus] = useState("Loading configured sources.");
  const [error, setError] = useState("");

  useEffect(() => {
    const session = readSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    setToken(session.token);
    setName("North America Commerce");
    setConfigValue(getConfigTemplate("ECOMMERCE"));
    void loadSources(session.token);
  }, [router]);

  useEffect(() => {
    setConfigValue(getConfigTemplate(type));
    if (!name) {
      setName(getDefaultName(type));
    }
  }, [type, name]);

  async function loadSources(authToken: string) {
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/api/data-sources`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (!response.ok) {
      setError("We could not load the current source inventory.");
      return;
    }

    const payload = (await response.json()) as DataSource[];
    setSources(payload);
    setStatus(payload.length ? `${payload.length} sources available.` : "No sources configured yet.");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    let config: Record<string, unknown>;
    try {
      config = JSON.parse(configValue) as Record<string, unknown>;
    } catch {
      setError("Configuration JSON must be valid before the source can be saved.");
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
      setError("The source could not be created. Review the payload and try again.");
      return;
    }

    setName(getDefaultName(type));
    await loadSources(token);
  }

  async function handleTest(id: string) {
    setError("");
    const response = await fetch(`${getApiBaseUrl()}/api/data-sources/${id}/test-connection`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setError("The connection test did not complete successfully.");
      return;
    }

    await loadSources(token);
  }

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/pipelines" prefetch={false}>
            Run pipelines
          </Link>
          <Link className={workspace.actionLink} href="/analytics" prefetch={false}>
            View analytics
          </Link>
        </>
      }
      description="Maintain the source catalog for commerce, CRM, marketing, support, and file-based feeds before they enter the warehouse."
      eyebrow="Source management"
      title="Data sources"
    >
      <section className={workspace.splitGrid}>
        <form className={`${workspace.panel} ${workspace.stack}`} onSubmit={handleCreate}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Register a source</h2>
              <p className={workspace.panelDescription}>
                Define the feed type, its cadence, and the connection payload used by the ingestion flow.
              </p>
            </div>
            <span className={workspace.neutralPill}>Config JSON</span>
          </div>

          <label className={workspace.field}>
            Source name
            <input
              className={workspace.input}
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>

          <label className={workspace.field}>
            Source type
            <select
              className={workspace.select}
              onChange={(event) => {
                const nextType = event.target.value as SourceType;
                setType(nextType);
                setName(getDefaultName(nextType));
              }}
              value={type}
            >
              {sourceTypes.map((sourceType) => (
                <option key={sourceType} value={sourceType}>
                  {sourceType}
                </option>
              ))}
            </select>
          </label>

          <label className={workspace.field}>
            Refresh cadence
            <input
              className={workspace.input}
              onChange={(event) => setSchedule(event.target.value)}
              value={schedule}
            />
          </label>

          <label className={workspace.field}>
            Connection payload
            <textarea
              className={workspace.textarea}
              onChange={(event) => setConfigValue(event.target.value)}
              rows={8}
              value={configValue}
            />
          </label>

          <p className={workspace.fieldHint}>{getConfigHint(type)}</p>
          {error ? <p className={workspace.error}>{error}</p> : null}

          <div className={workspace.actionsRow}>
            <button className={workspace.primaryButton} type="submit">
              Save source
            </button>
          </div>
        </form>

        <section className={`${workspace.panel} ${workspace.stack}`} aria-label="Registered data sources">
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Source inventory</h2>
              <p className={workspace.panelDescription}>
                Review the current connection state before triggering extraction or refresh work.
              </p>
            </div>
            <span className={workspace.neutralPill}>{status}</span>
          </div>

          {sources.length ? (
            <div className={workspace.stack}>
              {sources.map((source) => (
                <article className={workspace.listItem} key={source.id}>
                  <div className={workspace.helperRow}>
                    <span className={statusClassName(source.status)}>{source.status}</span>
                    <button
                      className={workspace.secondaryButton}
                      onClick={() => handleTest(source.id)}
                      type="button"
                    >
                      Test connection
                    </button>
                  </div>
                  <strong className={workspace.itemTitle}>{source.name}</strong>
                  <p className={workspace.itemMeta}>
                    {source.type} · {source.schedule}
                    {source.lastConnectionTestAt
                      ? ` · tested ${new Date(source.lastConnectionTestAt).toLocaleString()}`
                      : ""}
                  </p>
                  <p className={workspace.message}>
                    {source.lastConnectionMessage ?? "No connection result has been recorded yet."}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <p className={workspace.emptyState}>
              No sources are registered yet. Start with a CSV feed or a line-of-business connector.
            </p>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function getDefaultName(type: SourceType) {
  switch (type) {
    case "CSV":
      return "Orders CSV feed";
    case "CRM":
      return "Pipeline CRM";
    case "MARKETING":
      return "Paid media performance";
    case "SUPPORT":
      return "Customer support queue";
    default:
      return "North America Commerce";
  }
}

function getConfigTemplate(type: SourceType) {
  if (type === "CSV") {
    return JSON.stringify({ path: "./database/seeds/demo-orders.csv" }, null, 2);
  }

  return JSON.stringify(
    {
      provider: `${type.toLowerCase()}-primary`,
      apiKey: "replace-with-credential",
    },
    null,
    2,
  );
}

function getConfigHint(type: SourceType) {
  if (type === "CSV") {
    return "Use a repository-relative file path for batch imports packaged with the ETL worker image.";
  }

  return "Store only the connection payload expected by the backend connector. Replace sample keys with managed credentials in production.";
}

function statusClassName(status: DataSource["status"]) {
  if (status === "CONNECTED") {
    return workspace.statusPill;
  }

  if (status === "FAILED") {
    return workspace.dangerPill;
  }

  return workspace.neutralPill;
}
