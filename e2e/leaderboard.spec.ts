import { test, expect } from "@playwright/test";
import sharp from "sharp";

const origin = "http://localhost:3108";
test("teacher manages events; independent student screens receive rankings, photos and celebrations", async ({
  page,
  browser,
}) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.screenshot({
    path: "test-results/login-desktop.png",
    fullPage: true,
  });
  await page.getByLabel("교사 아이디").fill("teacher-test");
  await page.getByLabel("비밀번호", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "관리자 로그인" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "아이디 또는 비밀번호" }),
  ).toBeVisible();
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("E2e-only-sports-2026!");
  await page.getByRole("button", { name: "관리자 로그인" }).click();
  await expect(page).toHaveURL(/\/admin$/);

  await page.getByRole("button", { name: "첫 종목 추가하기" }).click();
  await page.getByLabel("종목 이름").fill("반 대항 이어달리기");
  await page.getByLabel("경기 상태").selectOption("live");
  await page
    .getByLabel("경기 설명", { exact: true })
    .fill("마지막 주자까지, 우리 반의 마음을 이어 달려요.");
  await page
    .getByLabel("경기 규칙")
    .fill(
      "1. 각 반 대표 6명이 참가합니다.\n2. 주자 간 바통 전달 구역을 지켜 주세요.",
    );
  const photo = await sharp({
    create: { width: 320, height: 200, channels: 3, background: "#527b35" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("종목 사진 업로드").setInputFiles({
    name: "sports.png",
    mimeType: "image/png",
    buffer: photo,
  });
  await expect(page.getByAltText("종목 사진 미리보기")).toBeVisible();
  await page.getByRole("button", { name: "종목 등록", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "점수 입력", exact: true }).click();
  for (const [index, points] of [100, 80, 60, 40, 20].entries())
    await page.getByLabel(`1학년 ${index + 1}반`).fill(String(points));
  await page.getByRole("button", { name: "점수 저장", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "종목 추가", exact: true }).click();
  await page.getByLabel("종목 이름").fill("줄다리기");
  await page
    .getByLabel("경기 설명", { exact: true })
    .fill("다섯 반의 힘과 호흡이 하나가 되는 순간.");
  await page.getByRole("button", { name: "종목 등록", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page
    .getByRole("button", { name: "줄다리기 위로 이동", exact: true })
    .click();
  await expect(page.locator(".admin-event").first()).toContainText("줄다리기");

  const studentContext = await browser.newContext();
  const eventContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const student = await studentContext.newPage();
  const eventStudent = await eventContext.newPage();
  student.on("pageerror", (error) => browserErrors.push(error.message));
  eventStudent.on("pageerror", (error) => browserErrors.push(error.message));
  await student.goto("/");
  await student.getByRole("tab", { name: "종합 순위", exact: true }).focus();
  await student.keyboard.press("ArrowRight");
  await expect(
    student.getByRole("tab", { name: "줄다리기", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await student.keyboard.press("Home");
  await expect(
    student.getByRole("tab", { name: "종합 순위", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await eventStudent.goto("/");
  await eventStudent.getByRole("tab", { name: "반 대항 이어달리기" }).click();
  await expect(student.getByTestId("rank-1")).toHaveAttribute("data-rank", "1");
  await expect(eventStudent.getByTestId("rank-5")).toHaveAttribute(
    "data-rank",
    "5",
  );
  await eventStudent.getByRole("button", { name: "경기 안내" }).click();
  await expect(eventStudent.getByRole("dialog")).toContainText(
    "바통 전달 구역",
  );
  await expect(eventStudent.getByRole("dialog").locator("img")).toBeVisible();
  await eventStudent.getByRole("button", { name: "닫기", exact: true }).click();

  const relay = page.locator(".admin-event").filter({
    has: page.getByRole("heading", {
      name: "반 대항 이어달리기",
      exact: true,
    }),
  });
  await relay.getByRole("button", { name: "점수 입력", exact: true }).click();
  await page.getByLabel("1학년 5반").fill("150");
  await page.getByRole("button", { name: "점수 저장", exact: true }).click();
  await expect(student.getByTestId("rank-5")).toHaveAttribute("data-rank", "1");
  await expect(eventStudent.getByTestId("rank-5")).toHaveAttribute(
    "data-rank",
    "1",
  );
  await expect(student.getByRole("status")).toContainText("5반, 1위로 상승!");
  await expect(eventStudent.getByRole("status")).toContainText(
    "5반, 1위로 상승!",
  );
  await expect(student.locator("canvas")).toBeVisible();
  await student.screenshot({
    path: "test-results/leaderboard-desktop.png",
    fullPage: true,
  });
  await eventStudent.screenshot({
    path: "test-results/leaderboard-mobile.png",
    fullPage: true,
  });
  expect(
    await eventStudent.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await student.getByRole("button", { name: "함께 보기", exact: true }).click();
  await expect(
    student.getByRole("dialog").locator("svg[role=img], .share-qr svg"),
  ).toBeVisible();
  await expect(student.getByRole("dialog")).toContainText(origin);
  const download = student.waitForEvent("download");
  await student.getByRole("button", { name: "QR 저장" }).click();
  expect((await download).suggestedFilename()).toBe(
    "GOSW-2026-리더보드-QR.svg",
  );
  await student.getByRole("button", { name: "닫기", exact: true }).click();

  const snapshot = await (await page.request.get("/api/board")).json();
  const relayEvent = snapshot.events.find(
    (event: { name: string }) => event.name === "반 대항 이어달리기",
  );
  const stale = {
    scores: { 1: 100, 2: 80, 3: 60, 4: 40, 5: 150 },
    version: relayEvent.version - 1,
  };
  expect(
    (
      await page.request.put(`/api/events/${relayEvent.id}/scores`, {
        headers: { Origin: origin },
        data: stale,
      })
    ).status(),
  ).toBe(409);
  expect(
    (
      await student.request.put(`/api/events/${relayEvent.id}/scores`, {
        headers: { Origin: origin },
        data: { ...stale, version: relayEvent.version },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await page.request.put(`/api/events/${relayEvent.id}/scores`, {
        headers: { Origin: "https://attacker.example" },
        data: stale,
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await page.request.put(`/api/events/${relayEvent.id}/scores`, {
        headers: { Origin: origin },
        data: {
          scores: { ...stale.scores, 1: -1 },
          version: relayEvent.version,
        },
      })
    ).status(),
  ).toBe(400);

  await relay.getByRole("button", { name: "종목 수정" }).click();
  await page.getByLabel("경기 상태").selectOption("completed");
  await page.getByRole("button", { name: "변경사항 저장" }).click();
  await expect(relay.getByText("완료", { exact: true })).toBeVisible();
  await expect(relay.getByRole("button", { name: "종목 수정" })).toBeFocused();
  await expect(
    eventStudent.locator(".ranking-heading").getByText("완료", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/admin-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/admin-mobile.png",
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await student.route("**/api/board", (route) => route.abort());
  await expect(student.getByText("연결 확인중", { exact: true })).toBeVisible();
  await expect(student.getByTestId("rank-5")).toHaveAttribute("data-rank", "1");
  await student.unroute("**/api/board");
  await expect(student.getByText("LIVE SCORE", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(
    (
      await page.request.post("/api/events", {
        headers: { Origin: origin },
        data: {},
      })
    ).status(),
  ).toBe(401);
  expect(browserErrors).toEqual([]);
  await studentContext.close();
  await eventContext.close();
});

test("login attempts are limited persistently", async ({ request }) => {
  let lastStatus = 0;
  for (let i = 0; i < 11; i++)
    lastStatus = (
      await request.post("/api/auth/login", {
        headers: { Origin: origin },
        data: { username: "teacher-test", password: "wrong-password" },
      })
    ).status();
  expect(lastStatus).toBe(429);
});
