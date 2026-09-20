import { test, expect } from "@playwright/test";
import { THEME_STORAGE_KEY } from "../src/lib/theme";

test("themes default to pink, persist across pages, and synchronize other tabs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const selector = page.getByRole("combobox", { name: "색상 테마" });
  await expect(selector).toHaveValue("pink");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 243, 247)",
  );

  for (const [theme, background, accent] of [
    ["mint", "rgb(242, 248, 243)", "rgb(22, 120, 107)"],
    ["sky", "rgb(241, 246, 252)", "rgb(53, 104, 200)"],
    ["pink", "rgb(255, 243, 247)", "rgb(180, 60, 107)"],
    ["lime", "rgb(247, 250, 238)", "rgb(96, 117, 31)"],
    ["gray", "rgb(245, 246, 247)", "rgb(88, 97, 112)"],
    ["ivory", "rgb(250, 247, 240)", "rgb(176, 87, 45)"],
  ]) {
    await selector.selectOption(theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      background,
    );
    await expect(
      page.getByRole("tab", { name: "종합 순위", exact: true }),
    ).toHaveCSS("background-color", accent);
    await expect(page.locator(".hero-spark svg")).toHaveCSS("stroke", accent);
    await page.reload();
    await expect(selector).toHaveValue(theme);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      background,
    );
  }
  await selector.selectOption("mint");
  await page.reload();
  await expect(selector).toHaveValue("mint");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(242, 248, 243)",
  );

  await page.getByRole("button", { name: "함께 보기", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await page.getByRole("button", { name: "닫기", exact: true }).click();
  await page.getByRole("link", { name: "교사 로그인" }).click();
  await expect(selector).toHaveValue("mint");

  const other = await page.context().newPage();
  await other.goto("/admin/login");
  await expect(other.getByRole("combobox", { name: "색상 테마" })).toHaveValue(
    "mint",
  );
  await selector.selectOption("sky");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "sky");
  await expect(other.getByRole("combobox", { name: "색상 테마" })).toHaveValue(
    "sky",
  );
  await other.close();

  await page.setViewportSize({ width: 320, height: 780 });
  await expect(selector).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await selector.selectOption("ivory");
  await page.reload();
  await expect(selector).toHaveValue("ivory");
  expect(errors).toEqual([]);
});

test("saved theme colors apply before the application JavaScript loads", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "gray"),
    THEME_STORAGE_KEY,
  );
  await page.route("**/_next/static/**/*.js", (route) => route.abort());
  await page.goto("/admin/login");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "gray");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(245, 246, 247)",
  );
});

for (const storage of ["invalid", "blocked"] as const) {
  test(`theme selection works with ${storage} saved preferences`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(
      ({ key, storage }) => {
        if (storage === "invalid") {
          localStorage.setItem(key, "unknown-theme");
        } else {
          for (const method of ["getItem", "setItem"] as const) {
            Object.defineProperty(Storage.prototype, method, {
              value() {
                throw new DOMException("Storage disabled", "SecurityError");
              },
            });
          }
        }
      },
      { key: THEME_STORAGE_KEY, storage },
    );
    await page.goto("/admin/login");
    const selector = page.getByRole("combobox", { name: "색상 테마" });
    await expect(selector).toHaveValue("pink");
    await selector.selectOption("mint");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(242, 248, 243)",
    );
    await expect(selector).toHaveValue("mint");
    expect(errors).toEqual([]);
  });
}
