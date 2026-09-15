"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Banner from "@/components/Banner";
import CommonModal from "@/components/CommonModal";
import EmptyState from "@/components/EmptyState";
import Loading from "@/components/Loading";
import NoteItem from "@/components/NoteItem";
import NotePwModal from "@/components/NotePwModal";
import { getSummaryContent } from "@/lib/api/summary";
import { createClient } from "@/lib/supabase/client";
import styles from "./AllNotes.module.scss";

const EMPTY_MESSAGE = "학습 노트 리스트가 아직 생성되지 않았습니다.";
const PASSWORD_ERROR_MESSAGE = "비밀번호가 일치하지 않습니다.";
const STUDY_NOTE_PAGE_SIZE = 12;
const STUDY_NOTE_SELECT =
  "id,summary_id,author_id,title,is_quiz_completed,created_at";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createStudyNoteError(message, code = "REQUEST_FAILED") {
  const error = new Error(message);
  error.code = code;
  return error;
}

function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function formatCreatedAt(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("ko-KR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Seoul",
    year: "numeric",
  }).formatToParts(date);
  const partMap = new Map(parts.map(part => [part.type, part.value]));

  return `${partMap.get("year")}.${partMap.get("month")}.${partMap.get("day")}`;
}

function normalizeStudyNoteScope(scope) {
  if (scope?.type === "all") {
    return { type: "all" };
  }

  if (scope?.type === "mine") {
    return { type: "mine" };
  }

  if (scope?.type === "summary" && isUuid(scope.summaryId)) {
    return { type: "summary", summaryId: scope.summaryId };
  }

  throw createStudyNoteError("요약본을 찾을 수 없습니다.", "NOT_FOUND");
}

function applyStudyNoteScope(query, scope, publicSummaryIds, userId) {
  if (scope.type === "mine") {
    return query.eq("author_id", userId);
  }

  if (scope.type === "summary") {
    return query.eq("summary_id", scope.summaryId);
  }

  return query.in("summary_id", publicSummaryIds);
}

function applyStudyNoteCursor(query, cursor) {
  if (!cursor) {
    return query;
  }

  return query.or(
    `created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.noteId})`,
  );
}

function normalizeStudyNote(row, profileMap) {
  return {
    noteId: row.id,
    summaryId: row.summary_id,
    authorNickname: profileMap.get(row.author_id) ?? "알 수 없는 사용자",
    title: row.title ?? "",
    createdAt: row.created_at,
    createdAtDisplay: formatCreatedAt(row.created_at),
    quizStatus: row.is_quiz_completed ? "completed" : "notStarted",
  };
}

async function loadStudyNotePage(scope, cursor = null) {
  const normalizedScope = normalizeStudyNoteScope(scope);
  const normalizedCursor = cursor === null ? null : normalizeCursor(cursor);

  if (cursor !== null && !normalizedCursor) {
    throw createStudyNoteError("학습노트 페이지 정보를 확인할 수 없습니다.");
  }

  const supabase = createClient();
  let publicSummaryIds = null;
  let userId = null;

  if (normalizedScope.type === "mine") {
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("현재 사용자 조회 실패:", userError);
      throw createStudyNoteError("학습노트 목록을 조회할 수 없습니다.");
    }

    if (!userData?.user?.id) {
      throw createStudyNoteError("로그인이 필요합니다.", "UNAUTHENTICATED");
    }

    userId = userData.user.id;
  }

  if (normalizedScope.type === "all") {
    const { data: summaries, error: summaryError } = await supabase
      .from("summaries")
      .select("id")
      .eq("is_locked", false);

    if (summaryError) {
      console.error("공개 요약본 조회 실패:", summaryError);
      throw createStudyNoteError("학습노트 목록을 조회할 수 없습니다.");
    }

    publicSummaryIds = (summaries ?? []).map(summary => summary.id);

    if (publicSummaryIds.length === 0) {
      return {
        totalCount: 0,
        items: [],
        nextCursor: null,
        hasMore: false,
      };
    }
  }

  const countQuery = applyStudyNoteScope(
    supabase
      .from("learning_notes")
      .select("id", { count: "exact", head: true }),
    normalizedScope,
    publicSummaryIds,
    userId,
  );
  let pageQuery = applyStudyNoteScope(
    supabase.from("learning_notes").select(STUDY_NOTE_SELECT),
    normalizedScope,
    publicSummaryIds,
    userId,
  );

  pageQuery = applyStudyNoteCursor(pageQuery, normalizedCursor)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(0, STUDY_NOTE_PAGE_SIZE);

  const [countResponse, pageResponse] = await Promise.all([
    countQuery,
    pageQuery,
  ]);

  if (countResponse.error) {
    console.error("학습노트 수 조회 실패:", countResponse.error);
    throw createStudyNoteError("학습노트 목록을 조회할 수 없습니다.");
  }

  if (pageResponse.error) {
    console.error("학습노트 목록 조회 실패:", pageResponse.error);
    throw createStudyNoteError("학습노트 목록을 조회할 수 없습니다.");
  }

  const rows = pageResponse.data ?? [];
  const pageRows = rows.slice(0, STUDY_NOTE_PAGE_SIZE);
  const authorIds = [
    ...new Set(pageRows.map(row => row.author_id).filter(Boolean)),
  ];
  let profileMap = new Map();

  if (authorIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id,nickname")
      .in("id", authorIds);

    if (profileError) {
      console.error("학습노트 작성자 조회 실패:", profileError);
    } else {
      profileMap = new Map(
        (profiles ?? []).map(profile => [profile.id, profile.nickname]),
      );
    }
  }

  const lastRow = pageRows[pageRows.length - 1];
  const hasMore = rows.length > STUDY_NOTE_PAGE_SIZE;

  return {
    totalCount: countResponse.count ?? 0,
    items: pageRows.map(row => normalizeStudyNote(row, profileMap)),
    nextCursor: hasMore
      ? { createdAt: lastRow.created_at, noteId: lastRow.id }
      : null,
    hasMore,
  };
}

