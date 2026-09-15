"use client";

import { useState } from "react";
import NotePwModal from "@/components/NotePwModal";

const MOCK_DELAY = 800;

export default function NotePwModalDevPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [mockResult, setMockResult] = useState("success");
  const [resultMessage, setResultMessage] = useState("대기 중");

  function handleModalOpen() {
    setErrorMessage("");
    setResultMessage("모달 열림");
    setIsOpen(true);
  }

  function handleModalClose() {
    setErrorMessage("");
    setIsSubmitting(false);
    setResultMessage("사용자가 모달을 닫았습니다.");
    setIsOpen(false);
  }

  function handleMockResultChange(event) {
    setMockResult(event.target.value);
    setErrorMessage("");
  }

  async function handlePasswordSubmit() {
    setIsSubmitting(true);
    setErrorMessage("");
    setResultMessage("비밀번호 확인 중");

    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));

    if (mockResult === "invalid") {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      setResultMessage("비밀번호 불일치");
      setIsSubmitting(false);
      return;
    }

    if (mockResult === "system-error") {
      setResultMessage("시스템 오류가 호출 측으로 전달되었습니다.");
      setIsSubmitting(false);
      setIsOpen(false);
      return;
    }

    setResultMessage("비밀번호 확인 성공(이동 및 세션 저장 없음)");
    setIsSubmitting(false);
    setIsOpen(false);
  }

  return (
    <main>
      <h1>NotePwModal 개발 확인</h1>

      <label htmlFor="mock-result">다음 제출 결과</label>
      <select id="mock-result" value={mockResult} onChange={handleMockResultChange}>
        <option value="success">성공</option>
        <option value="invalid">비밀번호 불일치</option>
        <option value="system-error">시스템 오류 전달</option>
      </select>

      <button type="button" onClick={handleModalOpen}>
        비밀번호 모달 열기
      </button>

      <p aria-live="polite">확인 결과: {resultMessage}</p>

      <NotePwModal
        isOpen={isOpen}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onSubmit={handlePasswordSubmit}
        onClose={handleModalClose}
      />
    </main>
  );
}
