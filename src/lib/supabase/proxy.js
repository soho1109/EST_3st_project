// 세션 작업
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePbKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function updateSession(request) {
  /*
   * 현재 요청을 다음 처리 단계로 전달할 기본 응답입니다.
   * 세션이 갱신되면 이 응답에 새로운 쿠키와 캐시 방지 헤더를 추가합니다.
   */
  let supabaseResponse = NextResponse.next({
    request,
  });

  /*
   * Proxy는 사용자 요청마다 실행되므로 매 요청마다 새 클라이언트를 만듭니다.
   * 여러 사용자의 세션이 섞일 수 있으므로 전역 변수에 클라이언트를 저장하지 않습니다.
   */
  const supabase = createServerClient(supabaseUrl, supabasePbKey, {
    cookies: {
      // 브라우저가 현재 요청과 함께 보낸 모든 쿠키를 Supabase에 전달합니다.
      getAll() {
        return request.cookies.getAll();
      },

      /*
       * Supabase가 세션을 갱신하면 변경할 쿠키와 캐시 방지 헤더를 전달합니다.
       * request와 response 양쪽을 갱신해 서버와 브라우저의 세션 상태를 맞춥니다.
       */
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        // 변경된 요청 쿠키를 기준으로 브라우저에 반환할 응답을 다시 생성합니다.
        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        // 사용자별 인증 응답이 Vercel 등에 캐시되지 않도록 헤더를 적용합니다.
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  /*
   * 현재 세션 토큰을 검증합니다.
   * 토큰 갱신이 필요하면 위의 setAll()이 호출되어 새로운 쿠키가 반영됩니다.
   */
  await supabase.auth.getClaims();

  /*
   * 현재 단계에서는 로그인 여부에 따른 리다이렉트를 처리하지 않습니다.
   * 갱신된 세션 쿠키가 포함된 응답만 반환합니다.
   */
  return supabaseResponse;
}