function createScope(scope, summaryId) {
  if (scope === "all") {
    return { type: "all" };
  }

  if (scope === "summary") {
    return { type: "summary", summaryId };
  }

  return { type: "mine" };
}

function canReadList(scope, accessState) {
  return (
    scope === "mine" ||
    scope === "all" ||
    accessState === "public" ||
    accessState === "authorized"
  );
}

function normalizeCursor(cursor) {
  if (
    !cursor ||
    typeof cursor.createdAt !== "string" ||
    typeof cursor.noteId !== "string"
  ) {
    return null;
  }

  return {
    createdAt: cursor.createdAt,
    noteId: cursor.noteId,
  };
}

function normalizePage(page) {
  const items = Array.isArray(page?.items)
    ? page.items.filter(
        item =>
          item &&
          typeof item.noteId === "string" &&
          typeof item.summaryId === "string",
      )
    : [];
  const nextCursor = normalizeCursor(page?.nextCursor);
  const totalCount = Number.isInteger(page?.totalCount) && page.totalCount >= 0
    ? page.totalCount
    : items.length;

  return {
    totalCount,
    items,
    nextCursor,
    hasMore: Boolean(page?.hasMore && nextCursor),
  };
}

function getItemKey(item) {
  return `${item.summaryId}:${item.noteId}`;
}

function getCursorKey(cursor) {
  return cursor ? `${cursor.createdAt}:${cursor.noteId}` : "initial";
}

function getScopeKey(scope, summaryId) {
  return scope === "summary" ? `${scope}:${summaryId ?? ""}` : scope;
}

function createRequestTracker(scopeKey) {
  return {
    scopeKey,
    inFlightCursor: null,
    requestedCursors: new Set(),
  };
}

function createInitialState(initialPage, shouldLoadList) {
  const page = shouldLoadList ? normalizePage(initialPage) : normalizePage(null);

  return {
    ...page,
    hasLoaded: shouldLoadList && Boolean(initialPage),
    isInitialLoading: shouldLoadList && !initialPage,
    isLoadingMore: false,
    error: null,
  };
}

function getErrorStatus(error) {
  return error?.code === "NOT_FOUND" || error?.status === 404 ? 404 : 500;
}

