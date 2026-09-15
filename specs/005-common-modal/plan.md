# 구현 계획: 공통 모달

**브랜치**: `feature/common-modal` | **작성일**: 2026-08-08 | **명세**: [`spec.md`](./spec.md)

**입력**: `/specs/005-common-modal/spec.md`의 기능 명세

## 요약

여섯 가지 `mode`를 하나의 `CommonModal`에서 표현하고, 모드별 고정 문구·버튼·이동 규칙을 컴포넌트 내부 설정으로 관리한다. `preparing`, `confirmDelete`, `suggestLogin`은 호출 측의 공개 상태와 최소 콜백으로 제어하고, `requireLogin`, `alreadyLoggedIn`, `error`는 컴포넌트가 3초 타이머와 고정 경로 이동을 담당한다. `error`는 전달받은 `status`를 사용자용 고정 문구로 변환하며 서버 원문은 받거나 표시하지 않는다.

## 기술 배경

**언어/버전**: JavaScript (ECMAScript), Node.js 버전은 프로젝트에서 별도 고정하지 않음

**주요 의존성**: Next.js 16.2.12, React 19.2.4, Sass 1.102.0

**저장소**: 해당 없음. 이 기능은 UI 상태만 다루며 데이터 영속화를 하지 않음

**테스트**: `/dev/commonmodal` 수동 시나리오 검증, ESLint, Next.js production build

**대상 플랫폼**: 데스크톱 웹 브라우저

**프로젝트 유형**: Next.js App Router 웹 애플리케이션

**성능 목표**: 모달 표시 중 뒤쪽 포인터 상호작용 0건, 자동 이동 1회, 중복 타이머 0건

**제약 사항**: 실제 API·인증·데이터베이스·삭제 요청 제외, 새 패키지 및 상태 관리 라이브러리 금지, Escape 및 배경막 클릭으로 닫기 금지, 모바일·태블릿 전용 배치 제외

**작업 규모**: 공통 컴포넌트 1개, 대응 SCSS Module 1개, 독립 개발 확인 페이지 1개

## 헌법 점검

_관문: 0단계 조사 전에 통과했으며 1단계 설계 후 다시 확인했다._

- [x] `AGENTS.md`, Constitution, `005`와 기존 공통 모달 관련 명세, 기존 `NotePwModal` 코드를 확인했다.
- [x] Next.js App Router, JavaScript, SCSS Module, `@/*` 별칭을 유지한다.
- [x] 승인되지 않은 의존성, 데이터 통신, 인증 또는 상태 관리 구조를 추가하지 않는다.
- [x] 기존 `NotePwModal`의 배경막·닫기 아이콘·스타일 토큰 사용 방식을 참고하되 역할이 다른 컴포넌트로 중복 구현하지 않는다.
- [x] 공통 모달 한 가지 기능과 승인된 세 소스 파일만 다룬다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성한다.
- [x] 계획 완료 후에도 위 관문 위반이 없음을 재확인했다.

## 기존 명세 정합성

`005-common-modal/spec.md`와 이번 사용자 조건을 공통 모달의 최신 계약으로 적용한다. 다음 과거 페이지 명세는 공통 계약과 후속 동작이 다르므로, 해당 페이지 통합 단계에서 별도 정합성 수정이 필요하다. 이번 기능에서는 과거 페이지 문서나 페이지 코드를 수정하지 않는다.

- `003-all-summary`: `suggestLogin`을 3초 후 `/login` 이동으로 사용한 항목은 최신 계약의 `requireLogin`에 해당한다.
- `003-all-summary`: 일부 오류 후 현재 페이지 새로고침 요구는 최신 `error` 계약의 3초 후 `/` 이동과 충돌한다.
- `003-all-notes`: 일반 조회 오류 종료 후 호출 경로별 이동 요구는 최신 `error` 계약의 고정 `/` 이동과 충돌한다.
- `002-summary-detail`: 오류 후 현재 입력·페이지 상태 보존 요구는 최신 `error`의 메인 이동과 함께 만족할 수 없다.
- `004-note-password-modal`: 오류 문구와 후속 동작을 `CommonModal` 계약에 위임하므로 최신 계약과 충돌하지 않는다.

## 기술 설계

### 컴포넌트 경계

