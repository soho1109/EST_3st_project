import { updateSession } from "@/lib/supabase/proxy";

// 페이지 요청이 들어올 때 Supabase 세션 확인과 갱신을 공통 유틸리티에 맡깁니다.
export async function proxy(request) {
  return await updateSession(request);
}

export const config = {
  /*
   * 페이지 요청에는 Proxy를 실행하고,
   * Next.js 내부 정적 파일과 이미지 요청에는 실행하지 않습니다.
   */
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
