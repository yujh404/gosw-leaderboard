"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { jsonBody, requestJson } from "@/lib/client";
import { Header, SparkIcon } from "./ui";

export function LoginForm() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await requestJson("/api/auth/login", {
        method: "POST",
        ...jsonBody({
          username: form.get("username"),
          password: form.get("password"),
        }),
      });
      router.replace("/admin");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "로그인하지 못했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Header admin />
      <main className="login-page">
        <div className="login-art" aria-hidden="true">
          <span>
            FOR THE
            <br />
            <em>TEAM.</em>
          </span>
          <i>
            <SparkIcon />
          </i>
          <p>THE PEOPLE BEHIND THE MOMENT</p>
        </div>
        <div className="login-card">
          <span className="login-symbol">
            <LockKeyhole size={26} />
          </span>
          <div className="eyebrow subtle">TEACHER’S DESK</div>
          <h1>멋진 경기를 만드는 곳.</h1>
          <p className="muted">
            교사 계정으로 로그인하고
            <br />
            우리 학생들의 빛나는 순간을 기록해 주세요.
          </p>
          <form onSubmit={submit}>
            <label htmlFor="username">교사 아이디</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="아이디를 입력해 주세요"
              required
              maxLength={100}
            />
            <label htmlFor="password">비밀번호</label>
            <div className="password-field">
              <input
                id="password"
                name="password"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="비밀번호를 입력해 주세요"
                required
                maxLength={256}
              />
              <button
                type="button"
                aria-label={show ? "비밀번호 숨기기" : "비밀번호 표시"}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <button className="button primary login-submit" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <>
                  관리자 로그인
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
          <p className="secure-note">
            <ShieldCheck size={14} />
            교사 전용 · 학생은 로그인 없이 관람할 수 있어요.
          </p>
          <Link href="/" className="back-link">
            <ArrowLeft size={15} />
            리더보드로 돌아가기
          </Link>
        </div>
      </main>
    </>
  );
}
