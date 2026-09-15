# 조사 결과: 공통 모달

## 결정 1: 클라이언트 컴포넌트 경계

**결정**: 상태, 클릭 이벤트, 타이머와 클라이언트 라우팅을 사용하는 `CommonModal.jsx` 및 개발 확인 페이지에만 `"use client"`를 선언한다.

**근거**: Next.js App Router에서 상태와 이벤트 핸들러 같은 브라우저 상호작용은 Client Component 경계가 필요하다. 함수 props인 `onClose`와 `onConfirm`을 구성하는 호출부도 Client Component 경계 안에 있어야 한다. 루트 레이아웃이나 다른 페이지까지 Client Component로 넓힐 이유는 없다.

**검토한 대안**: 상위 레이아웃 전체를 Client Component로 전환하는 방식은 변경 범위와 클라이언트 번들을 불필요하게 넓혀 제외한다.

## 결정 2: 정적 이동과 조건부 이동의 분리

**결정**: `suggestLogin` 버튼의 `/login`, `/summary` 이동은 `Link`를 사용하고, 모드 및 시간에 따라 실행되는 `/login`, `/` 이동은 `useRouter().replace()`를 사용한다. 오류 상태 401은 재인증을 위해 `/login`, 나머지 오류는 `/`로 이동한다.

**근거**: AGENTS.md는 고정 목적지 이동에 `Link`, 조건에 따른 이동에 `useRouter`를 우선하도록 정한다. 자동 이동은 사용자가 제한·오류 화면으로 되돌아오지 않도록 현재 히스토리 항목을 교체한다.

**검토한 대안**: 모든 이동을 클릭 핸들러와 `router.push`로 통일하면 정적 링크 규칙을 따르지 않고, 자동 이동 뒤 뒤로 가기 시 같은 안내가 반복될 수 있어 제외한다.

## 결정 3: 자동 이동 타이머 수명

**결정**: `isOpen`과 `mode`를 기준으로 `useEffect` 안에서 3초 타이머를 하나만 만들고, 효과 정리 함수에서 `clearTimeout`한다.

**근거**: React Effect의 정리 함수는 의존성 변경과 언마운트 전에 실행되므로 닫기·모드 변경·경로 이동 때 예약 작업을 제거할 수 있다. 개발 환경의 Strict Mode에서 효과가 점검 목적으로 다시 실행되더라도 정리 함수가 있으면 타이머 중복을 막을 수 있다.

**검토한 대안**: 렌더링 본문에서 타이머를 만들면 재렌더링마다 중복 예약될 수 있고, 전역 타이머 저장은 이 기능에 불필요한 공유 상태를 만든다.

## 결정 4: 오류 전달 경계

**결정**: 호출 측이 성공 응답 범위와 네트워크 예외를 판정하고 `CommonModal`에는 정규화된 숫자 `status`, 문자열 `network` 또는 미지정 값만 전달한다.

**근거**: 모달은 요청을 실행하지 않으므로 Promise나 Response를 알 필요가 없다. 제한된 값만 받아야 내부 서버 메시지 노출을 막고 고정 문구 계약을 유지할 수 있다.

**검토한 대안**: Promise·Response·Error 객체를 직접 전달하거나 모달이 요청을 실행하는 방식은 UI 책임을 넘어가고 실제 API 구현 금지 조건과 충돌한다.

## 결정 5: 이미지와 기존 디자인 기반

**결정**: `public/images/fbee.webp`는 이름을 바꾸지 않고 `/images/fbee.webp` 경로로 `next/image`에 제공한다. 색상과 타이포그래피는 기존 SCSS abstracts를 재사용한다.

**근거**: Next.js의 `public` 자산은 사이트 루트 기준 경로로 참조할 수 있고, 기존 프로젝트 규칙은 스타일 토큰 구조 보존을 요구한다.

**검토한 대안**: 자산을 import하거나 영문명으로 복제·변경하는 방식은 요청 범위를 벗어난 파일 변경이므로 제외한다.

## 결정 6: 과거 페이지 명세 충돌 처리

**결정**: `005-common-modal/spec.md`와 이번 계획 입력을 공통 컴포넌트 구현 계약으로 사용하며, 과거 페이지별 다른 후속 이동은 해당 페이지 통합 전 별도 정합성 작업으로 남긴다.

**근거**: 이번 요청은 `error` 모드의 3초 후 및 닫기 시 메인 이동을 명시했다. 동시에 기존 페이지 코드와 명세를 수정하지 말아야 하므로 이 계획에서 충돌 문서를 재작성할 수 없다.

**검토한 대안**: 호출자가 임의 경로를 props로 주도록 만들면 호출 부담을 줄이고 고정 경로를 소유한다는 최신 명세와 충돌한다.

## 참고 자료

- Next.js `use client`: https://nextjs.org/docs/app/api-reference/directives/use-client
- Next.js `useRouter`: https://nextjs.org/docs/app/api-reference/functions/use-router
- Next.js `Link`: https://nextjs.org/docs/app/api-reference/components/link
- Next.js `public` 폴더: https://nextjs.org/docs/app/api-reference/file-conventions/public-folder
- Next.js Image: https://nextjs.org/docs/app/api-reference/components/image
- React `useEffect`: https://react.dev/reference/react/useEffect