- `CommonModal`은 `isOpen`, `mode`, 오류용 `status`, 닫기용 `onClose`, 삭제 승인용 `onConfirm`만 받는다.
- 문구, 버튼명, `/login`·`/summary`·`/` 경로와 3초 지연값은 호출자가 반복 전달하지 않고 컴포넌트 내부 모드 설정이 소유한다.
- 호출 측은 모달 공개 여부와 모드를 결정한다. 요청이 있는 화면에서는 HTTP 성공 범위와 네트워크 예외를 판정한 뒤 오류인 경우에만 정규화된 `status`를 전달한다.
- `CommonModal`은 Promise, 응답 객체, 오류 원문, 삭제 대상 또는 삭제 함수를 직접 다루지 않는다.
- 한 호출 위치에서 `CommonModal` 인스턴스 하나와 단일 `mode`만 렌더링한다. 여러 페이지에 걸친 전역 큐나 상태 관리자는 이 범위에 추가하지 않는다.

### 렌더링과 이동

- 상태·이벤트·타이머·클라이언트 라우팅이 필요하므로 `CommonModal.jsx`와 개발 확인 페이지에만 `"use client"`를 선언한다.
- `isOpen`이 거짓이면 렌더링하지 않으며 타이머도 존재하지 않는다.
- `suggestLogin`의 정적으로 정해진 버튼 이동은 `Link`를 사용한다.
- `requireLogin`, `alreadyLoggedIn`, `error`의 조건부·시간 기반 이동은 `useRouter`의 `replace`를 사용해 제한 또는 오류 화면으로 뒤로 돌아오는 흐름을 막는다. `error`는 401이면 `/login`, 나머지 상태면 `/`를 목적지로 선택한다.
- 자동 이동 모드는 `useEffect`에서 타이머 하나를 만들고 정리 함수에서 해제한다. 닫기 아이콘은 동일 목적지로 즉시 이동하며 기존 타이머는 정리되어야 한다.
- `error` 상태는 `401`, `403`, `404`, `429`, `500`, `502/503/504`, `network`, 그 외의 순서로 고정 문구에 매핑한다.

### 시각 및 상호작용

- `public/images/fbee.webp`를 `next/image`로 표시하며 현재 한글 파일명을 유지한다.
- 기존 색상·타이포그래피 토큰을 `@use`하고, CSS 클래스는 kebab-case와 대괄호 접근법을 사용한다.
- 고정 배경막이 화면 전체를 덮고 콘텐츠를 중앙 정렬한다. 배경막 클릭은 아무 동작도 연결하지 않고 Escape 핸들러도 등록하지 않는다.
- 닫기는 우측 상단 Material Symbols `close` 버튼으로 제공한다.
- 모달 컨테이너에는 dialog 의미, 모달 상태 및 안내 문구 연결 정보를 제공하고 아이콘 버튼은 보조기술용 이름을 갖는다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/005-common-modal/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── CommonModal.md
└── tasks.md              # 다음 /speckit-tasks 단계에서 생성
```

### 소스 코드

```text
src/
├── app/
│   └── (dev)/
│       └── dev/
│           ├── page.js                 # 수정하지 않음
│           └── commonmodal/
│               └── page.js             # 개발 확인용 생성
└── components/
    ├── CommonModal.jsx
    └── CommonModal.module.scss
```

**구조 결정**: 공통 컴포넌트는 AGENTS.md에 지정된 `src/components`의 평면 구조에 두고, 개발 확인 페이지는 사용자가 승인한 `(dev)/dev/commonmodal` 경로에만 추가한다. 기존 `(dev)/dev/page.js`와 제품 페이지는 수정하지 않는다.

## 구현 단계

1. `CommonModal.jsx`의 공개 props와 모드·오류 상태 설정을 구성하고 기본 렌더링 및 닫기 계약을 구현한다.
2. `preparing`, `confirmDelete`, `suggestLogin`의 수동 버튼 동작을 연결하고 각 단계별로 확인한다.
3. `requireLogin`, `alreadyLoggedIn`, `error`의 타이머·즉시 이동·정리 동작을 구현하고 중복 이동을 확인한다.
4. `CommonModal.module.scss`에 공통 디자인과 모드별 버튼 배치를 적용한다.
5. `src/app/(dev)/dev/commonmodal/page.js`에서 하나의 모달 인스턴스로 여섯 모드와 오류 상태를 선택해 검증한다.
6. 빠른 시작 시나리오, lint, build를 수행한다.

각 구현 단계는 작은 기능 단위로 완료·검증한 뒤 사용자에게 커밋 범위와 명령을 안내하고, 사용자가 커밋 완료를 알린 후 다음 단계로 진행한다. Codex는 직접 커밋하거나 push하지 않는다.

## 복잡성 기록

헌법 또는 AGENTS.md 위반 예외 없음.