export default function AllNotes({
  scope = "mine",
  summaryId,
  banner,
  loadPage = loadStudyNotePage,
  initialPage,
  accessState = "checking",
}) {
  const router = useRouter();
  const normalizedScope = scope === "summary"
    ? "summary"
    : scope === "all"
      ? "all"
      : "mine";
  const scopeKey = getScopeKey(normalizedScope, summaryId);
  const [resolvedAccessState, setResolvedAccessState] = useState(accessState);
  const shouldLoadList = canReadList(normalizedScope, resolvedAccessState);
  const [listState, setListState] = useState(() =>
    createInitialState(initialPage, shouldLoadList),
  );
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);
  const sentinelRef = useRef(null);
  const isMountedRef = useRef(false);
  const scopeVersionRef = useRef(0);
  const requestTrackerRef = useRef(createRequestTracker(scopeKey));

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    scopeVersionRef.current += 1;
    requestTrackerRef.current = createRequestTracker(scopeKey);
  }, [scopeKey]);

  useEffect(() => {
    if (!shouldLoadList || initialPage || typeof loadPage !== "function") {
      return undefined;
    }

    const tracker = requestTrackerRef.current;
    const requestScopeVersion = scopeVersionRef.current;

    if (tracker.scopeKey !== scopeKey) {
      return undefined;
    }

    const cursorKey = getCursorKey(null);

    if (
      tracker.inFlightCursor === cursorKey ||
      tracker.requestedCursors.has(cursorKey)
    ) {
      return undefined;
    }

    tracker.inFlightCursor = cursorKey;
    tracker.requestedCursors.add(cursorKey);
    let ignore = false;

    async function loadInitialPage() {
      try {
        const response = await loadPage(createScope(normalizedScope, summaryId), null);

        if (
          ignore ||
          !isMountedRef.current ||
          requestTrackerRef.current !== tracker ||
          scopeVersionRef.current !== requestScopeVersion
        ) {
          return;
        }

        const page = normalizePage(response);

        setListState(currentState => ({
          ...currentState,
          ...page,
          hasLoaded: true,
          isInitialLoading: false,
          error: null,
        }));
      } catch (error) {
        if (
          ignore ||
          !isMountedRef.current ||
          requestTrackerRef.current !== tracker ||
          scopeVersionRef.current !== requestScopeVersion
        ) {
          return;
        }

        setListState(currentState => ({
          ...currentState,
          hasLoaded: true,
          hasMore: false,
          isInitialLoading: false,
          error,
        }));
      } finally {
        if (
          requestTrackerRef.current === tracker &&
          tracker.inFlightCursor === cursorKey
        ) {
          tracker.inFlightCursor = null;
        }
      }
    }

    void loadInitialPage();

    return () => {
      ignore = true;
    };
  }, [initialPage, loadPage, normalizedScope, scopeKey, shouldLoadList, summaryId]);

  const handleLoadMore = useCallback(async () => {
    if (
      !shouldLoadList ||
      typeof loadPage !== "function" ||
      !listState.hasLoaded ||
      listState.isInitialLoading ||
      listState.isLoadingMore ||
      !listState.hasMore ||
      !listState.nextCursor
    ) {
      return;
    }

    const cursor = listState.nextCursor;
    const cursorKey = getCursorKey(cursor);
    const tracker = requestTrackerRef.current;
    const requestScopeVersion = scopeVersionRef.current;

    if (tracker.scopeKey !== scopeKey) {
      return;
    }

    if (
      tracker.inFlightCursor === cursorKey ||
      tracker.requestedCursors.has(cursorKey)
    ) {
      return;
    }

    tracker.inFlightCursor = cursorKey;
    tracker.requestedCursors.add(cursorKey);
    setListState(currentState => ({
      ...currentState,
      isLoadingMore: true,
      error: null,
    }));

    try {
      const response = await loadPage(createScope(normalizedScope, summaryId), cursor);

      if (
        !isMountedRef.current ||
        requestTrackerRef.current !== tracker ||
        scopeVersionRef.current !== requestScopeVersion
      ) {
        return;
      }

      const page = normalizePage(response);

      setListState(currentState => {
        const existingKeys = new Set(currentState.items.map(getItemKey));
        const newItems = page.items.filter(item => !existingKeys.has(getItemKey(item)));
        const responseCursorKey = getCursorKey(page.nextCursor);
        const hasValidNextCursor =
          page.hasMore && page.nextCursor && responseCursorKey !== cursorKey;

        return {
          ...currentState,
          items: [...currentState.items, ...newItems],
          totalCount: page.totalCount,
          nextCursor: hasValidNextCursor ? page.nextCursor : null,
          hasMore: Boolean(hasValidNextCursor),
          isLoadingMore: false,
          error: null,
        };
      });
    } catch (error) {
      tracker.requestedCursors.delete(cursorKey);

      if (
        !isMountedRef.current ||
        requestTrackerRef.current !== tracker ||
        scopeVersionRef.current !== requestScopeVersion
      ) {
        return;
      }

      setListState(currentState => ({
        ...currentState,
        hasMore: false,
        isLoadingMore: false,
        error,
      }));
    } finally {
      if (
        requestTrackerRef.current === tracker &&
        tracker.inFlightCursor === cursorKey
      ) {
        tracker.inFlightCursor = null;
      }
    }
  }, [listState, loadPage, normalizedScope, scopeKey, shouldLoadList, summaryId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (
      !shouldLoadList ||
      !sentinel ||
      !listState.hasLoaded ||
      listState.isInitialLoading ||
      listState.isLoadingMore ||
      !listState.hasMore
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      {
        rootMargin: "200px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [
    handleLoadMore,
    listState.hasLoaded,
    listState.hasMore,
    listState.isInitialLoading,
    listState.isLoadingMore,
    shouldLoadList,
  ]);

  async function handlePasswordSubmit(password) {
    if (isPasswordSubmitting || normalizedScope !== "summary") {
      return;
    }

    setPasswordError("");
    setIsPasswordSubmitting(true);

    try {
      await getSummaryContent(summaryId, password);

      scopeVersionRef.current += 1;
      requestTrackerRef.current = createRequestTracker(scopeKey);
      setResolvedAccessState("authorized");
      setListState(createInitialState(null, true));
    } catch (error) {
      if (error?.code === "INVALID_PASSWORD" || error?.status === 403) {
        setPasswordError(error.message ?? PASSWORD_ERROR_MESSAGE);
      } else if (error?.code === "SUMMARY_NOT_FOUND" || error?.status === 404) {
        setResolvedAccessState("notFound");
      } else {
        setResolvedAccessState("error");
      }
    } finally {
      setIsPasswordSubmitting(false);
    }
  }

  function handlePasswordClose() {
    router.back();
  }

  function handleErrorClose() {
    const isNotFound =
      resolvedAccessState === "notFound" || listState.error?.code === "NOT_FOUND";

    if (isNotFound) {
      router.replace("/");
      return;
    }

    if (normalizedScope === "summary") {
      router.replace(`/summary/${summaryId}`);
      return;
    }

    router.replace(normalizedScope === "mine" ? "/mypage" : "/");
  }

  const initialItemCount = Array.isArray(initialPage?.items) && shouldLoadList
    ? initialPage.items.length
    : 0;
  const hasPageLoader = typeof loadPage === "function";
  const hasBanner = typeof banner?.imageSrc === "string" && banner.imageSrc.trim() !== "";
  const hasInitialError = Boolean(listState.error && listState.items.length === 0);
  const isNotFound = resolvedAccessState === "notFound";
  const isAccessError = resolvedAccessState === "error" || isNotFound;
  const isErrorModalOpen = isAccessError || Boolean(listState.error);
  const errorStatus = isNotFound ? 404 : getErrorStatus(listState.error);

  const pageContent = !shouldLoadList ? (
    resolvedAccessState === "checking" ? <Loading /> : null
  ) : listState.isInitialLoading ? (
    <Loading />
  ) : (
    <>
      {hasBanner && (
        <div className={styles["all-notes-banner"]}>
          <Banner
            imageSrc={banner.imageSrc}
            alt={banner.alt}
            href={banner.destinationUrl}
          />
        </div>
      )}

      <div className={styles["all-notes-header"]}>
        <h1 className={styles["all-notes-summary"]}>
          총 {listState.totalCount}개의 학습노트
        </h1>
      </div>

      <div className={styles["all-notes-content"]}>
        {/* 목록의 열 구조를 보조기기가 같은 순서로 이해할 수 있도록 표 역할과 열 이름을 제공합니다. */}
        <div className={styles["all-notes-table"]} role="table" aria-label="학습노트 목록">
          <div className={styles["all-notes-table-header"]} role="row">
            <span role="columnheader">상태</span>
            <span role="columnheader">작성자</span>
            <span role="columnheader">제목</span>
            <span role="columnheader">작성일</span>
          </div>

          <div className={styles["all-notes-table-body"]}>
            {hasInitialError ? (
              <p className={styles["all-notes-status"]} role="alert">
                학습노트를 불러오지 못했습니다.
              </p>
            ) : listState.items.length === 0 ? (
              <EmptyState message={EMPTY_MESSAGE} />
            ) : (
              listState.items.map(item => (
                <NoteItem
                  key={getItemKey(item)}
                  summaryId={item.summaryId}
                  noteId={item.noteId}
                  authorNickname={item.authorNickname}
                  title={item.title}
                  createdAt={item.createdAtDisplay}
                  quizStatus={item.quizStatus}
                />
              ))
            )}
          </div>
        </div>

        {listState.hasMore && listState.items.length > 0 && (
          <>
            {/* 추가 조회 감지용 요소는 화면에 의미 있는 콘텐츠로 낭독되지 않게 숨깁니다. */}
            <div
              ref={sentinelRef}
              className={styles["all-notes-sentinel"]}
              aria-hidden="true"
            />
          </>
        )}
      </div>
    </>
  );

  return (
    <main
      className={styles["all-notes"]}
      data-scope={normalizedScope}
      data-summary-id={typeof summaryId === "string" ? summaryId : undefined}
      data-access-state={resolvedAccessState}
      data-has-page-loader={hasPageLoader}
      data-initial-item-count={initialItemCount}
      data-has-banner={hasBanner}
      data-loading-more={listState.isLoadingMore}
    >
      {pageContent}

      <NotePwModal
        isOpen={resolvedAccessState === "passwordRequired"}
        isSubmitting={isPasswordSubmitting}
        errorMessage={passwordError}
        onSubmit={handlePasswordSubmit}
        onClose={handlePasswordClose}
      />

      <CommonModal
        isOpen={isErrorModalOpen}
        mode="error"
        status={errorStatus}
        onClose={handleErrorClose}
      />
    </main>
  );
}
