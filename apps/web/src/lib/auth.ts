export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export type AuthMode = "login" | "register";

const sessionKey = "insightflow.auth";

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
}

export function readSession(): AuthResponse | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawSession = window.localStorage.getItem(sessionKey);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthResponse;
  } catch {
    window.localStorage.removeItem(sessionKey);
    return null;
  }
}

export function writeSession(session: AuthResponse) {
  window.localStorage.setItem(sessionKey, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(sessionKey);
}

export async function authenticate(
  mode: AuthMode,
  payload: { name?: string; email: string; password: string },
) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/${mode}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof body?.message === "string"
        ? body.message
        : "Authentication request failed";
    throw new Error(message);
  }

  return body as AuthResponse;
}

export async function fetchProfile(token: string) {
  const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Session expired");
  }

  return (await response.json()) as AuthUser;
}
