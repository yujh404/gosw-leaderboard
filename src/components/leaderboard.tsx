"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import confetti from "canvas-confetti";
import {
  ArrowUp,
  ArrowUpRight,
  CheckCheck,
  Flag,
  Info,
  Maximize2,
  Minimize2,
  QrCode,
  Radio,
  RefreshCw,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { type BoardSnapshot, type RankedClass, CLASSES } from "@/lib/types";
import {
  rankings,
  rankImprovements,
  changedOverallLeaders,
} from "@/lib/ranking";
import { requestJson } from "@/lib/client";
import { Header, Modal, Status, TeamIcon } from "./ui";
import { ShareDialog } from "./share-dialog";

type Celebration = {
  id: number;
  name: string;
  rank: number;
  board: string;
  color: string;
  headline?: string;
};

export function Leaderboard({ initial }: { initial: BoardSnapshot | null }) {
  const [board, setBoard] = useState(initial);
  const [selected, setSelected] = useState("total");
  const [connected, setConnected] = useState(Boolean(initial));
  const [share, setShare] = useState(false);
  const [rules, setRules] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);
  const [screenError, setScreenError] = useState("");
  const [celebration, setCelebration] = useState<Celebration[]>([]);
  const [pendingLeaders, setPendingLeaders] = useState<Celebration[]>([]);
  const [lastSynced, setLastSynced] = useState("");
  const previous = useRef(initial);
  const selection = useRef(selected);
  const rankingSection = useRef<HTMLElement>(null);
  const movingToLeaders = useRef(false);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    selection.current = selected;
  }, [selected]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    let controller: AbortController | undefined;
    let running = false;
    async function poll() {
      if (!active || running) return;
      clearTimeout(timer);
      if (document.hidden) {
        timer = setTimeout(poll, 3000);
        return;
      }
      running = true;
      controller = new AbortController();
      try {
        const next = await requestJson<BoardSnapshot>("/api/board", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10000),
          ]),
        });
        if (!active) return;
        const old = previous.current;
        if (old) {
          const leaders = changedOverallLeaders(old, next);
          const currentId = selection.current;
          const name =
            currentId === "total"
              ? "종합 순위"
              : (next.events.find((event) => event.id === currentId)?.name ??
                "종목 순위");
          const improvements = rankImprovements(old, next, currentId);
          if (leaders.length) {
            const previousRanks = rankings(old);
            movingToLeaders.current = true;
            setSelected("total");
            setRules(false);
            setShare(false);
            setScreenError("");
            setCelebration([]);
            setPendingLeaders(
              leaders.map((team) => ({
                ...team,
                board: "종합 순위",
                headline:
                  leaders.length > 1
                    ? `${team.name}, 공동 1위!`
                    : previousRanks.find(
                          (previousTeam) => previousTeam.id === team.id,
                        )!.rank === 1
                      ? `${team.name}, 현재 1위!`
                      : `${team.name}, 1위로 상승!`,
              })),
            );
          } else if (improvements.length && !movingToLeaders.current)
            setCelebration(
              improvements.map((team) => ({ ...team, board: name })),
            );
        }
        previous.current = next;
        setBoard(next);
        setConnected(true);
        setLastSynced(
          new Date().toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
        );
      } catch {
        if (active) setConnected(false);
      } finally {
        running = false;
        if (active) timer = setTimeout(poll, 3000);
      }
    }
    const refresh = () => {
      if (!document.hidden) void poll();
    };
    void poll();
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      active = false;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, []);

  useEffect(() => {
    const section = rankingSection.current;
    if (!pendingLeaders.length || !section) return;
    let frame = 0;
    let settledFrames = 0;
    movingToLeaders.current = true;
    // Cancel a user-interrupted scroll rather than celebrate away from the ranking.
    const timeout = window.setTimeout(() => {
      cancelAnimationFrame(frame);
      movingToLeaders.current = false;
      setPendingLeaders([]);
    }, 3000);
    function checkPosition() {
      const target = Math.max(
        0,
        Math.min(
          section!.getBoundingClientRect().top + window.scrollY,
          document.documentElement.scrollHeight - window.innerHeight,
        ),
      );
      settledFrames =
        Math.abs(window.scrollY - target) < 2 ? settledFrames + 1 : 0;
      if (settledFrames >= 2) {
        clearTimeout(timeout);
        movingToLeaders.current = false;
        setCelebration(pendingLeaders);
        setPendingLeaders([]);
      } else {
        frame = requestAnimationFrame(checkPosition);
      }
    }
    section.scrollIntoView({
      behavior: reducedMotion ? "instant" : "smooth",
      block: "start",
    });
    frame = requestAnimationFrame(checkPosition);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
      movingToLeaders.current = false;
    };
  }, [pendingLeaders, reducedMotion]);

  useEffect(() => {
    if (!celebration.length) return;
    if (!reducedMotion)
      void confetti({
        particleCount: 120,
        spread: 85,
        origin: { y: 0.64 },
        colors: celebration.map((team) => team.color),
        disableForReducedMotion: true,
      });
    const timer = setTimeout(() => setCelebration([]), 5500);
    return () => {
      clearTimeout(timer);
      confetti.reset();
    };
  }, [celebration, reducedMotion]);

  useEffect(() => {
    const update = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function toggleFullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.documentElement.requestFullscreen)
        await document.documentElement.requestFullscreen();
      else setScreenError("이 브라우저에서는 전체화면을 지원하지 않습니다.");
    } catch {
      setScreenError("전체화면으로 전환하지 못했습니다.");
    }
  }

  const activeEvent = board?.events.find((event) => event.id === selected);
  const activeId = activeEvent ? selected : "total";
  const teams = board ? rankings(board, activeId) : [];
  const live = board?.events.filter((event) => event.status === "live") ?? [];
  const completed =
    board?.events.filter((event) => event.status === "completed").length ?? 0;
  const leader = teams[0];
  const topScore = leader?.score ?? 0;

  return (
    <>
      <Header />
      <main className="page-shell">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="tiny-star">✳</span> 2026 GOSW SPORTS FESTIVAL
            </div>
            <h1>
              오늘의 주인공은,
              <br />
              <span>우리 반.</span>
              <i className="hero-spark">✳</i>
            </h1>
            <p>
              함께 뛰고, 함께 외치고.
              <br className="mobile-break" /> 우리들의 뜨거운 순간을 실시간으로.
            </p>
            <div className="hero-meta">
              <span>
                <Flag size={15} />
                1학년 · 5개 반
              </span>
              <i />
              <span>경기오산소프트웨어고등학교 체육대회</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="orbit orbit-three" />
            <span className="art-star star-one">✳</span>
            <span className="art-star star-two">✦</span>
            <div className="trophy-plinth">
              <Trophy size={120} strokeWidth={1.1} />
            </div>
            <div className="floating-label">
              <Zap size={15} fill="currentColor" /> ALL OUT. ALL IN.
            </div>
            <span className="art-year">26</span>
          </div>
        </section>

        <div className="live-strip">
          <div>
            <span className={`live-dot ${connected ? "" : "offline"}`} />
            <strong>{connected ? "LIVE SCORE" : "연결 확인중"}</strong>
            <span className="live-strip-text">
              {connected
                ? live.length
                  ? `${live.map((event) => event.name).join(" · ")} 경기 진행중`
                  : "우리 반의 다음 순간을 기다리는 중"
                : board
                  ? "연결이 끊겼어요. 마지막 점수를 표시하고 자동으로 재연결합니다."
                  : "점수를 불러오지 못했어요. 자동으로 다시 연결합니다."}
            </span>
          </div>
          <span className="refresh-note">
            <RefreshCw size={12} />
            3초마다 업데이트
          </span>
        </div>

        <section
          ref={rankingSection}
          className="board-section"
          aria-label="리더보드"
        >
          <div className="section-top">
            <div className="section-label">
              <span className="accent-square" />
              THE LEADERBOARD
            </div>
            <div className="board-actions">
              <button className="text-button" onClick={() => setShare(true)}>
                <QrCode size={17} />
                <span>함께 보기</span>
              </button>
              <button
                className="icon-button screen-button"
                onClick={toggleFullScreen}
                aria-label={fullScreen ? "전체화면 종료" : "전체화면"}
              >
                {fullScreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            </div>
          </div>
          <div
            className="tab-bar"
            role="tablist"
            aria-label="점수 보기"
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              const tabs = Array.from(
                event.currentTarget.querySelectorAll<HTMLButtonElement>(
                  '[role="tab"]',
                ),
              );
              const index = tabs.indexOf(event.target as HTMLButtonElement);
              if (index < 0) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? tabs.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        tabs.length) %
                      tabs.length;
              tabs[next].focus();
              tabs[next].click();
            }}
          >
            <button
              id="tab-total"
              role="tab"
              aria-selected={activeId === "total"}
              aria-controls="ranking-panel"
              tabIndex={activeId === "total" ? 0 : -1}
              className={activeId === "total" ? "active" : ""}
              onClick={() => setSelected("total")}
            >
              <Trophy size={17} />
              종합 순위
            </button>
            {board?.events.map((event) => (
              <button
                key={event.id}
                id={`tab-${event.id}`}
                role="tab"
                aria-selected={activeId === event.id}
                aria-controls="ranking-panel"
                tabIndex={activeId === event.id ? 0 : -1}
                className={activeId === event.id ? "active" : ""}
                onClick={() => setSelected(event.id)}
              >
                {event.status === "live" && <span className="live-dot" />}
                {event.name}
              </button>
            ))}
          </div>
          <div className="board-layout">
            <div
              className="ranking-panel"
              id="ranking-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeId}`}
            >
              <div className="ranking-heading">
                <div>
                  <div className="eyebrow subtle">
                    {activeEvent ? "EVENT RANKING" : "OVERALL RANKING"}
                  </div>
                  <h2>
                    {activeEvent ? activeEvent.name : "종합 순위"}
                    <span
                      className={
                        activeEvent ? "heading-status" : "heading-description"
                      }
                    >
                      {activeEvent ? (
                        <Status status={activeEvent.status} />
                      ) : (
                        "모든 종목의 점수를 한눈에"
                      )}
                    </span>
                  </h2>
                </div>
                {activeEvent ? (
                  <button
                    className="button secondary compact"
                    onClick={() => setRules(true)}
                  >
                    <Info size={15} />
                    경기 안내
                  </button>
                ) : (
                  <span className="points-label">TOTAL POINTS</span>
                )}
              </div>
              {activeEvent && (
                <p className="event-intro">
                  {activeEvent.description ||
                    "우리 반의 멋진 경기를 응원해 주세요!"}
                </p>
              )}
              <div className="table-labels">
                <span>RANK</span>
                <span>CLASS / DEPARTMENT</span>
                <span>POINTS</span>
              </div>
              <div
                className="rank-list"
                aria-label={`${activeEvent?.name ?? "종합"} 반별 순위`}
              >
                {!board ? (
                  <div className="empty-state">
                    <Radio size={32} />
                    <h3>경기장에 연결하는 중</h3>
                    <p>점수가 준비되면 이곳에 바로 표시됩니다.</p>
                  </div>
                ) : (
                  teams.map((team) => (
                    <RankRow
                      key={`${activeId}-${team.id}`}
                      team={team}
                      topScore={topScore}
                      reducedMotion={Boolean(reducedMotion)}
                    />
                  ))
                )}
              </div>
              <div className="ranking-footnote">
                <span>
                  <Info size={13} />
                  동점은 공동 순위 · 모든 종목의 입력 점수 합산
                </span>
                <span>
                  {lastSynced ? `${lastSynced} 기준` : "점수 수신 대기"}
                </span>
              </div>
            </div>

            <aside className="board-sidebar">
              <div className="spotlight">
                <div className="eyebrow">
                  <Sparkles size={14} />
                  {topScore > 0 ? "LEADING THE WAY" : "READY, SET, GO!"}
                </div>
                {topScore > 0 && leader ? (
                  <>
                    <div
                      className="spotlight-icon"
                      style={{ color: leader.color }}
                    >
                      <TeamIcon id={leader.id} size={34} />
                    </div>
                    <p>지금, 가장 뜨거운 반</p>
                    <h3>
                      {teams
                        .filter((team) => team.rank === 1)
                        .map((team) => team.name)
                        .join(" · ")}
                    </h3>
                    <span>
                      {teams.filter((team) => team.rank === 1).length > 1
                        ? "공동 1위! 함께 달리는 중"
                        : leader.department}
                    </span>
                    <div className="spotlight-score">
                      {topScore.toLocaleString()}
                      <small>PTS</small>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="spotlight-icon">
                      <Flag size={34} />
                    </div>
                    <p>다섯 개의 반, 하나의 열정</p>
                    <h3>승부는 지금부터!</h3>
                    <span>첫 점수의 주인공을 기다려요</span>
                  </>
                )}
                <div className="spotlight-sticker">LET’S GO ↗</div>
              </div>
              <div className="progress-card">
                <div>
                  <h3>오늘의 경기</h3>
                  <span>
                    {completed}
                    <small> / {board?.events.length ?? 0}</small>
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${board?.events.length ? (completed / board.events.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p>
                  <CheckCheck size={14} />
                  {completed
                    ? `${completed}개 종목 완료! 끝까지 응원해 주세요.`
                    : "준비된 열정, 이제 보여줄 시간."}
                </p>
              </div>
              <button className="share-card" onClick={() => setShare(true)}>
                <span className="qr-mini">
                  <QrCode size={32} />
                </span>
                <span>
                  <strong>응원은 함께할수록!</strong>
                  <small>QR로 친구에게 리더보드 공유</small>
                </span>
                <ArrowUpRight size={18} />
              </button>
            </aside>
          </div>
        </section>
        <section className="schedule-section">
          <div className="section-top">
            <div>
              <div className="section-label">
                <span className="accent-square" />
                ON THE FIELD
              </div>
              <h2>
                오늘의 매치업<span>작은 응원이 만드는 큰 순간</span>
              </h2>
            </div>
            <span className="event-count">
              {board?.events.length ?? 0} EVENTS
            </span>
          </div>
          <div className="event-grid">
            {board?.events.length ? (
              board.events.map((event, index) => (
                <button
                  key={event.id}
                  className={`event-card ${event.status === "live" ? "event-card-live" : ""}`}
                  onClick={() => {
                    setSelected(event.id);
                    document.querySelector(".board-section")?.scrollIntoView({
                      behavior: reducedMotion ? "instant" : "smooth",
                    });
                  }}
                >
                  <div className="event-card-art">
                    {event.photoId ? (
                      <Image
                        src={`/api/photos/${event.photoId}`}
                        alt={`${event.name} 경기 사진`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 85vw, 300px"
                      />
                    ) : (
                      <>
                        <span className="event-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <Flag size={42} strokeWidth={1.3} />
                      </>
                    )}
                    <Status status={event.status} />
                  </div>
                  <div className="event-card-body">
                    <span>MATCH {String(index + 1).padStart(2, "0")}</span>
                    <h3>
                      {event.name}
                      <ArrowUpRight size={19} />
                    </h3>
                    <p>
                      {event.description ||
                        "반 친구들과 함께, 우리 반을 응원해요."}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-events">
                <Flag size={24} />
                <div>
                  <h3>오늘의 경기를 준비하고 있어요</h3>
                  <p>
                    종목이 등록되면 이곳에서 순서와 경기 안내를 확인할 수
                    있어요.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="team-legend">
          {CLASSES.map((team) => (
            <div
              key={team.id}
              style={{ "--team-color": team.color } as CSSProperties}
            >
              <TeamIcon id={team.id} size={17} />
              <strong>{team.name}</strong>
              <span>{team.department}</span>
            </div>
          ))}
        </section>
        <footer className="site-footer">
          <span>
            GOSW <strong>SPORTS FESTIVAL ’26</strong>
          </span>
          <p>땀나는 오늘, 빛나는 우리.</p>
          <span>
            MADE FOR OUR MOMENT <span className="lime">✳</span>
          </span>
        </footer>
      </main>
      {share && <ShareDialog onClose={() => setShare(false)} />}
      {rules && activeEvent && (
        <Modal
          title={`${activeEvent.name} 경기 안내`}
          onClose={() => setRules(false)}
        >
          {activeEvent.photoId && (
            <div className="rules-photo">
              <Image
                src={`/api/photos/${activeEvent.photoId}`}
                alt={activeEvent.name}
                fill
                unoptimized
                sizes="600px"
              />
            </div>
          )}
          <Status status={activeEvent.status} />
          <h3 className="detail-title">어떤 경기인가요?</h3>
          <p className="pre-wrap">
            {activeEvent.description || "아직 설명이 등록되지 않았습니다."}
          </p>
          <h3 className="detail-title">경기 규칙</h3>
          <p className="pre-wrap">
            {activeEvent.rules ||
              "아직 규칙이 등록되지 않았습니다. 현장 선생님의 안내를 따라 주세요."}
          </p>
        </Modal>
      )}
      {screenError && (
        <Modal title="전체화면 안내" onClose={() => setScreenError("")}>
          <p>{screenError}</p>
        </Modal>
      )}
      <AnimatePresence>
        {celebration.length > 0 && (
          <motion.div
            key={celebration.map((item) => `${item.id}-${item.rank}`).join()}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="celebration-toast"
            role="status"
          >
            <span className="celebration-icon">
              <ArrowUp size={25} />
            </span>
            <div>
              <small>{celebration[0].board} · RANK UP!</small>
              <strong>
                {celebration
                  .map(
                    (team) =>
                      team.headline ?? `${team.name}, ${team.rank}위로 상승!`,
                  )
                  .join(" / ")}
              </strong>
            </div>
            <span className="toast-spark">✳</span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function RankRow({
  team,
  topScore,
  reducedMotion,
}: {
  team: RankedClass;
  topScore: number;
  reducedMotion: boolean;
}) {
  const isFirst = team.rank === 1 && team.score > 0;
  return (
    <motion.div
      layout={!reducedMotion}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`rank-row ${isFirst ? "rank-first" : ""}`}
      data-testid={`rank-${team.id}`}
      data-rank={team.rank}
      style={{ "--team-color": team.color } as CSSProperties}
    >
      <div className="rank-number">
        {String(team.rank).padStart(2, "0")}
        {isFirst && <span className="rank-crown">♛</span>}
      </div>
      <div className="team-emblem">
        <TeamIcon id={team.id} size={25} />
      </div>
      <div className="team-details">
        <div>
          <strong>1학년 {team.name}</strong>
          {isFirst && <span className="first-badge">LEADER</span>}
        </div>
        <span>
          {team.department}
          <small>{team.short}</small>
        </span>
        <div className="score-track">
          <motion.span
            animate={{
              width: `${topScore ? Math.max(2, (team.score / topScore) * 100) : 0}%`,
            }}
            transition={{ duration: reducedMotion ? 0 : 0.8 }}
          />
        </div>
      </div>
      <div className="team-score">
        <strong>{team.score.toLocaleString()}</strong>
        <span>PTS</span>
      </div>
    </motion.div>
  );
}
