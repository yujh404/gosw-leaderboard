import { api } from "@/lib/http";
import { readBoard } from "@/lib/repository";
export const dynamic = "force-dynamic";
export async function GET() {
  return api(readBoard);
}
