const clientBaseUrl = (process.env.CLIENT_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const apiBaseUrl = (process.env.API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");
const checks = [];

async function check(name, url, expectedStatus, { method = "GET", body, headers = {}, validate } = {}) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "follow",
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : undefined;
    } catch {
      data = undefined;
    }

    if (response.status !== expectedStatus) {
      throw new Error(`expected HTTP ${expectedStatus}, received ${response.status}: ${text.slice(0, 180)}`);
    }
    validate?.(data, response);
    checks.push({ name, passed: true, detail: `HTTP ${response.status}` });
  } catch (error) {
    checks.push({ name, passed: false, detail: error instanceof Error ? error.message : String(error) });
  }
}

await check("client home page", clientBaseUrl, 200);
await check("client studio discovery direct load", `${clientBaseUrl}/studios`, 200);
await check("client API proxy configuration", `${clientBaseUrl}/api/auth/config`, 200, {
  validate(data) {
    if (typeof data?.googleEnabled !== "boolean") throw new Error("googleEnabled is missing from the response");
    if (process.env.REQUIRE_GOOGLE_AUTH === "true" && data.googleEnabled !== true) {
      throw new Error("Google OAuth is not enabled through the client API proxy");
    }
  },
});
await check("API health endpoint", `${apiBaseUrl}/api/health`, 200, {
  validate(data) {
    if (data?.status !== "ok" || data?.service !== "studiospace-api") {
      throw new Error("unexpected health response");
    }
    if (process.env.REQUIRE_DATABASE === "true" && data.ready !== true) {
      throw new Error(`database is ${data.database ?? "unknown"}; expected connected`);
    }
  },
});
await check("Google OAuth configuration endpoint", `${apiBaseUrl}/api/auth/config`, 200, {
  validate(data) {
    if (typeof data?.googleEnabled !== "boolean") throw new Error("googleEnabled is missing from the response");
    if (process.env.REQUIRE_GOOGLE_AUTH === "true" && data.googleEnabled !== true) {
      throw new Error("Google OAuth is not enabled on the API");
    }
  },
});
await check("public studio discovery API", `${apiBaseUrl}/api/studios`, 200, {
  headers: { origin: clientBaseUrl },
  validate(data, response) {
    if (!Array.isArray(data?.studios) || !Number.isInteger(data?.total)) {
      throw new Error("expected { studios: [], total: number }");
    }
    if (response.headers.get("access-control-allow-origin") !== clientBaseUrl
      || response.headers.get("access-control-allow-credentials") !== "true") {
      throw new Error("API CORS is not allowing the configured client origin with credentials");
    }
  },
});
await check("invalid public studio ID returns 400", `${apiBaseUrl}/api/studios/not-a-mongodb-id`, 400);

for (const path of ["/api/account", "/api/my-bookings", "/api/host/studios", "/api/host/bookings"]) {
  await check(`protected ${path} rejects anonymous access`, `${apiBaseUrl}${path}`, 401);
}
await check("booking creation rejects anonymous access", `${apiBaseUrl}/api/bookings`, 401, {
  method: "POST",
  body: {},
});

for (const result of checks) {
  console.log(`${result.passed ? "PASS" : "FAIL"} ${result.name}: ${result.detail}`);
}

const failures = checks.filter((result) => !result.passed).length;
console.log(`\n${checks.length - failures}/${checks.length} smoke checks passed.`);
if (failures > 0) process.exitCode = 1;
