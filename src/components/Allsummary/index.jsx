"use client";

import styles from "./AllSummary.module.scss";
import EmptyState from "../EmptyState";
import SummaryItemCard from "../SummaryItemCard";
import useAll from "./useAll";

export default function AllSummary({ title, summaries = [], isBookmarkPage = false }) {
  //useAll.js 실행
  const {
    searchTerm,
    setSearchTerm,
    visibleSummaryCards,
    hasMore,
    sentinelRef,
    handleBookmarkToggle,
    isEmpty,
    isSearchEmpty,
  } = useAll(summaries, isBookmarkPage);

  return (
    <main className={styles["summary-page"]}>
      <section className={styles["summary-container"]}>
        {/* 페이지 제목 및 검색 영역 */}
        <div className={styles["summary-header"]}>
          <div className={styles["summary-title-row"]}>
            <h2 className={styles["summary-title"]}>{title}</h2>
          </div>

          {/* 주제를 기준으로 요약 노트 검색 */}
          <div className={styles["search-box"]}>
            <input
              type="text"
              placeholder="주제 검색하기"
              value={searchTerm}
              onChange={event => setSearchTerm(event.target.value)}
            />

            <span className={`material-symbols-outlined ${styles["search-icon"]}`} aria-hidden="true">
              search
            </span>
          </div>
        </div>

        {/* 현재 화면에 표시할 요약 카드 목록 */}
        <div className={styles["summary-content"]}>
          {isEmpty ? (
            <EmptyState message="현재 리스트가 없습니다." />
          ) : isSearchEmpty ? (
            <EmptyState message="검색 결과가 없습니다." />
          ) : (
            visibleSummaryCards.map(summary => (
              <SummaryItemCard
                key={summary.id}
                summaryId={summary.id}
                nickname={summary.nickname ?? "알 수 없는 사용자"}
                profileImageUrl={summary.profile_image_url ?? "/images/main_profile.webp"}
                title={summary.title}
                excerpt={summary.excerpt}
                createdAt={summary.created_at}
                isPrivate={summary.is_locked}
                isBookmarked={summary.isBookmarked ?? false}
                onBookmarkToggle={handleBookmarkToggle}
              />
            ))
          )}
        </div>

        {/* 다음 카드 묶음을 불러오기 위한 무한 스크롤 감지 지점 */}
        {hasMore && (
          <div className={styles["scroll-sentinel"]} ref={sentinelRef} aria-hidden="true" />
        )}
      </section>
    </main>
  );
}
