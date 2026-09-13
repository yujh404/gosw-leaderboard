import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { readBoard } from "@/lib/repository";
import { AdminDashboard } from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "경기 운영 | GOSW 2026",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <AdminDashboard initial={await readBoard()} />;
}
