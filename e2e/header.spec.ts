import { test, expect } from "@playwright/test";

test("mobile header keeps branding, theme selection, and navigation on one row", async ({
  page,
}) => {
  for (const path of ["/", "/admin/login"]) {
    await page.goto(path);
    const trigger = page.getByRole("button", { name: /^색상 테마:/ });
    await trigger.click();
    await page
      .getByRole("menuitemradio", { name: "아이보리 · 오렌지", exact: true })
      .click();
    for (const width of [320, 360, 375, 390, 430, 600]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(page.locator(".header-link svg")).toBeVisible();
      const selectors = [".brand", ".theme-trigger", ".header-link"];
      const boxes = [];
      for (const selector of selectors) {
        const element = page.locator(selector);
        await expect(element).toBeVisible();
        const box = await element.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        expect(box!.height).toBeGreaterThanOrEqual(44);
        boxes.push(box!);
      }
      const [brand, theme, link] = boxes;
      expect(
        Math.abs(brand.y + brand.height / 2 - theme.y - theme.height / 2),
      ).toBeLessThan(1);
      expect(
        Math.abs(theme.y + theme.height / 2 - link.y - link.height / 2),
      ).toBeLessThan(1);
      expect(brand.x + brand.width).toBeLessThanOrEqual(theme.x);
      await trigger.click();
      const layer = page.getByRole("menu", { name: "테마 선택" });
      await expect(layer.getByRole("menuitemradio")).toHaveCount(6);
      const layerBox = await layer.boundingBox();
      expect(layerBox).not.toBeNull();
      expect(layerBox!.x).toBeGreaterThanOrEqual(0);
      expect(layerBox!.x + layerBox!.width).toBeLessThanOrEqual(width);
      expect(layerBox!.y + layerBox!.height).toBeLessThanOrEqual(844);
      await page.keyboard.press("Escape");
      await expect(layer).toHaveCount(0);
      expect(theme.x + theme.width).toBeLessThanOrEqual(link.x);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
