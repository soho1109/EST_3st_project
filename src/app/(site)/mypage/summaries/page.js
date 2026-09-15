import AllSummary from "@/components/Allsummary";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import attachProfilesToSummaries from "@/lib/supabase/summary";

export default async function Summaries() {
  // 서버에서 사용할 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 로그인한 사용자 정보를 가져와서 user에 저장
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 로그인한 사용자가 없으면 로그인 페이지로 이동
  if (userError || !user) {
    redirect("/login");
  }

  // 현재 사용자가 작성한 요약본 조회
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
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  // 요약본 조회 실패
  if (summariesError) {
    console.error("내 요약노트 조회 실패:", summariesError);
    return null;
  }

  // 현재 사용자의 북마크한 summary_id 조회
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("summary_id")
    .eq("user_id", user.id);

  // 북마크 조회 실패
  if (bookmarksError) {
    console.error("북마크 조회 실패:", bookmarksError);
    return null;
  }

  // 공통 함수를 사용해 요약본에 작성자 프로필 정보 연결
  const summariesWithProfiles = await attachProfilesToSummaries(supabase, summaries ?? []);

  // 각 요약본에 현재 사용자의 북마크 여부 추가
  const summaryCards = summariesWithProfiles.map(summary => ({
    ...summary,
    isBookmarked: (bookmarks ?? []).some(bookmark => bookmark.summary_id === summary.id),
  }));

  // 가공한 요약 카드 데이터를 AllSummary에 전달
  return (
    <AuthGuard>
      <AllSummary title="내 요약 노트" summaries={summaryCards} />
    </AuthGuard>
  );
}
