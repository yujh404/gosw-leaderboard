"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="error-page">
      <h1>잠시, 타임아웃!</h1>
      <p>화면을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
      <button className="button primary" onClick={reset}>
        다시 연결하기
      </button>
    </main>
  );
}
