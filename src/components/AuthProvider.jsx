"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext(null);

// 사이트 레이아웃 아래의 모든 Client Component가 같은 Supabase 사용자 상태를 공유하게 합니다.
export function AuthProvider({ children }) {
  // 페이지가 다시 렌더링되어도 같은 브라우저용 Supabase 클라이언트를 유지합니다.
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  // 최초 세션 확인 전의 null 사용자를 비로그인으로 오판하지 않도록 별도로 구분합니다.
  const [isAuthLoading, setIsAuthLoading] = useState(true); // 인증 정보를 불러오는 중인지 확인
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const { data } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(data.user ?? null);
        setIsAuthLoading(false);
      }
    }

    initializeAuth();

    // 로그인·로그아웃·토큰 갱신 결과를 받아 모든 소비자가 같은 사용자 상태를 공유하게 합니다.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // onAuthStateChange 콜백과, 그 안의 함수를 supabase에 등록. 인증상태 변경 감지 시 함수 실행
      if (isMounted) {
        setUser(session?.user ?? null);
        setIsAuthLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (isLoggingOut) {
      return { error: null };
    }

    setIsLoggingOut(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        setIsLoggingOut(false);
        return { error };
      }

      // 로그아웃된 상태로 앱을 다시 시작하여 보호 페이지의 모달이 잠깐 나타나는 것을 방지합니다.
      window.location.replace("/");

      return { error: null };
    } catch (error) {
      setIsLoggingOut(false);
      return { error };
    }
  }, [isLoggingOut, supabase]);
  const authValue = useMemo(
    () => ({
      supabase,
      user,
      isAuthenticated: Boolean(user),
      isAuthLoading,
      isLoggingOut,
      signOut,
    }),
    [isAuthLoading, isLoggingOut, signOut, supabase, user],
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);

  // Provider 밖에서 호출하면 기본값으로 오동작하는 대신 구성 오류를 즉시 알립니다.
  if (!auth) {
    throw new Error("useAuth는 AuthProvider 내부에서 사용해야 합니다.");
  }

  return auth;
}
