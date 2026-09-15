"use client";

import CommonModal from "./CommonModal";
import Loading from "./Loading";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";

export default function AuthGuard({ children }) {
  const { isAuthenticated, isAuthLoading, isLoggingOut } = useAuth();
  const pathname = usePathname();
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname || "/")}`;

  // 최초 세션 확인 중에는 보호 화면을 먼저 공개하지 않습니다.
  if (isAuthLoading || isLoggingOut) {
    return <Loading />;
  }

  // 보호할 children을 렌더링하지 않아 비로그인 사용자에게 페이지 내용이 모달 뒤로 노출되지 않게 합니다.
  if (!isAuthenticated) {
    return <CommonModal isOpen mode="requireLogin" loginHref={loginHref} />;
  }

  return children;
}
