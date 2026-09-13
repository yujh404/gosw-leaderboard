import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
export const metadata: Metadata = {
  title: "교사 로그인 | GOSW 2026",
  robots: { index: false, follow: false },
};
export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/admin");
  return <LoginForm />;
}
