"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import { getApiBaseUrl, readSession } from "../../lib/auth";

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
  const connectedSources = sources.filter((source) => source.status === "CONNECTED");

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
      setError("Pipeline data could not be loaded from the API.");
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
      setError("Connect at least one source before running the orders pipeline.");
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
      setError("The ETL run did not complete. Review the worker and API logs.");
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
      setError("The selected job log could not be loaded.");
      return;
    }

    setSelectedJob((await response.json()) as EtlJob);
  }

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/sources" prefetch={false}>
            Source inventory
          </Link>
          <Link className={workspace.actionLink} href="/analytics" prefetch={false}>
            Analytics output
          </Link>
        </>
      }
      description="Execute the orders pipeline, review the latest ingestion runs, and inspect stage-level log output from the ETL service."
      eyebrow="Pipeline operations"
      title="Pipeline runs"
    >
      <section className={workspace.grid}>
        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Launch a run</h2>
              <p className={workspace.panelDescription}>
                Only connected sources are available for execution.
              </p>
            </div>
            <span className={workspace.neutralPill}>{connectedSources.length} ready</span>
          </div>

          <div className={workspace.stack}>
            <label className={workspace.field}>
              Connected source
              <select
                className={workspace.select}
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

            <div className={workspace.actionsRow}>
              <button
                className={workspace.primaryButton}
                disabled={isRunning || !selectedSourceId}
                onClick={handleRun}
                type="button"
              >
                {isRunning ? "Running pipeline..." : "Run orders pipeline"}
              </button>
            </div>

            {error ? <p className={workspace.error}>{error}</p> : null}
          </div>
        </article>

        <article className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Run summary</h2>
              <p className={workspace.panelDescription}>
                Select any recent execution to inspect its processing detail.
              </p>
            </div>
            <span className={workspace.neutralPill}>{jobs.length} recent jobs</span>
          </div>

          <div className={workspace.summaryRow}>
            <span className={workspace.statusPill}>Orders pipeline</span>
            <span className={workspace.neutralPill}>
              {selectedJob ? selectedJob.status : "No job selected"}
            </span>
          </div>
        </article>

        <section className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Recent jobs</h2>
              <p className={workspace.panelDescription}>
                Each job includes warehouse load counts and stage logs.
              </p>
            </div>
          </div>
          {jobs.length ? (
            <div className={workspace.stack}>
              {jobs.map((job) => (
                <button
                  className={`${workspace.listItem} ${
                    selectedJob?.id === job.id ? workspace.selectedItem : ""
                  }`}
                  key={job.id}
                  onClick={() => handleSelectJob(job.id)}
                  type="button"
                >
                  <span className={statusClassName(job.status)}>{job.status}</span>
                  <strong className={workspace.itemTitle}>
                    {job.dataSourceName ?? "Removed source"}
                  </strong>
                  <p className={workspace.itemMeta}>
                    {job.pipeline} · {job.processedRows} processed · {job.rejectedRows} rejected
                  </p>
                  <p className={workspace.message}>
                    {new Date(job.createdAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className={workspace.emptyState}>
              No ETL run has been recorded yet. Start with a connected source.
            </p>
          )}
        </section>

        <section className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Execution log</h2>
              <p className={workspace.panelDescription}>
                Track what the worker did across extract, validate, transform, and load stages.
              </p>
            </div>
          </div>

          {selectedJob ? (
            <div className={workspace.stack}>
              <div className={workspace.summaryRow}>
                <span className={statusClassName(selectedJob.status)}>{selectedJob.status}</span>
                <span className={workspace.neutralPill}>
                  {selectedJob.processedRows} processed
                </span>
                <span className={workspace.neutralPill}>
                  {selectedJob.rejectedRows} rejected
                </span>
              </div>

              {(selectedJob.logs ?? []).length ? (
                <ol className={workspace.cleanList}>
                  {(selectedJob.logs ?? []).map((log) => (
                    <li className={workspace.listItem} key={log.id}>
                      <span
                        className={
                          log.level === "ERROR"
                            ? workspace.dangerPill
                            : log.level === "WARN"
                              ? workspace.neutralPill
                              : workspace.statusPill
                        }
                      >
                        {log.level}
                      </span>
                      <strong className={workspace.itemTitle}>{log.stage}</strong>
                      <p className={workspace.message}>{log.message}</p>
                      <p className={workspace.itemMeta}>
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className={workspace.emptyState}>
                  This job returned without any persisted stage logs.
                </p>
              )}
            </div>
          ) : (
            <p className={workspace.emptyState}>Choose a job from the left to inspect its log.</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function statusClassName(status: EtlJob["status"]) {
  if (status === "SUCCEEDED") {
    return workspace.statusPill;
  }

  if (status === "FAILED") {
    return workspace.dangerPill;
  }

  return workspace.neutralPill;
}
