import "server-only";
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";
import { HttpError } from "./errors";
import { verifyPassword } from "./password";

const COOKIE_NAME = "sports_session";
const SESSION_SECONDS = 60 * 60 * 12;
const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");

export async function isAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const { rowCount } = await getDb().query(
    "SELECT 1 FROM sessions WHERE token_hash=$1 AND expires_at > now()",
    [digest(token)],
  );
  return rowCount === 1;
}

export async function requireTeacher() {
  if (!(await isAuthenticated()))
    throw new HttpError(401, "로그인이 만료되었습니다. 다시 로그인해 주세요.");
}

export async function login(
  username: string,
  password: string,
  request: Request,
) {
  const { ADMIN_USERNAME, ADMIN_PASSWORD_HASH, AUTH_SECRET } = process.env;
  if (
    !ADMIN_USERNAME ||
    !ADMIN_PASSWORD_HASH ||
    !AUTH_SECRET ||
    AUTH_SECRET.length < 32
  ) {
    throw new HttpError(
      503,
      "교사 계정이 아직 설정되지 않았습니다. 운영 담당자에게 문의해 주세요.",
    );
  }
  const ip =
    process.env.VERCEL === "1"
      ? (request.headers.get("x-vercel-forwarded-for") ?? "unknown")
      : "local";
  const key = createHmac("sha256", AUTH_SECRET).update(ip).digest("hex");
  await getDb().query(
    "DELETE FROM login_attempts WHERE window_start < now() - interval '1 hour'",
  );
  const { rows } = await getDb().query<{ attempts: number }>(
    `INSERT INTO login_attempts(key, attempts, window_start) VALUES($1,1,now())
    ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN login_attempts.window_start < now() - interval '10 minutes' THEN 1 ELSE login_attempts.attempts+1 END,
    window_start=CASE WHEN login_attempts.window_start < now() - interval '10 minutes' THEN now() ELSE login_attempts.window_start END RETURNING attempts`,
    [key],
  );
  if (rows[0].attempts > 10)
    throw new HttpError(
      429,
      "로그인 시도가 너무 많습니다. 10분 후 다시 시도해 주세요.",
    );
  const validPassword = await verifyPassword(password, ADMIN_PASSWORD_HASH);
  const validUsername = timingSafeEqual(
    Buffer.from(digest(username)),
    Buffer.from(digest(ADMIN_USERNAME)),
  );
  if (!validPassword || !validUsername)
    throw new HttpError(401, "아이디 또는 비밀번호를 확인해 주세요.");
  await getDb().query("DELETE FROM sessions WHERE expires_at <= now()");
  const cookieStore = await cookies();
  const oldToken = cookieStore.get(COOKIE_NAME)?.value;
  if (oldToken)
    await getDb().query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(oldToken),
    ]);
  const token = randomBytes(32).toString("hex");
  await getDb().query(
    "INSERT INTO sessions(token_hash, expires_at) VALUES($1,$2)",
    [digest(token), new Date(Date.now() + SESSION_SECONDS * 1000)],
  );
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token)
    await getDb().query("DELETE FROM sessions WHERE token_hash=$1", [
      digest(token),
    ]);
  cookieStore.delete(COOKIE_NAME);
}
