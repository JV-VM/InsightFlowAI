"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import workspace from "../workspace.module.scss";
import { readSession } from "../../lib/auth";
import styles from "./page.module.scss";

type Answer = {
  question: string;
  status: "answered" | "blocked" | "unsupported";
  intent: string | null;
  summary: string;
  sqlPreview: string | null;
  data: Record<string, string | number | null>[];
};

type AuditItem = {
  id: string;
  question: string;
  status: string;
  intent: string | null;
  summary: string;
  created_at?: string;
  createdAt?: string;
};

function getAiBaseUrl() {
  if (typeof window !== "undefined") {
    const runtimeUrl = window.__INSIGHTFLOW_CONFIG__?.aiBaseUrl;

    if (runtimeUrl) {
      return runtimeUrl;
    }
  }

  return process.env.NEXT_PUBLIC_AI_URL ?? "http://localhost:8002";
}

export default function AiAnalystPage() {
  const router = useRouter();
  const [question, setQuestion] = useState("Summarize sales performance.");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [error, setError] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    if (!readSession()) {
      router.replace("/login");
      return;
    }

    void loadSuggestions();
    void loadAudit();
  }, [router]);

  async function loadSuggestions() {
    const response = await fetch(`${getAiBaseUrl()}/ai/suggested-questions`);

    if (response.ok) {
      const payload = (await response.json()) as { items: string[] };
      setSuggestions(payload.items);
    }
  }

  async function loadAudit() {
    const response = await fetch(`${getAiBaseUrl()}/ai/audit-log`);

    if (response.ok) {
      const payload = (await response.json()) as { items: AuditItem[] };
      setAuditItems(payload.items);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsAsking(true);

    try {
      const response = await fetch(`${getAiBaseUrl()}/ai/question`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });
      const payload = (await response.json()) as Answer;

      if (!response.ok) {
        throw new Error();
      }

      setAnswer(payload);
      await loadAudit();
    } catch {
      setError("The AI analyst service could not answer the request right now.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <AppShell
      actions={
        <>
          <Link className={workspace.actionLink} href="/analytics" prefetch={false}>
            Analytics slices
          </Link>
          <Link className={workspace.actionLink} href="/reports" prefetch={false}>
            Reporting contract
          </Link>
        </>
      }
      description="Query the analytics layer through a guarded assistant that only supports read-only analytical intents."
      eyebrow="Analyst assistant"
      title="AI Analyst"
    >
      <section className={workspace.grid}>
        <section className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Ask a question</h2>
              <p className={workspace.panelDescription}>
                Use natural language prompts for supported revenue, product, region, campaign, or daily trend questions.
              </p>
            </div>
            <span className={workspace.statusPill}>Read only</span>
          </div>

          <form className={workspace.stack} onSubmit={handleSubmit}>
            <label className={workspace.field}>
              Question
              <textarea
                className={workspace.textarea}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                value={question}
              />
            </label>
            <div className={workspace.actionsRow}>
              <button
                className={workspace.primaryButton}
                disabled={isAsking || !question.trim()}
                type="submit"
              >
                {isAsking ? "Running query..." : "Ask analyst"}
              </button>
            </div>
          </form>

          <div className={workspace.actionsRow}>
            {suggestions.map((item) => (
              <button
                className={workspace.secondaryButton}
                key={item}
                onClick={() => setQuestion(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          {error ? <p className={workspace.error}>{error}</p> : null}
        </section>

        <section className={workspace.panel}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Answer</h2>
              <p className={workspace.panelDescription}>
                Structured results, query preview, and the resolved intent appear here.
              </p>
            </div>
          </div>

          {answer ? (
            <div className={workspace.stack}>
              <div className={workspace.summaryRow}>
                <span className={statusClassName(answer.status)}>{answer.status}</span>
                {answer.intent ? <span className={workspace.neutralPill}>{answer.intent}</span> : null}
              </div>
              <p className={workspace.message}>{answer.summary}</p>
              {answer.sqlPreview ? (
                <pre className={styles.sqlPreview}>
                  <code>{answer.sqlPreview}</code>
                </pre>
              ) : null}
              <ResultTable rows={answer.data} />
            </div>
          ) : (
            <p className={workspace.emptyState}>
              Submit a supported analytical question to generate a result set.
            </p>
          )}
        </section>

        <section className={`${workspace.panel} ${workspace.fullWidth}`}>
          <div className={workspace.panelHeader}>
            <div>
              <h2 className={workspace.panelTitle}>Audit log</h2>
              <p className={workspace.panelDescription}>
                Every request is logged with its resolved status and summary.
              </p>
            </div>
          </div>

          {auditItems.length ? (
            <ol className={workspace.cleanList}>
              {auditItems.map((item) => (
                <li className={workspace.listItem} key={item.id}>
                  <div className={workspace.summaryRow}>
                    <span className={statusClassName(item.status)}>{item.status}</span>
                    {item.intent ? <span className={workspace.neutralPill}>{item.intent}</span> : null}
                  </div>
                  <strong className={workspace.itemTitle}>{item.question}</strong>
                  <p className={workspace.message}>{item.summary}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={workspace.emptyState}>No analyst questions have been recorded yet.</p>
          )}
        </section>
      </section>
    </AppShell>
  );
}

function ResultTable({ rows }: { rows: Record<string, string | number | null>[] }) {
  if (!rows.length) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className={workspace.tableWrap}>
      <table className={workspace.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{row[column]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function statusClassName(status: string) {
  if (status === "answered") {
    return workspace.statusPill;
  }

  if (status === "blocked") {
    return workspace.dangerPill;
  }

  return workspace.neutralPill;
}
