import { test, expect } from "@playwright/test";

test("an already-open board reloads on a new release without looping", async ({
  page,
  request,
}) => {
  const response = await request.get("/api/release");
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toContain("no-store");
  const current = await response.json();
  expect(typeof current.version).toBe("string");
  let version = current.version;
  let releaseChecks = 0;
  let navigations = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame())
      navigations++;
  });
  await page.context().addCookies([
    {
      name: "release-test-cookie",
      value: "must-not-pin-release-check",
      url: "http://localhost:3108",
    },
  ]);
  await page.route("**/api/release", async (route) => {
    expect(route.request().headers().cookie).toBeUndefined();
    releaseChecks++;
    await route.fulfill({ json: { version } });
  });
  await page.goto("/");
  await expect.poll(() => releaseChecks).toBeGreaterThan(0);
  await expect(page.locator("main")).toHaveAttribute(
    "data-app-version",
    current.version,
  );
  const originalNavigations = navigations;
  let checks = releaseChecks;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect.poll(() => releaseChecks).toBeGreaterThan(checks);
  expect(navigations).toBe(originalNavigations);

  version = "new-release-for-regression-check";
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page).toHaveURL(
    /_gosw_release=new-release-for-regression-check/,
  );
  await expect.poll(() => navigations).toBe(originalNavigations + 1);
  checks = releaseChecks;
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect.poll(() => releaseChecks).toBeGreaterThan(checks);
  expect(navigations).toBe(originalNavigations + 1);
});
