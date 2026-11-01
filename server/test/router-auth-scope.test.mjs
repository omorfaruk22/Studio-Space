import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { app } from "../dist/app.js";
import { confirmedBookingOverlapRange } from "../dist/lib/booking-overlap.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("public studio detail route is not intercepted by auth middleware", async () => {
  const response = await fetch(`${baseUrl}/api/studios/not-a-mongodb-id`);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, "Invalid studio ID.");
});

test("booking and host listing routes still require authentication", async () => {
  const paths = ["/api/bookings", "/api/my-bookings", "/api/host/bookings", "/api/host/studios"];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 401, `${path} should reject anonymous access`);
  }
});

test("confirmed booking overlap query excludes adjacent slots and catches intersecting slots", () => {
  assert.deepEqual(confirmedBookingOverlapRange("10:00", "11:00"), {
    startTime: { $lt: "11:00" },
    endTime: { $gt: "10:00" },
  });
});
