"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearSession, readSession } from "../../lib/auth";
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
        throw new Error("Unable to answer question");
      }

      setAnswer(payload);
      await loadAudit();
    } catch {
      setError("Unable to reach the AI analyst service");
    } finally {
      setIsAsking(false);
    }
  }

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 5</p>
          <h1>AI Analyst</h1>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/analytics">Analytics</Link>
          <button onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </header>

      <section className={styles.layout}>
        <section className={styles.askPanel}>
          <form onSubmit={handleSubmit}>
            <label>
              Question
              <textarea
                onChange={(event) => setQuestion(event.target.value)}
                rows={4}
                value={question}
              />
            </label>
            <button disabled={isAsking || !question.trim()} type="submit">
              {isAsking ? "Asking..." : "Ask analyst"}
            </button>
          </form>

          <div className={styles.suggestions}>
            {suggestions.map((item) => (
              <button key={item} onClick={() => setQuestion(item)} type="button">
                {item}
              </button>
            ))}
          </div>

          {error ? <p className={styles.error}>{error}</p> : null}
        </section>

        <section className={styles.answerPanel}>
          <h2>Answer</h2>
          {answer ? (
            <>
              <div className={styles.statusLine}>
                <span>{answer.status}</span>
                {answer.intent ? <strong>{answer.intent}</strong> : null}
              </div>
              <p>{answer.summary}</p>
              {answer.sqlPreview ? (
                <pre>
                  <code>{answer.sqlPreview}</code>
                </pre>
              ) : null}
              <ResultTable rows={answer.data} />
            </>
          ) : (
            <p className={styles.empty}>Ask a supported analytics question to see results.</p>
          )}
        </section>

        <section className={styles.auditPanel}>
          <h2>Audit log</h2>
          {auditItems.length ? (
            <ol>
              {auditItems.map((item) => (
                <li key={item.id}>
                  <span>{item.status}</span>
                  <strong>{item.question}</strong>
                  <p>{item.summary}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>No analyst questions recorded yet.</p>
          )}
        </section>
      </section>
    </main>
  );
}

function ResultTable({ rows }: { rows: Record<string, string | number | null>[] }) {
  if (!rows.length) {
    return null;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className={styles.tableWrap}>
      <table>
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
