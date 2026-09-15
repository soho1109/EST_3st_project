"use client";
import { getSummaryContent } from "@/lib/api/summary";
import CommonModal from "./CommonModal";
import Loading from "./Loading";
import Image from "next/image";
import Link from "next/link";
import NotePwModal from "./NotePwModal";
import styles from "./SummaryItemCard.module.scss";
import { useState } from "react";
import { useRouter } from "next/navigation";

// 작성일을 "YYYY년 MM월 DD일" 형식으로 변환
function formatCreatedAt(createdAt) {
  if (!createdAt) {
    return "";
  }

  const [year, month, day] = createdAt.slice(0, 10).split("-");

  // 날짜 형식이 올바르지 않으면 원래 값을 그대로 반환
  if (!year || !month || !day) {
    return createdAt;
  }

  return `${year}년 ${month}월 ${day}일`;
}

export default function SummaryItemCard({
  summaryId,
  nickname = "",
  profileImageUrl = "/images/main_profile.webp",
  title = "",
  excerpt = "",
  createdAt = "",
  isPrivate = false,
  isBookmarked = false,
  onBookmarkToggle, // 북마크 prop 추가
}) {
  const router = useRouter();

  const [isCheckingAccess, setIsCheckingAccess] = useState(false);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [errorStatus, setErrorStatus] = useState(null);
  // 비밀번호 모달 열림 상태 관리
  const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

  // 카드에 표시할 작성일 형식 변환
  const formattedCreatedAt = formatCreatedAt(createdAt);

  // 비공개 요약 노트 비밀번호 모달 열기
  async function handlePasswordModalOpen() {
    if (isCheckingAccess) {
      return;
    }

    setIsCheckingAccess(true);
    setPasswordError("");

    try {
      await getSummaryContent(summaryId);

      router.push(`/summary/${summaryId}`);
    } catch (error) {
      if (error.code === "PASSWORD_REQUIRED") {
        setPasswordModalOpen(true);
        return;
      }

      setErrorStatus(error.status ?? "network");
    } finally {
      setIsCheckingAccess(false);
    }
  }

  // 비밀번호 모달 닫기
  function handlePasswordModalClose() {
    setPasswordModalOpen(false);
    setPasswordError("");
  }

  // 비공개 요약 노트 비밀번호 검증
  async function handlePasswordSubmit(password) {
    if (isPasswordSubmitting) {
      return;
    }

    setIsPasswordSubmitting(true);
    setPasswordError("");

    try {
      await getSummaryContent(summaryId, password);

      setPasswordModalOpen(false);
      router.push(`/summary/${summaryId}`);
    } catch (error) {
      if (error.code === "INVALID_PASSWORD" || error.status === 403) {
        setPasswordError("비밀번호가 일치하지 않습니다.");
        return;
      }

      setPasswordModalOpen(false);
      setErrorStatus(error.status ?? "network");
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  // 북마크 추가/삭제 처리
  function handleBookmarkClick(e) {
    // 북마크 클릭 시 카드 상세 페이지 이동 방지
    e.preventDefault();
    e.stopPropagation();

    onBookmarkToggle?.(summaryId);
  }

  return (
    <>
      <article className={styles["item-card"]} data-summary-id={summaryId}>
        {/* 공개 요약은 상세 페이지로 이동하고, 비공개 요약은 비밀번호 모달을 엶 */}
        {isPrivate ? (
          <button
            className={styles["card-link"]}
            type="button"
            aria-label={`${title || "요약 노트"} 비밀번호 입력`}
            aria-haspopup="dialog"
            aria-expanded={isPasswordModalOpen}
            onClick={handlePasswordModalOpen}
            disabled={isCheckingAccess}
            aria-busy={isCheckingAccess}
          />
        ) : (
          <Link
            className={styles["card-link"]}
            href={`/summary/${summaryId}`}
            aria-label={`${title || "요약 노트"} 상세 보기`}
            draggable={false}
          />
        )}

        {/* 작성자 정보와 북마크 버튼 영역 */}
        <div className={styles["card-main"]}>
          <div className={styles["card-header"]}>
            <div className={styles["user-info"]}>
              <Image
                className={styles["profile-img"]}
                src={profileImageUrl}
                alt="사용자 프로필"
                width={32}
                height={32}
              />

              <p className={styles["nickname"]}>{nickname}</p>
            </div>

            {/* 부모에게 전달받은 북마크 상태 표시 */}
            <button
              className={styles["bookmark-btn"]}
              type="button"
              aria-label={isBookmarked ? "북마크 삭제" : "북마크 추가"}
              aria-pressed={isBookmarked}
              onClick={handleBookmarkClick}
            >
              <span
                className={`material-symbols-outlined ${styles["bookmark-icon"]} 
                ${isBookmarked ? styles["is-active"] : ""}`}
                aria-hidden="true"
              >
                bookmark_add
              </span>
            </button>
          </div>

          {/* 요약 노트 제목과 미리보기 내용 */}
          <div className={styles["card-content"]}>
            <h3 className={styles["card-title"]}>{title}</h3>
            <p className={styles["card-desc"]}>{excerpt}</p>
          </div>
        </div>

        {/* 작성일과 비공개 여부 표시 */}
        <div className={styles["card-footer"]}>
          <time className={styles["created-date"]} dateTime={new Date(createdAt).toISOString()}>
            {formattedCreatedAt}
          </time>

          {/* 비공개 요약 노트인 경우 잠금 아이콘 표시 */}
          {isPrivate && (
            <span className={`material-symbols-outlined ${styles["lock-icon"]}`} aria-hidden="true">
              lock
            </span>
          )}
        </div>
      </article>

      {/* 비공개 요약 노트 비밀번호 입력 모달 */}
      <NotePwModal
        isOpen={isPasswordModalOpen}
        isSubmitting={isPasswordSubmitting}
        errorMessage={passwordError}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordModalClose}
      />
      {isCheckingAccess && <Loading />}

      <CommonModal
        isOpen={errorStatus !== null}
        mode="error"
        status={errorStatus}
        onClose={() => setErrorStatus(null)}
      />
    </>
  );
}
