// bookmarks & summary에서 공통으로 사용하는 프로필 연결 로직

export default async function attachProfilesToSummaries(supabase, summaries = []) {
  // summaries에서 작성자 author_id만 추출하고 중복 제거
  const authorIds = [...new Set(summaries.map(summary => summary.author_id))];

  // authorIds에 해당하는 작성자 프로필 조회
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,nickname,profile_image_url")
    .in("id", authorIds);

  // 프로필 조회 실패 시 빈 배열 반환
  if (profileError) {
    console.error("프로필 조회 실패:", profileError);
    return [];
  }

  // profile.id를 기준으로 프로필을 쉽게 찾을 수 있도록 Map으로 변환
  const profileMap = new Map((profiles ?? []).map(profile => [profile.id, profile]));

  // 각 summary의 author_id와 작성자 프로필을 연결
  return summaries.map(summary => {
    const profile = profileMap.get(summary.author_id);

    // summary 데이터에 작성자 닉네임과 프로필 이미지를 추가해 반환
    return {
      ...summary,
      nickname: profile?.nickname,
      profile_image_url: profile?.profile_image_url,
    };
  });
}
