import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// 화면 크기별 한 번에 보여줄 카드 개수
const BATCH_SIZE = {
  mobile: 3,
  tablet: 6,
  pc: 12,
};

// 현재 화면이 모바일, 태블릿, PC인지 판단해 카드 개수를 반환
function getBatchSize(mobileMediaQuery, tabletMediaQuery) {
  if (mobileMediaQuery.matches) {
    return BATCH_SIZE.mobile;
  }

  if (tabletMediaQuery.matches) {
    return BATCH_SIZE.tablet;
  }

  return BATCH_SIZE.pc;
}

export default function useAll(summaries = [], isBookmarkPage = false) {
  const [summaryList, setSummaryList] = useState(summaries);
  // 검색어 저장
  const [searchTerm, setSearchTerm] = useState("");

  // 무한 스크롤 시 한 번에 추가할 카드 개수
  const [batchSize, setBatchSize] = useState(BATCH_SIZE.mobile);

  // 현재 화면에 표시할 카드 개수
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE.mobile);

  // 현재 화면 크기의 batchSize 값을 유지
  const batchSizeRef = useRef(BATCH_SIZE.mobile);

  // 무한 스크롤의 마지막 지점을 감지하기 위한 ref
  const sentinelRef = useRef(null);

  // 검색어의 앞뒤 공백을 제거하고 소문자로 변환
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  // TODO: 추후 검색 데이터가 많아지면 Supabase 검색 쿼리 방식으로 변경
  // topic에 검색어가 포함된 요약 노트만 필터링
  const filteredSummaries = normalizedSearchTerm
    ? summaryList.filter(summary => summary.topic?.toLowerCase().includes(normalizedSearchTerm))
    : summaryList;

  // 화면에 사용할 요약 카드 목록
  const summaryCards = filteredSummaries;

  // 검색 결과가 변경됐는지 확인하기 위한 id 조합
  const resultKey = summaryCards.map(summary => summary.id).join("|");

  // 추가로 보여줄 카드가 남아 있는지 확인
  const hasMore = visibleCount < summaryCards.length;

  // TODO: 추후 데이터가 많아지면 Supabase pagination 방식으로 변경
  // 현재 visibleCount만큼의 카드만 화면에 표시
  const visibleSummaryCards = summaryCards.slice(0, visibleCount);

  // 전체 데이터 자체가 없는 경우
  const isEmpty = summaryList.length === 0;

  // 검색했는데 결과가 없는 경우
  const isSearchEmpty = normalizedSearchTerm !== "" && filteredSummaries.length === 0;

  // 화면 크기가 변경될 때 한 번에 표시할 카드 개수 조정
  useEffect(() => {
    const mobileMediaQuery = window.matchMedia("(max-width: 480px)");
    const tabletMediaQuery = window.matchMedia("(min-width: 481px) and (max-width: 1024px)");

    function handleBreakpointChange() {
      // 현재 화면 크기에 맞는 카드 개수 계산
      const nextBatchSize = getBatchSize(mobileMediaQuery, tabletMediaQuery);

      batchSizeRef.current = nextBatchSize;
      setBatchSize(nextBatchSize);

      // 화면 크기가 변경돼도 기존에 보던 카드 개수가 갑자기 줄어들지 않도록 처리
      setVisibleCount(currentCount => Math.max(currentCount, nextBatchSize));
    }

    // 처음 렌더링될 때 현재 화면 크기 확인
    handleBreakpointChange();

    // 화면 크기가 breakpoint를 넘을 때마다 카드 개수 다시 계산
    mobileMediaQuery.addEventListener("change", handleBreakpointChange);
    tabletMediaQuery.addEventListener("change", handleBreakpointChange);

    // 컴포넌트가 사라질 때 이벤트 제거
    return () => {
      mobileMediaQuery.removeEventListener("change", handleBreakpointChange);
      tabletMediaQuery.removeEventListener("change", handleBreakpointChange);
    };
  }, []);

  // 검색 결과가 바뀌면 현재 화면 크기의 초기 카드 개수로 reset
  useEffect(() => {
    setVisibleCount(batchSizeRef.current);
  }, [normalizedSearchTerm, resultKey]);

  // 화면 하단 감지 지점을 이용한 무한 스크롤 처리
  useEffect(() => {
    const sentinel = sentinelRef.current;

    // 감지할 요소가 없거나 더 보여줄 카드가 없으면 종료
    if (!sentinel || !hasMore) {
      return undefined;
    }

    // sentinel이 화면 근처에 들어왔는지 감지
    const observer = new IntersectionObserver(
      entries => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        // 현재 화면 크기의 batchSize만큼 카드 추가
        setVisibleCount(currentCount => Math.min(currentCount + batchSize, summaryCards.length));
      },
      {
        root: null,

        // 사용자가 끝까지 내려가기 약 200px 전에 다음 카드 추가
        rootMargin: "200px 0px",

        threshold: 0,
      },
    );

    // sentinel 감시 시작
    observer.observe(sentinel);

    // effect 재실행 또는 컴포넌트 제거 시 감시 종료
    return () => {
      observer.disconnect();
    };
  }, [batchSize, hasMore, summaryCards.length, visibleCount]);

  // 북마크 추가/삭제 처리
  async function handleBookmarkToggle(summaryId) {
    const supabase = createClient();

    //현재 로그인 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    //로그인 사용자가 없으면 동작 중단
    if (!user) return;

    //클릭한 요약 카드 찾기
    const targetSummary = summaryList.find(summary => summary.id === summaryId);

    if (!targetSummary) return;

    //현재 북마크 상태 확인
    const isBookmarked = targetSummary.isBookmarked ?? false;

    if (isBookmarked) {
      // 이미 북마크된 경우 bookmarks 테이블에서 삭제
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("summary_id", summaryId);

      if (error) {
        console.error("북마크 삭제 실패:", error);
        return;
      }
    } else {
      // 북마크되지 않은 경우 bookmarks 테이블에 추가
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        summary_id: summaryId,
      });

      if (error) {
        console.error("북마크 추가 실패:", error);
        return;
      }
    }

    // DB 작업 성공 후 화면의 북마크 상태 변경
    setSummaryList(currentSummaries => {
      // 북마크 페이지에서 북마크를 해제한 경우 카드 목록에서도 제거
      if (isBookmarkPage && isBookmarked) {
        return currentSummaries.filter(summary => summary.id !== summaryId);
      }

      // 다른 페이지에서는 카드의 북마크 상태만 변경
      return currentSummaries.map(summary =>
        summary.id === summaryId
          ? {
              ...summary,
              isBookmarked: !isBookmarked,
            }
          : summary,
      );
    });
  }

  return {
    searchTerm,
    setSearchTerm,
    visibleSummaryCards,
    hasMore,
    sentinelRef,
    handleBookmarkToggle,
    isEmpty,
    isSearchEmpty,
  };
}
