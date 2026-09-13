import Link from "next/link";
export default function NotFound() {
  return (
    <main className="error-page">
      <h1>경기장을 벗어났어요.</h1>
      <p>요청한 페이지를 찾을 수 없습니다.</p>
      <Link className="button primary" href="/">
        리더보드로 돌아가기
      </Link>
    </main>
  );
}
