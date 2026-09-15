"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CommonModal from "@/components/CommonModal";
import { deleteSummary } from "@/app/(site)/summary/[summaryId]/actions";

function getErrorStatus(errorCode) {
  if (errorCode === "UNAUTHENTICATED") {
    return 401;
  }

  if (errorCode === "FORBIDDEN") {
    return 403;
  }

  if (errorCode === "NOT_FOUND") {
    return 404;
  }

  return 500;
}

export default function SummaryDeleteButton({ className, summaryId }) {
  const router = useRouter();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  async function handleConfirm() {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await deleteSummary(summaryId);

      if (result?.status === "error") {
        setConfirmOpen(false);
        setErrorStatus(getErrorStatus(result.errorCode));
        return;
      }

      setConfirmOpen(false);
      router.replace("/summary");
      router.refresh();
    } catch (error) {
      console.error("요약본 삭제 요청 실패:", error);
      setConfirmOpen(false);
      setErrorStatus(500);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={className}
        type="button"
        disabled={isSubmitting}
        // 삭제 요청 중 중복 제출을 막고 보조기술에 처리 상태를 알립니다.
        aria-busy={isSubmitting}
        onClick={() => setConfirmOpen(true)}
      >
        삭제
      </button>

      <CommonModal
        isOpen={isConfirmOpen}
        mode="confirmDelete"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
      <CommonModal
        isOpen={errorStatus !== null}
        mode="error"
        status={errorStatus}
        onClose={() => setErrorStatus(null)}
      />
    </>
  );
}
