import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 주인공은, 우리 반. | GOSW 체육대회 2026",
  description:
    "경기오산소프트웨어고등학교 2026 체육대회. 반별 실시간 순위와 종목별 점수를 함께 확인해요!",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <a href="#main-content" className="skip-link">
          본문으로 건너뛰기
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
