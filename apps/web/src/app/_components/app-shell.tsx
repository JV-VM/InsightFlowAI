"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, readSession } from "../../lib/auth";
import styles from "./app-shell.module.scss";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Sources", href: "/sources" },
  { label: "Pipelines", href: "/pipelines" },
  { label: "Analytics", href: "/analytics" },
  { label: "AI Analyst", href: "/ai" },
  { label: "Reports", href: "/reports" },
];

type AppShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const session = readSession();

  function handleLogout() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Primary navigation">
        <div className={styles.brandBlock}>
          <Link className={styles.brand} href="/" prefetch={false}>
            InsightFlow AI
          </Link>
          <p className={styles.brandMeta}>Revenue operations workspace</p>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className={pathname === item.href ? styles.activeNav : styles.navItem}
              href={item.href}
              key={item.href}
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.identity}>
          <div>
            <span className={styles.identityLabel}>Signed in as</span>
            <strong>{session?.user.name ?? "Workspace user"}</strong>
            <p>{session?.user.email ?? "Session unavailable"}</p>
          </div>
          <button className={styles.logout} onClick={handleLogout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <section className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.description}>{description}</p>
          </div>
          {actions ? <div className={styles.actions}>{actions}</div> : null}
        </header>

        <div className={styles.content}>{children}</div>
      </section>
    </main>
  );
}
