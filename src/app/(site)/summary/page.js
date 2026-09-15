import AllSummary from "@/components/Allsummary";
import { createClient } from "@/lib/supabase/server";
import attachProfilesToSummaries from "@/lib/supabase/summary";

export default async function Summary() {
  // 서버에서 사용할 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 로그인 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let bookmarks = [];

  if (user) {
    // 비로그인 방문자는 북마크 관계를 조회하지 않고 공개 요약본만 표시합니다.
    const { data, error: bookmarksError } = await supabase
      .from("bookmarks")
      .select("summary_id")
      .eq("user_id", user.id);

    if (bookmarksError) {
      console.error("북마크 조회 실패:", bookmarksError);
      return null;
    }

    bookmarks = data ?? [];
  }

  //전체 summaries 조회
  const { data: summaries, error: summariesError } = await supabase
    .from("summaries")
    .select(
      `
    id,
    author_id,
    topic,
    title,
    excerpt,
    is_locked,
    created_at
    `,
    )
    // 최신 작성순으로 정렬
    .order("created_at", { ascending: false });

  // 전체 요약 노트 조회 실패
  if (summariesError) {
    console.error("전체 요약 노트 조회 실패:", summariesError);
    return null;
  }

  // 공통 함수를 사용해 각 summary에 작성자 닉네임과 프로필 이미지 연결
  const summaryCards = await attachProfilesToSummaries(supabase, summaries ?? []);

  //bookmarks 안에 같은 summary_id가 있는지 확인
  const summariesWithBookmarks = summaryCards.map(summary => ({
    ...summary,
    isBookmarked: (bookmarks ?? []).some(bookmark => bookmark.summary_id === summary.id),
  }));

  // 가공한 요약 카드 데이터를 AllSummary에 전달
  return <AllSummary title="전체 요약 노트" summaries={summariesWithBookmarks} />;
}
