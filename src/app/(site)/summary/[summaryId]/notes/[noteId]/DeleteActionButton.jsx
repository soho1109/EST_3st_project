"use client";

import CommonModal from "@/components/CommonModal";
import { deleteStudyNote } from "@/app/(site)/summary/[summaryId]/actions";
import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function DeleteActionButton({ className, summaryId, noteId }) {
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
      const result = await deleteStudyNote(summaryId, noteId);

      if (result?.status === "error") {
        setConfirmOpen(false);
        setErrorStatus(getErrorStatus(result.errorCode));
        return;
      }

      setConfirmOpen(false);
      router.replace(`/summary/${summaryId}`);
      router.refresh();
    } catch (error) {
      console.error("학습노트 삭제 요청 실패:", error);
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
