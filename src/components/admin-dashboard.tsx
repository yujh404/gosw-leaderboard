"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Flag,
  ImagePlus,
  LoaderCircle,
  LogOut,
  Pencil,
  Plus,
  QrCode,
  RefreshCw,
  Save,
  Trophy,
  X,
} from "lucide-react";
import {
  CLASSES,
  STATUS_LABELS,
  type BoardSnapshot,
  type EventStatus,
  type SportEvent,
} from "@/lib/types";
import { jsonBody, requestJson, RequestError } from "@/lib/client";
import { Header, Modal, SparkIcon, Status, TeamIcon } from "./ui";
import { ShareDialog } from "./share-dialog";

export function AdminDashboard({ initial }: { initial: BoardSnapshot }) {
  const router = useRouter();
  const [board, setBoard] = useState(initial);
  const [editing, setEditing] = useState<SportEvent | "new" | null>(null);
  const [scoring, setScoring] = useState<SportEvent | null>(null);
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function handleError(error: unknown) {
    if (error instanceof RequestError && error.status === 401) {
      router.replace("/admin/login");
      return;
    }
    setError(
      error instanceof Error
        ? error.message
        : "변경사항을 저장하지 못했습니다.",
    );
  }
  async function refresh() {
    setBoard(await requestJson<BoardSnapshot>("/api/board"));
  }
  async function reload() {
    setBusy(true);
    setError("");
    try {
      await refresh();
      setMessage("최신 경기 정보를 불러왔습니다.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }
  async function move(index: number, direction: number) {
    setBusy(true);
    setError("");
    setMessage("");
    const ids = board.events.map((event) => event.id);
    [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
    try {
      await requestJson("/api/events/order", {
        method: "PUT",
        ...jsonBody({ ids }),
      });
      await refresh();
      setMessage("경기 순서를 변경했습니다.");
    } catch (error) {
      handleError(error);
    } finally {
      setBusy(false);
    }
  }
  async function signOut() {
    setBusy(true);
    try {
      await requestJson("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } catch (error) {
      handleError(error);
      setBusy(false);
    }
  }
  async function saved() {
    setEditing(null);
    setScoring(null);
    setMessage("저장했습니다. 학생 리더보드에 약 3초 이내로 반영됩니다.");
    try {
      await refresh();
    } catch {
      setError(
        "저장했지만 최신 목록을 불러오지 못했습니다. 새로고침해 주세요.",
      );
    }
  }
  return (
    <>
      <Header admin />
      <main className="page-shell admin-page">
        <div className="admin-title">
          <div>
            <div className="eyebrow">TEACHER’S DESK</div>
            <h1>
              경기 운영 센터
              <span>
                <SparkIcon />
              </span>
            </h1>
            <p>경기의 순간을 기록하면, 모두의 순위가 바뀝니다.</p>
          </div>
          <button
            className="button secondary"
            onClick={signOut}
            disabled={busy}
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </div>
        <div className="admin-stats">
          <div>
            <span>
              <Flag size={17} />
              전체 종목
            </span>
            <strong>
              {board.events.length}
              <small>개</small>
            </strong>
          </div>
          <div>
            <span>
              <span className="live-dot" />
              진행중
            </span>
            <strong>
              {board.events.filter((event) => event.status === "live").length}
              <small>개</small>
            </strong>
          </div>
          <div>
            <span>
              <Trophy size={17} />
              경기 완료
            </span>
            <strong>
              {
                board.events.filter((event) => event.status === "completed")
                  .length
              }
              <small>개</small>
            </strong>
          </div>
          <button onClick={() => setShare(true)}>
            <QrCode size={31} />
            <span>
              <strong>학생들에게 공유</strong>
              <small>
                공개 리더보드 QR 코드
                <ExternalLink size={12} />
              </small>
            </span>
          </button>
        </div>
        <div className="admin-toolbar">
          <div>
            <h2>종목 & 점수 관리</h2>
            <p>화살표로 경기 순서와 학생 화면의 탭 순서를 바꿀 수 있습니다.</p>
          </div>
          <div className="button-row">
            <button
              className="icon-button"
              disabled={busy}
              onClick={reload}
              aria-label="최신 정보 새로고침"
            >
              <RefreshCw size={18} className={busy ? "spin" : ""} />
            </button>
            <button
              className="button primary"
              disabled={busy}
              onClick={() => {
                setError("");
                setEditing("new");
              }}
            >
              <Plus size={18} />
              종목 추가
            </button>
          </div>
        </div>
        {message && (
          <div className="notice success" role="status">
            <Check size={17} />
            {message}
            <button
              className="icon-button"
              aria-label="알림 닫기"
              onClick={() => setMessage("")}
            >
              <X size={16} />
            </button>
          </div>
        )}
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        <div className="admin-event-list">
          {board.events.map((event, index) => (
            <article
              key={event.id}
              className="admin-event"
              data-testid={`admin-event-${event.id}`}
            >
              <div className="admin-event-top">
                <div className="order-buttons">
                  <button
                    aria-label={`${event.name} 위로 이동`}
                    disabled={busy || index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <button
                    aria-label={`${event.name} 아래로 이동`}
                    disabled={busy || index === board.events.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>
                <div className="admin-photo">
                  {event.photoId ? (
                    <Image
                      src={`/api/photos/${event.photoId}`}
                      alt={event.name}
                      fill
                      unoptimized
                      sizes="80px"
                    />
                  ) : (
                    <Flag size={27} />
                  )}
                </div>
                <div className="admin-event-description">
                  <Status status={event.status} />
                  <h3>{event.name}</h3>
                  <p>{event.description || "경기 설명을 추가해 주세요."}</p>
                </div>
                <button
                  className="button secondary compact"
                  onClick={() => setEditing(event)}
                >
                  <Pencil size={14} />
                  <span>종목 수정</span>
                </button>
              </div>
              <div className="admin-score-row">
                {CLASSES.map((team) => (
                  <div
                    key={team.id}
                    style={{ "--team-color": team.color } as CSSProperties}
                  >
                    <span>
                      <TeamIcon id={team.id} size={14} />
                      {team.name}
                    </span>
                    <strong>
                      {event.scores[team.id].toLocaleString()}
                      <small>점</small>
                    </strong>
                  </div>
                ))}
                <button
                  className="button score-edit-button"
                  onClick={() => setScoring(event)}
                >
                  <Pencil size={15} />
                  점수 입력
                </button>
              </div>
            </article>
          ))}
          {!board.events.length && (
            <div className="admin-empty">
              <span className="login-symbol">
                <Flag size={30} />
              </span>
              <h3>첫 번째 경기를 준비해 볼까요?</h3>
              <p>
                종목을 추가하고 설명, 규칙, 반별 점수를 관리하세요.
                <br />
                등록한 종목은 학생 리더보드에 바로 표시됩니다.
              </p>
              <button
                className="button primary"
                onClick={() => setEditing("new")}
              >
                <Plus size={17} />첫 종목 추가하기
              </button>
            </div>
          )}
        </div>
        <p className="admin-help">
          점수는 0~100,000점 사이의 정수로 입력합니다. 대기중·진행중·완료 상태와
          관계없이 입력한 모든 점수가 총점에 합산됩니다.
        </p>
      </main>
      {share && <ShareDialog onClose={() => setShare(false)} />}
      {editing && (
        <EventEditor
          event={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
      {scoring && (
        <ScoreEditor
          event={scoring}
          onClose={() => setScoring(null)}
          onSaved={saved}
        />
      )}
    </>
  );
}

function EventEditor({
  event,
  onClose,
  onSaved,
}: {
  event: SportEvent | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [photoId, setPhotoId] = useState(event?.photoId ?? null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  async function upload(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("사진은 2MB 이하로 선택해 주세요.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const photo = await requestJson<{ id: string }>("/api/photos", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      setPhotoId(photo.id);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "사진을 업로드하지 못했습니다.",
      );
    } finally {
      setUploading(false);
    }
  }
  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(formEvent.currentTarget);
    const input = {
      name: form.get("name"),
      description: form.get("description"),
      rules: form.get("rules"),
      status: form.get("status") as EventStatus,
      photoId,
      ...(event ? { version: event.version } : {}),
    };
    try {
      await requestJson(event ? `/api/events/${event.id}` : "/api/events", {
        method: event ? "PATCH" : "POST",
        ...jsonBody(input),
      });
      await onSaved();
    } catch (error) {
      setError(error instanceof Error ? error.message : "저장하지 못했습니다.");
      if (error instanceof RequestError && error.status === 409)
        setConflict(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={event ? "종목 수정" : "새로운 종목 추가"}
      wide
      onClose={() => {
        if (!busy && !uploading) onClose();
      }}
    >
      <form onSubmit={submit} className="event-form">
        <div className="form-two-columns">
          <div>
            <label htmlFor="event-name">
              종목 이름 <span className="lime">*</span>
            </label>
            <input
              id="event-name"
              name="name"
              defaultValue={event?.name}
              placeholder="예: 반 대항 이어달리기"
              maxLength={60}
              required
            />
          </div>
          <div>
            <label htmlFor="event-status">경기 상태</label>
            <select
              id="event-status"
              name="status"
              defaultValue={event?.status ?? "waiting"}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label htmlFor="event-photo">종목 사진</label>
        <div className="photo-upload">
          {photoId ? (
            <>
              <div className="photo-preview">
                <Image
                  src={`/api/photos/${photoId}`}
                  alt="종목 사진 미리보기"
                  fill
                  unoptimized
                  sizes="600px"
                />
              </div>
              <button
                type="button"
                className="remove-photo"
                aria-label="사진 제거"
                disabled={busy || uploading}
                onClick={() => setPhotoId(null)}
              >
                <X size={18} />
              </button>
            </>
          ) : (
            <div className="upload-placeholder">
              <ImagePlus size={29} />
              <span>경기의 분위기를 담은 사진을 올려 주세요</span>
              <small>JPG, PNG, WebP · 최대 2MB</small>
            </div>
          )}
          <input
            id="event-photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="종목 사진 업로드"
            disabled={uploading || busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {uploading && (
            <span className="upload-overlay">
              <LoaderCircle className="spin" />
              업로드 중...
            </span>
          )}
        </div>
        <label htmlFor="event-description">경기 설명</label>
        <textarea
          id="event-description"
          name="description"
          defaultValue={event?.description}
          rows={3}
          maxLength={2000}
          placeholder="어떤 경기인지 학생들에게 알려 주세요."
        />
        <label htmlFor="event-rules">경기 규칙</label>
        <textarea
          id="event-rules"
          name="rules"
          defaultValue={event?.rules}
          rows={5}
          maxLength={4000}
          placeholder={
            "참가 인원, 진행 방식, 점수 기준을 적어 주세요.\n예: 1. 각 반 대표 6명이 참가합니다."
          }
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {conflict && (
          <p className="muted">
            입력 내용을 복사한 뒤 창을 닫고, 목록에서 새로고침해 주세요.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            disabled={busy || uploading}
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="button primary"
            disabled={busy || uploading || conflict}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            {event ? "변경사항 저장" : "종목 등록"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ScoreEditor({
  event,
  onClose,
  onSaved,
}: {
  event: SportEvent;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(formEvent.currentTarget);
    const scores = Object.fromEntries(
      CLASSES.map((team) => [team.id, Number(form.get(`score-${team.id}`))]),
    );
    try {
      await requestJson(`/api/events/${event.id}/scores`, {
        method: "PUT",
        ...jsonBody({ scores, version: event.version }),
      });
      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "점수를 저장하지 못했습니다.",
      );
      if (error instanceof RequestError && error.status === 409)
        setConflict(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${event.name} · 점수 입력`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p className="muted">
        5개 반의 점수를 확인하고 한 번에 저장하세요.
        <br />
        저장한 점수는 학생 화면에 자동으로 반영됩니다.
      </p>
      <form onSubmit={submit}>
        <div className="score-inputs">
          {CLASSES.map((team) => (
            <div
              key={team.id}
              style={{ "--team-color": team.color } as CSSProperties}
            >
              <span className="team-emblem">
                <TeamIcon id={team.id} size={21} />
              </span>
              <label htmlFor={`score-${team.id}`}>
                <strong>1학년 {team.name}</strong>
                <small>{team.department}</small>
              </label>
              <div>
                <input
                  id={`score-${team.id}`}
                  name={`score-${team.id}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  step={1}
                  required
                  defaultValue={event.scores[team.id]}
                />
                <span>점</span>
              </div>
            </div>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {conflict && (
          <p className="muted">
            입력한 점수를 메모한 뒤 창을 닫고, 목록에서 새로고침해 주세요.
          </p>
        )}
        <div className="form-actions">
          <button
            className="button secondary"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            취소
          </button>
          <button className="button primary" disabled={busy || conflict}>
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Save size={17} />
            )}
            점수 저장
          </button>
        </div>
      </form>
    </Modal>
  );
}
