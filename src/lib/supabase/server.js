// 로그인 사용자의 권한 요청
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 서버 클라이언트가 연결할 Supabase 프로젝트의 공개 접속 정보입니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePbKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export async function createClient() {
  // 현재 요청에 포함된 로그인 세션 쿠키를 읽고 관리하는 Next.js 쿠키 저장소입니다.
  const cookieStore = await cookies();

  // 서버에서 현재 요청 사용자의 쿠키를 사용하는 Supabase 클라이언트를 생성합니다.
  return createServerClient(supabaseUrl, supabasePbKey, {
    cookies: {
      // Supabase가 현재 요청의 인증 세션을 찾을 수 있도록 모든 쿠키를 전달합니다.
      getAll() {
        return cookieStore.getAll();
      },

      /*
       * Supabase가 토큰 갱신 등으로 변경하려는 쿠키 목록을 전달합니다.
       * cookiesToSet은 저장할 쿠키 객체의 배열이고, _headers는 캐시 방지 응답 헤더입니다.
       * 이 서버 클라이언트에서는 응답 헤더를 직접 다루지 않아 _headers를 사용하지 않습니다.
       */
      setAll(cookiesToSet, _headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Supabase가 정한 쿠키 이름, 세션 값과 옵션을 Next.js 응답 쿠키에 반영합니다.
            cookieStore.set(name, value, options);
          });
        } catch {
          /*
           * Server Component는 렌더링 중 응답 쿠키를 변경할 수 없습니다.
           * 이 경우 세션 쿠키 갱신은 이후 구성할 Next.js Proxy가 담당합니다.
           */
        }
      },
    },
  });
}
