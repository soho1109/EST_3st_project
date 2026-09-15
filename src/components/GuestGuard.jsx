"use client";

import CommonModal from "./CommonModal";
import Loading from "./Loading";
import { useAuth } from "./AuthProvider";
import { useEffect, useState } from "react";

export default function GuestGuard({ children }) {
  const { isAuthenticated, isAuthLoading } = useAuth();

  // 비로그인 상태로 정상 진입한 뒤 로그인·회원가입에 성공해도 현재 절차를 차단하지 않도록 최초 상태만 판정합니다.
  const [accessStatus, setAccessStatus] = useState("checking");

  useEffect(() => {
    if (isAuthLoading || accessStatus !== "checking") {
      return;
    }
    // 최초 접근 결과를 한 번 고정해야 페이지 내부의 로그인 성공이 접근 차단으로 바뀌지 않습니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAccessStatus(isAuthenticated ? "blocked" : "allowed");
  }, [accessStatus, isAuthenticated, isAuthLoading]);

  if (isAuthLoading || accessStatus === "checking") {
    return <Loading />;
  }

  return (
    <>
      {children}

      {/* 이미 로그인한 상태로 진입한 경우에만 현재 화면 위에 안내 모달을 표시합니다. */}
      <CommonModal isOpen={accessStatus === "blocked"} mode="alreadyLoggedIn" />
    </>
  );
}
