"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";

export default function LoadingTestPage() {
  // 실제 페이지에서도 요청 시작과 종료에 맞춰 이 Boolean 상태로 Loading을 제어합니다.
  const [isLoading, setIsLoading] = useState(false);

  // 별도 API 없이 Loading의 제거 동작을 확인하기 위해 표시 후 3초가 지나면 상태를 해제합니다.
  useEffect(() => {
    if (!isLoading) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    // 페이지가 사라지거나 isLoading이 변경되면 남아 있는 타이머를 정리합니다.
    return () => {
      window.clearTimeout(timerId);
    };
  }, [isLoading]);

  function handleShowLoading() {
    setIsLoading(true);
  }

  return (
    // 개발 확인 화면 전체가 처리 중인지 보조기기에 전달합니다.
    <main aria-busy={isLoading}>
      <h1>Loading 개발 확인</h1>
      <p>버튼을 누르면 전체 화면 Loading이 3초 동안 표시됩니다.</p>

      <label htmlFor="loading-test-input">뒤쪽 입력 확인</label>
      <input id="loading-test-input" type="text" disabled={isLoading} />

      <button type="button" onClick={handleShowLoading} disabled={isLoading}>
        Loading 표시
      </button>

      {isLoading && <Loading />}
    </main>
  );
}
