import { test, expect } from "@playwright/test";

test("mobile hero keeps the trophy and its banner inside the visible area", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [320, 375, 390, 430, 768]) {
    await page.setViewportSize({ width, height: 844 });
    const hero = await page.locator(".hero").boundingBox();
    expect(hero).not.toBeNull();
    for (const selector of [".trophy-plinth", ".floating-label"]) {
      const decoration = page.locator(selector);
      await expect(decoration).toBeVisible();
      const bounds = await decoration.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(hero!.x);
      expect(bounds!.y).toBeGreaterThanOrEqual(hero!.y);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        hero!.x + hero!.width,
      );
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(
        hero!.y + hero!.height,
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
