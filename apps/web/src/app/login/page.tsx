"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authenticate, AuthMode, readSession, writeSession } from "../../lib/auth";
import styles from "./page.module.scss";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (readSession()) {
      router.replace("/dashboard");
    }
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await authenticate(mode, {
        name: mode === "register" ? name : undefined,
        email,
        password,
      });
      writeSession(session);
      router.replace("/dashboard");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete authentication",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="login-title">
        <div className={styles.copy}>
          <p className={styles.eyebrow}>InsightFlow AI</p>
          <h1 id="login-title">Access the workspace</h1>
          <p>
            Sign in with an existing analyst account or create the first workspace user to start operating the platform.
          </p>
          <ul className={styles.benefits}>
            <li>Monitor source connectivity and ETL execution.</li>
            <li>Review warehouse KPIs, trends, and revenue breakdowns.</li>
            <li>Use the guarded AI analyst for read-only business questions.</li>
          </ul>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.modeSwitch} role="tablist" aria-label="Authentication mode">
            <button
              type="button"
              className={mode === "login" ? styles.activeMode : ""}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? styles.activeMode : ""}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {mode === "register" ? (
            <label>
              Name
              <input
                autoComplete="name"
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                placeholder="Data Operations Lead"
                required
                value={name}
              />
            </label>
          ) : null}

          <label>
            Email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@company.com"
                required
                type="email"
                value={email}
            />
          </label>

          <label>
            Password
              <input
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
                type="password"
                value={password}
            />
          </label>

          {error ? <p className={styles.error}>{error}</p> : null}

          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Working..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
