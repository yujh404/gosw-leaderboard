import { expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/lib/password";

it("verifies a salted password and rejects wrong passwords or malformed hashes", async () => {
  const password = "Test-only-password-2026!";
  const [first, second] = await Promise.all([
    hashPassword(password),
    hashPassword(password),
  ]);
  expect(first).not.toBe(second);
  expect(await verifyPassword(password, first)).toBe(true);
  expect(await verifyPassword("wrong", first)).toBe(false);
  expect(await verifyPassword(password, "bad:hash")).toBe(false);
});
