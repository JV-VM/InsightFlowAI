"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, getApiBaseUrl, readSession } from "../../lib/auth";
import styles from "./page.module.scss";

type DataSource = {
  id: string;
  name: string;
  type: string;
  status: string;
};

type EtlLog = {
  id: string;
  stage: string;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  createdAt: string;
};

type EtlJob = {
  id: string;
  dataSourceId: string | null;
  dataSourceName?: string;
  pipeline: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  processedRows: number;
  rejectedRows: number;
  createdAt: string;
  errorMessage?: string;
  logs?: EtlLog[];
};

export default function PipelinesPage() {
  const router = useRouter();
  const [sources, setSources] = useState<DataSource[]>([]);
  const [jobs, setJobs] = useState<EtlJob[]>([]);
  const [selectedSourceId, setSelectedSourceId] = useState("");
  const [selectedJob, setSelectedJob] = useState<EtlJob | null>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const connectedSources = useMemo(
    () => sources.filter((source) => source.status === "CONNECTED"),
    [sources],
  );

  useEffect(() => {
    const session = readSession();

    if (!session) {
      router.replace("/login");
      return;
    }

    void loadPageData();
  }, [router]);

  useEffect(() => {
    if (!selectedSourceId && connectedSources[0]) {
      setSelectedSourceId(connectedSources[0].id);
    }
  }, [connectedSources, selectedSourceId]);

  async function loadPageData() {
    setError("");
    const [sourceResponse, jobResponse] = await Promise.all([
      fetch(`${getApiBaseUrl()}/api/data-sources`),
      fetch(`${getApiBaseUrl()}/api/etl-jobs`),
    ]);

    if (!sourceResponse.ok || !jobResponse.ok) {
      setError("Unable to load pipeline data");
      return;
    }

    const [sourcePayload, jobPayload] = await Promise.all([
      sourceResponse.json() as Promise<DataSource[]>,
      jobResponse.json() as Promise<EtlJob[]>,
    ]);

    setSources(sourcePayload);
    setJobs(jobPayload);
  }

  async function handleRun() {
    if (!selectedSourceId) {
      setError("Connect a data source before running ETL");
      return;
    }

    setError("");
    setIsRunning(true);

    const response = await fetch(`${getApiBaseUrl()}/api/etl-jobs/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dataSourceId: selectedSourceId, pipeline: "orders" }),
    });
    const payload = (await response.json()) as EtlJob;

    if (!response.ok) {
      setError("Unable to run ETL job");
      setIsRunning(false);
      return;
    }

    setSelectedJob(payload);
    await loadPageData();
    setIsRunning(false);
  }

  async function handleSelectJob(id: string) {
    const response = await fetch(`${getApiBaseUrl()}/api/etl-jobs/${id}`);

    if (!response.ok) {
      setError("Unable to load ETL logs");
      return;
    }

    setSelectedJob((await response.json()) as EtlJob);
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 3</p>
          <h1>Pipeline runs</h1>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/sources">Sources</Link>
          <button onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className={styles.controls}>
        <label>
          Source
          <select
            onChange={(event) => setSelectedSourceId(event.target.value)}
            value={selectedSourceId}
          >
            {connectedSources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name} ({source.type})
              </option>
            ))}
          </select>
        </label>
        <button disabled={isRunning || !selectedSourceId} onClick={handleRun} type="button">
          {isRunning ? "Running..." : "Run orders ETL"}
        </button>
        {error ? <p className={styles.error}>{error}</p> : null}
      </section>

      <section className={styles.layout}>
        <section className={styles.list} aria-label="ETL jobs">
          <h2>Recent jobs</h2>
          {jobs.length ? (
            jobs.map((job) => (
              <button
                className={selectedJob?.id === job.id ? styles.selectedJob : ""}
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                type="button"
              >
                <span>{job.status}</span>
                <strong>{job.dataSourceName ?? "Deleted source"}</strong>
                <small>
                  {job.pipeline} · {job.processedRows} processed ·{" "}
                  {new Date(job.createdAt).toLocaleString()}
                </small>
              </button>
            ))
          ) : (
            <p className={styles.empty}>Run the first ETL job from a connected source.</p>
          )}
        </section>

        <section className={styles.detail} aria-label="ETL job logs">
          <h2>Job log</h2>
          {selectedJob ? (
            <>
              <div className={styles.summary}>
                <span>{selectedJob.status}</span>
                <strong>{selectedJob.processedRows} processed</strong>
                <strong>{selectedJob.rejectedRows} rejected</strong>
              </div>
              <ol>
                {(selectedJob.logs ?? []).map((log) => (
                  <li key={log.id}>
                    <span>{log.level}</span>
                    <strong>{log.stage}</strong>
                    <p>{log.message}</p>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className={styles.empty}>Select a job to inspect stage logs.</p>
          )}
        </section>
      </section>
    </main>
  );
}
