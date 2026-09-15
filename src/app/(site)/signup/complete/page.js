"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommonModal from "@/components/CommonModal";
import styles from "./page.module.scss";
import { useAuth } from "@/components/AuthProvider";

const SIGNUP_COMPLETED_KEY = "signupCompletedAt";
const SIGNUP_COMPLETE_ACCESS_TIME = 5 * 60 * 1000;

export default function SignupCompletePage() {
  const router = useRouter();
  const [modalMode, setModalMode] = useState(null);
  const [isAccessChecked, setIsAccessChecked] = useState(false); // 정상 접근 체크
  const { isAuthenticated, isAuthLoading } = useAuth();
  useEffect(() => {
    if (isAccessChecked) {
      return;
    }

    // 가입 세션이 살아있음
    const completedAt = Number(sessionStorage.getItem(SIGNUP_COMPLETED_KEY));
    const hasValidSignupCompletion =
      Number.isFinite(completedAt) &&
      completedAt > 0 &&
      Date.now() - completedAt <= SIGNUP_COMPLETE_ACCESS_TIME;

    if (!hasValidSignupCompletion && isAuthLoading) {
      return;
    }

    const accessCheckTimer = window.setTimeout(() => {
      if (!hasValidSignupCompletion) {
        sessionStorage.removeItem(SIGNUP_COMPLETED_KEY);
        setModalMode(isAuthenticated ? "alreadyLoggedIn" : "error");
      }

      setIsAccessChecked(true);
    }, 0);

    return () => {
      window.clearTimeout(accessCheckTimer);
    };
  }, [isAccessChecked, isAuthenticated, isAuthLoading]);

  if (!isAccessChecked) {
    return null;
  }

  function handleModalClose() {
    if (modalMode === "error") {
      router.replace("/");
    }
  }

  return (
    <main className={styles["complete-page"]}>
      <div className={styles["complete-content"]}>
        <h1>프다에 오신 걸 환영해요!</h1>

        <div className={styles["mascot-stage"]}>
          <Image
            className={styles["mascot-image"]}
            src="/images/fbee.webp"
            alt="프다 마스코트 프비"
            width={357}
            height={338}
            priority
          />
        </div>

        <p className={styles["complete-message"]}>
          <span>이메일 인증으로 회원가입을 완료해주세요.</span>
          <span>인증 후 로그인하여 나만의 학습을 시작해 보세요.</span>
        </p>

        <Link className={styles["login-link"]} href="/login">
          로그인 하러 가기
        </Link>
      </div>
      <CommonModal
        isOpen={modalMode !== null}
        mode={modalMode}
        status={modalMode === "error" ? 403 : undefined}
        onClose={handleModalClose}
      />
    </main>
  );
}
