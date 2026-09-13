"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";
import { Modal } from "./ui";

export function ShareDialog({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setError("아래 주소를 길게 눌러 복사해 주세요.");
    }
  }
  function download() {
    const svg = document.querySelector(".share-qr svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml",
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "GOSW-2026-리더보드-QR.svg";
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
  return (
    <Modal title="우리 반의 순간을 함께" onClose={onClose}>
      <p className="muted">
        QR을 스캔하면 로그인 없이 실시간 순위를 볼 수 있어요.
      </p>
      <div className="share-qr">
        <QRCodeSVG
          value={url}
          size={224}
          marginSize={4}
          level="M"
          title="체육대회 공개 리더보드 QR 코드"
        />
      </div>
      <p className="share-url">{url}</p>
      <div className="button-row">
        <button className="button primary" onClick={copy}>
          {copied ? <Check size={18} /> : <Copy size={18} />}
          {copied ? "복사했어요" : "링크 복사"}
        </button>
        <button className="button secondary" onClick={download}>
          <Download size={18} />
          QR 저장
        </button>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </Modal>
  );
}
