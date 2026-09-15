"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import styles from "./CommonModal.module.scss";

const AUTO_DESTINATIONS = {
  requireLogin: "/login",
  alreadyLoggedIn: "/",
};

const MODE_MESSAGES = {
  preparing: "현재 준비 중입니다.",
  confirmDelete: "정말 삭제하시겠습니까?",
  suggestLogin: "로그인이 필요합니다.",
  requireLogin: "로그인이 필요합니다.",
  alreadyLoggedIn: "이미 로그인하셨습니다. 메인페이지로 이동합니다.",
};

const ERROR_MESSAGES = {
  401: "로그인이 필요합니다.",
  403: "접근 권한이 없습니다.",
  404: "요청한 내용을 찾을 수 없습니다.",
  429: "요청이 많습니다. 잠시 후 다시 시도해 주세요.",
  500: "서버 오류가 발생했습니다.",
  502: "현재 서비스 연결이 원활하지 않습니다.",
  503: "현재 서비스 연결이 원활하지 않습니다.",
  504: "현재 서비스 연결이 원활하지 않습니다.",
  network: "네트워크 연결을 확인해 주세요.",
};

function getErrorMessage(status) {
  return ERROR_MESSAGES[status] ?? "문제가 발생했습니다.";
}

export default function CommonModal(props) {
  const { isOpen, mode, status, onClose, onConfirm, loginHref } = props;
  const pathname = usePathname();
  const resolvedLoginHref = loginHref ?? `/login?returnTo=${encodeURIComponent(pathname || "/")}`;
  const router = useRouter();
  const timerRef = useRef(null);
  const autoDestination = mode === "requireLogin" ? resolvedLoginHref : AUTO_DESTINATIONS[mode];
  const message = mode === "error" ? getErrorMessage(status) : (MODE_MESSAGES[mode] ?? "");

  useEffect(() => {
    if (!isOpen || (!autoDestination && mode !== "error")) {
      return undefined;
    }

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;

      if (autoDestination) {
        router.replace(autoDestination);
        return;
      }

      onClose?.();
    }, 3000);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [autoDestination, isOpen, mode, onClose, router]);

  function handleClose() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (autoDestination) {
      router.replace(autoDestination);
      return;
    }

    onClose?.();
  }

  function handleConfirm() {
    onConfirm?.();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles["modal-backdrop"]}>
      <section
        className={styles["modal-container"]}
        role="dialog"
        aria-modal="true"
        aria-label="공통 안내"
        data-mode={mode}
      >
        <button
          className={styles["close-button"]}
          type="button"
          aria-label="닫기"
          onClick={handleClose}
        >
          <span className="material-symbols-outlined" aria-hidden="true">
            close
          </span>
        </button>

        <div className={styles["mascot-wrapper"]}>
          <Image
            className={styles["mascot-image"]}
            src="/images/fbee.webp"
            alt=""
            fill
            sizes="348px"
            priority
          />
        </div>

        <p className={styles["modal-message"]} aria-live="polite">
          {message}
        </p>

        {mode === "suggestLogin" && (
          <div className={styles["button-group"]}>
            <Link className={styles["link-button"]} href={resolvedLoginHref} onClick={handleClose}>
              로그인 하러가기
            </Link>
            <Link className={styles["secondary-link"]} href="/summary" onClick={handleClose}>
              전체 요약 노트
            </Link>
          </div>
        )}

        {mode === "confirmDelete" && (
          <div className={styles["button-group"]}>
            <button className={styles["primary-button"]} type="button" onClick={handleConfirm}>
              삭제
            </button>
            <button className={styles["secondary-button"]} type="button" onClick={handleClose}>
              취소
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
