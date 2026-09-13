import { Leaderboard } from "@/components/leaderboard";
import { readBoard } from "@/lib/repository";

export const dynamic = "force-dynamic";
export default async function HomePage() {
  let initial = null;
  try {
    initial = await readBoard();
  } catch {
    /* The client shows the connection state and retries. */
  }
  return <Leaderboard initial={initial} />;
}
