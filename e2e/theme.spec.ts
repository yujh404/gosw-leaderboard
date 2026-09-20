import { test, expect, type Page } from "@playwright/test";
import { THEMES, THEME_STORAGE_KEY } from "../src/lib/theme";

function themeLabel(id: string) {
  return `색상 테마: ${THEMES.find((theme) => theme.id === id)!.label}`;
}

async function selectTheme(page: Page, id: string) {
  await page.getByRole("button", { name: /^색상 테마:/ }).click();
  await page
    .getByRole("menuitemradio", {
      name: THEMES.find((theme) => theme.id === id)!.label,
      exact: true,
    })
    .click();
  await expect(page.getByRole("menu", { name: "테마 선택" })).toHaveCount(0);
}

test("theme layer supports keyboard navigation, dismissal, and focus return", async ({
  page,
}) => {
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /^색상 테마:/ });
  const menu = page.getByRole("menu", { name: "테마 선택" });
  await trigger.focus();
  await trigger.press("Enter");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("menuitemradio", { name: "핑크 · 로즈" }),
  ).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(
    page.getByRole("menuitemradio", { name: "아이보리 · 오렌지" }),
  ).toBeFocused();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "pink");
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ivory");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.press("ArrowUp");
  await expect(
    page.getByRole("menuitemradio", { name: "그레이 · 차콜" }),
  ).toBeFocused();
  await page.keyboard.press("Home");
  await expect(
    page.getByRole("menuitemradio", { name: "핑크 · 로즈" }),
  ).toBeFocused();
  await page.keyboard.press("End");
  await expect(
    page.getByRole("menuitemradio", { name: "그레이 · 차콜" }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();

  await trigger.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("link", { name: "교사 로그인" })).toBeFocused();
  await trigger.click();
  await page.locator(".hero h1").click();
  await expect(menu).toHaveCount(0);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ivory");
});

test("theme layer scrolls within a short viewport without moving the page", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 320 });
  await page.goto("/");
  const trigger = page.getByRole("button", { name: /^색상 테마:/ });
  await trigger.press("ArrowUp");
  const menu = page.getByRole("menu", { name: "테마 선택" });
  const last = page.getByRole("menuitemradio", { name: "그레이 · 차콜" });
  await expect(last).toBeFocused();
  const menuBox = await menu.boundingBox();
  const lastBox = await last.boundingBox();
  expect(menuBox).not.toBeNull();
  expect(lastBox).not.toBeNull();
  expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(320);
  expect(lastBox!.y + lastBox!.height).toBeLessThanOrEqual(
    menuBox!.y + menuBox!.height,
  );
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await last.click();
  await expect(menu).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "gray");
});

test("themes default to pink, persist across pages, and synchronize other tabs", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const selector = page.getByRole("button", { name: /^색상 테마:/ });
  await expect(selector).toHaveAccessibleName(themeLabel("pink"));
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
    await selectTheme(page, theme);
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
    await expect(selector).toHaveAccessibleName(themeLabel(theme));
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      background,
    );
  }
  await selectTheme(page, "mint");
  await page.reload();
  await expect(selector).toHaveAccessibleName(themeLabel("mint"));
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
  await expect(selector).toHaveAccessibleName(themeLabel("mint"));

  const other = await page.context().newPage();
  await other.goto("/admin/login");
  await expect(
    other.getByRole("button", { name: /^색상 테마:/ }),
  ).toHaveAccessibleName(themeLabel("mint"));
  await selectTheme(page, "sky");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "sky");
  await expect(
    other.getByRole("button", { name: /^색상 테마:/ }),
  ).toHaveAccessibleName(themeLabel("sky"));
  await other.close();

  await page.setViewportSize({ width: 320, height: 780 });
  await expect(selector).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await selectTheme(page, "ivory");
  await page.reload();
  await expect(selector).toHaveAccessibleName(themeLabel("ivory"));
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
    const selector = page.getByRole("button", { name: /^색상 테마:/ });
    await expect(selector).toHaveAccessibleName(themeLabel("pink"));
    await selectTheme(page, "mint");
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(242, 248, 243)",
    );
    await expect(selector).toHaveAccessibleName(themeLabel("mint"));
    expect(errors).toEqual([]);
  });
}
