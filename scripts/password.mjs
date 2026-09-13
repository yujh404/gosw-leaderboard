import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";

if (!process.stdin.isTTY)
  throw new Error("Run this command in an interactive terminal.");
let muted = false;
const output = new Writable({
  write(chunk, _encoding, callback) {
    if (!muted) process.stdout.write(chunk);
    callback();
  },
});
const rl = createInterface({ input: process.stdin, output, terminal: true });
process.stdout.write("교사 비밀번호 (12자 이상, 입력 내용 숨김): ");
muted = true;
const password = await rl.question("");
muted = false;
rl.close();
process.stdout.write("\n");
if (password.length < 12 || password.length > 256)
  throw new Error("Password must contain 12 to 256 characters.");
const salt = randomBytes(16).toString("hex");
const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
let env;
try {
  env = await readFile(".env.local", "utf8");
} catch {
  env = await readFile(".env.example", "utf8");
}
function setKey(key, value) {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  env = pattern.test(env)
    ? env.replace(pattern, () => line)
    : `${env}\n${line}\n`;
}
setKey("ADMIN_PASSWORD_HASH", hash);
if (!/^AUTH_SECRET=.{32,}$/m.test(env))
  setKey("AUTH_SECRET", randomBytes(32).toString("hex"));
await writeFile(".env.local", env, { mode: 0o600 });
console.log(
  ".env.local에 비밀번호 해시와 AUTH_SECRET을 저장했습니다. 원문 비밀번호는 저장하지 않습니다.",
);
