const apiBaseUrl = process.env.API_BASE_URL ?? "http://127.0.0.1:3001/api";
const aiBaseUrl = process.env.AI_BASE_URL ?? "http://127.0.0.1:8002";

async function main() {
  await check("API health", async () => {
    const response = await fetch(`${apiBaseUrl}/health`);
    const body = await response.json();
    assert(response.ok && body.status === "ok", "API health failed");
    return body;
  });

  await check("AI health", async () => {
    const response = await fetch(`${aiBaseUrl}/health`);
    const body = await response.json();
    assert(response.ok && body.status === "ok", "AI health failed");
    return body;
  });

  const email = `smoke-${Date.now()}@insightflow.local`;
  const auth = await check("Auth register/login/me", async () => {
    const register = await postJson(`${apiBaseUrl}/auth/register`, {
      name: "Smoke Tester",
      email,
      password: "insightflow",
    });
    assert(register.token, "Register did not return a token");

    const login = await postJson(`${apiBaseUrl}/auth/login`, {
      email,
      password: "insightflow",
    });
    assert(login.token, "Login did not return a token");

    const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
      headers: {
        Authorization: `Bearer ${login.token}`,
      },
    });
    const me = await meResponse.json();
    assert(meResponse.ok && me.email === email, "Profile request failed");

    return { userId: me.id, email };
  });

  const source = await check("CSV source registration", async () => {
    const created = await postJson(`${apiBaseUrl}/data-sources`, {
      name: `Smoke Orders CSV ${Date.now()}`,
      type: "CSV",
      schedule: "manual",
      config: {
        path: "database/seeds/demo-orders.csv",
      },
    });
    assert(created.id, "Source was not created");

    const tested = await postJson(`${apiBaseUrl}/data-sources/${created.id}/test-connection`);
    assert(tested.ok && tested.dataSource.status === "CONNECTED", "Source connection failed");

    return tested.dataSource;
  });

  const job = await check("ETL orders pipeline", async () => {
    const run = await postJson(`${apiBaseUrl}/etl-jobs/run`, {
      dataSourceId: source.id,
      pipeline: "orders",
    });
    assert(run.status === "SUCCEEDED", "ETL job did not succeed");
    assert(run.processedRows === 5, `Expected 5 processed rows, got ${run.processedRows}`);
    assert(Array.isArray(run.logs) && run.logs.length >= 7, "ETL logs missing");
    return { jobId: run.id, processedRows: run.processedRows };
  });

  const analytics = await check("Analytics refresh and KPIs", async () => {
    const refresh = await postJson(`${apiBaseUrl}/analytics/refresh`);
    assert(refresh.factRows >= 5, "Analytics refresh produced no facts");

    const overviewResponse = await fetch(`${apiBaseUrl}/analytics/overview`);
    const overview = await overviewResponse.json();
    assert(overviewResponse.ok, "Analytics overview failed");
    assert(overview.totalRevenue >= 1689, "Unexpected total revenue");
    assert(overview.totalOrders >= 5, "Unexpected order count");

    return overview;
  });

  await check("AI analyst supported and blocked questions", async () => {
    const answer = await postJson(`${aiBaseUrl}/ai/question`, {
      question: "Which products generated the most revenue?",
    });
    assert(answer.status === "answered", "AI analyst did not answer supported question");
    assert(answer.intent === "top_products", "AI analyst classified unexpected intent");

    const blocked = await postJson(`${aiBaseUrl}/ai/question`, {
      question: "drop table analytics.fact_sales",
    });
    assert(blocked.status === "blocked", "AI analyst did not block unsafe question");

    return { answeredIntent: answer.intent, blockedStatus: blocked.status };
  });

  console.log(
    JSON.stringify(
      {
        status: "ok",
        auth,
        sourceId: source.id,
        job,
        analytics,
      },
      null,
      2,
    ),
  );
}

async function postJson(url, payload = {}) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(`${url} failed: ${JSON.stringify(body)}`);
  }

  return body;
}

async function check(label, fn) {
  process.stdout.write(`- ${label}... `);
  const result = await fn();
  process.stdout.write("ok\n");
  return result;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
