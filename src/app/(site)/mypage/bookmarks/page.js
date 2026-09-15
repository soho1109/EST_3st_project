import AllSummary from "@/components/Allsummary";
import AuthGuard from "@/components/AuthGuard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import attachProfilesToSummaries from "@/lib/supabase/summary";

export default async function Bookmarks() {
  // 서버에서 사용할 Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 로그인한 사용자 정보를 가져와 user에 저장
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // 로그인한 사용자가 없으면 로그인 페이지로 이동
  if (userError || !user) {
    redirect("/login");
  }

  // 현재 사용자가 북마크한 summary_id 조회
  const { data: bookmarks, error: bookmarksError } = await supabase
    .from("bookmarks")
    .select("summary_id")
    .eq("user_id", user.id);

  // 북마크 조회 실패
  if (bookmarksError) {
    console.error("북마크 조회 실패:", bookmarksError);
    return null;
  }

  // 북마크 데이터에서 summary_id만 추출해 배열로 만들기
  const summaryIds = (bookmarks ?? []).map(bookmark => bookmark.summary_id);

  // 북마크한 summary_id에 해당하는 요약본 조회
  const { data: summaries, error: summariesError } = await supabase
    .from("summaries")
    .select(`id,author_id,topic,title,excerpt,is_locked,created_at`)
    .in("id", summaryIds);

  // 북마크한 요약본 조회 실패
  if (summariesError) {
    console.error("북마크 요약 조회 실패:", summariesError);
    return null;
  }

  // 공통 함수를 사용해 각 요약본에 작성자 닉네임과 프로필 이미지 연결
  const summariesWithProfiles = await attachProfilesToSummaries(supabase, summaries ?? []);

  // 북마크 페이지에 표시되는 카드는 모두 북마크된 상태로 설정
  const summaryCards = summariesWithProfiles.map(summary => ({
    ...summary,
    isBookmarked: true,
  }));

  // 가공한 북마크 카드 데이터를 AllSummary에 전달
  return (
    <AuthGuard>
      <AllSummary title="북마크" summaries={summaryCards} isBookmarkPage />
    </AuthGuard>
  );
}
