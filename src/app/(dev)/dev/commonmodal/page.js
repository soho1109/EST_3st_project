"use client";

import { useState } from "react";
import CommonModal from "@/components/CommonModal";

const MODES = [
  "preparing",
  "confirmDelete",
  "suggestLogin",
  "requireLogin",
  "alreadyLoggedIn",
  "error",
];

const ERROR_STATUSES = [401, 403, 404, 429, 500, 502, 503, 504, "network", 418, "undefined"];

export default function CommonModalDevPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("preparing");
  const [resultMessage, setResultMessage] = useState("대기 중");
  const [confirmCount, setConfirmCount] = useState(0);
  const [status, setStatus] = useState(500);

  function handleModeChange(event) {
    setMode(event.target.value);
  }

  function handleModalOpen() {
    setResultMessage(`${mode} 모달 열림`);
    setIsOpen(true);
  }

  function handleStatusChange(event) {
    const nextStatus = event.target.value;

    if (nextStatus === "undefined") {
      setStatus(undefined);
      return;
    }

    setStatus(nextStatus === "network" ? nextStatus : Number(nextStatus));
  }

  function handleModalClose() {
    setResultMessage(`${mode} 모달 닫힘`);
    setIsOpen(false);
  }

  function handleConfirm() {
    setConfirmCount((currentCount) => currentCount + 1);
    setResultMessage("삭제 승인 전달 확인(실제 삭제 없음)");
    setIsOpen(false);
  }

  return (
    <main>
      <h1>CommonModal 개발 확인</h1>

      <label htmlFor="common-modal-mode">모달 모드</label>
      <select id="common-modal-mode" value={mode} onChange={handleModeChange}>
        {MODES.map((modeOption) => (
          <option key={modeOption} value={modeOption}>
            {modeOption}
          </option>
        ))}
      </select>

      {mode === "error" && (
        <>
          <label htmlFor="common-modal-status">오류 상태</label>
          <select
            id="common-modal-status"
            value={status ?? "undefined"}
            onChange={handleStatusChange}
          >
            {ERROR_STATUSES.map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption === 418
                  ? "418 (미지원 상태)"
                  : statusOption === "undefined"
                    ? "상태 없음"
                    : statusOption}
              </option>
            ))}
          </select>
        </>
      )}

      <button type="button" onClick={handleModalOpen}>
        공통 모달 열기
      </button>

      <p aria-live="polite">확인 결과: {resultMessage}</p>
      <p>삭제 승인 호출 횟수: {confirmCount}</p>

      <CommonModal
        isOpen={isOpen}
        mode={mode}
        status={status}
        onClose={handleModalClose}
        onConfirm={handleConfirm}
      />
    </main>
  );
}
