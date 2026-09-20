"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  Code2,
  Cpu,
  Shield,
  Terminal,
  CircuitBoard,
  Trophy,
  X,
  ArrowUpRight,
} from "lucide-react";
import { STATUS_LABELS, type EventStatus } from "@/lib/types";
import { ThemeSelector } from "./theme-selector";

export function TeamIcon({ id, size = 24 }: { id: number; size?: number }) {
  const Icon = [Code2, Terminal, Cpu, CircuitBoard, Shield][id - 1] ?? Trophy;
  return <Icon size={size} aria-hidden="true" strokeWidth={1.8} />;
}

export function Status({ status }: { status: EventStatus }) {
  return (
    <span className={`status status-${status}`}>
      <i />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function Header({ admin = false }: { admin?: boolean }) {
  return (
    <header className="site-header">
      <Link
        href={process.env.NEXT_PUBLIC_APP_URL || "/"}
        className="brand"
        aria-label="경기오산소프트웨어고 체육대회 홈"
      >
        <span className="brand-mark">
          <Trophy size={22} />
        </span>
        <span>
          GO<span className="brand-light">SW</span>
          <small>SPORTS FESTIVAL 2026</small>
        </span>
      </Link>
      <nav aria-label="주요 메뉴">
        <span className="school-name">경기오산소프트웨어고등학교</span>
        <ThemeSelector />
        <Link
          className="header-link"
          href={admin ? process.env.NEXT_PUBLIC_APP_URL || "/" : "/admin"}
        >
          {admin ? "리더보드 보기" : "교사 로그인"}
          <ArrowUpRight size={15} />
        </Link>
      </nav>
    </header>
  );
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const node = dialog.current!;
    const opener = document.activeElement;
    node.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = previous;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, []);
  return (
    <dialog
      ref={dialog}
      className={`modal ${wide ? "modal-wide" : ""}`}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-heading">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="닫기">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
