# 구현 계획: 회원가입 완료 페이지

**브랜치**: `003-signup-complete` | **작성일**: 2026-08-11 | **명세**: [spec.md](./spec.md)

**입력**: `specs/003-signup-complete/spec.md`의 기능 명세

## 요약

`/signup/complete`에 회원가입 완료 안내를 표시한다. 페이지는 현재 탭의 5분 이내 회원가입 완료 시각과 Supabase 로그인 세션을 확인한다. 유효한 비로그인 완료 흐름에는 안내를 표시하고, 표식 없는 비로그인 접근은 CommonModal의 상태 `403` 안내 후 `/signup`으로 이동하며, 로그인 접근은 `alreadyLoggedIn` 모드를 사용한다.

## 기술 배경

**언어/버전**: JavaScript, React 19.2.4

**주요 의존성**: Next.js 16.2.12 App Router, Sass 1.102.x, `next/image`, `next/link`

**저장소**: 해당 없음. 정적 안내 화면이며 데이터를 저장하거나 조회하지 않는다.

**테스트**: `npm run dev`를 통한 1320px·1024px·480px 수동 화면 및 이동 검증, `npm run lint`

**대상 플랫폼**: 최신 데스크톱·태블릿·모바일 웹 브라우저

**프로젝트 유형**: Next.js 웹 애플리케이션

**성능 목표**: 접근 확인 전 잘못된 완료 정보가 노출되지 않고, 허용된 사용자에게 이미지 영역의 레이아웃 이동 없이 완료 정보를 표시한다.

**제약 사항**: Header와 사이트 레이아웃을 수정하지 않는다. `sessionStorage`에는 완료 시각만 저장하고 인증·권한 판정에 사용하지 않는다. Loading, Suspense와 `loading.js`를 추가하지 않는다. 로그인 사용자 접근에는 기존 CommonModal의 `alreadyLoggedIn` 모드를 사용한다.

**작업 규모**: `/signup/complete` 페이지 1개와 해당 SCSS Module 1개

## 헌법 점검

_관문: 0단계 조사 전과 1단계 설계 후 모두 통과했다._

- [x] `AGENTS.md`, `specs/003-signup-complete/spec.md`, `specs/001-common-header/Header.md`와 관련 기존 코드를 확인했다.
- [x] Next.js App Router, JavaScript, SCSS Module과 `@/*` 별칭을 유지한다.
- [x] SCSS Module은 JavaScript에서 상대 경로로 불러오고 공통 SCSS는 `styles/abstracts/...` 경로를 사용한다.
- [x] 승인되지 않은 의존성, 폴더, 데이터 통신 구조를 추가하지 않는다.
- [x] 사이트 공통 Header를 레이아웃에서 제공받으며 직접 렌더링하거나 수정하지 않는다.
- [x] 회원가입 완료 페이지 한 가지 기능과 승인된 두 소스 파일만 다룬다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성한다.

### 설계 후 재점검

- [x] 조사와 화면 계약에서 인증·상태·모달·로딩 또는 새 공통 컴포넌트가 추가되지 않았다.
- [x] 데이터 모델은 저장 모델이 아닌 정적 표시 계약만 정의한다.
- [x] 검증 절차는 명세의 화면 크기, 이미지 비율, Header 경계와 `/login` 이동을 모두 다룬다.
- [x] 헌법을 위반하는 예외가 없다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/003-signup-complete/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── SignupCompletePage.md
└── tasks.md                 # /speckit-tasks 단계에서 생성
```

### 소스 코드

```text
src/app/(site)/signup/complete/
├── page.js
└── page.module.scss

public/images/
└── fbee.webp            # 기존 자산 재사용, 수정하지 않음
```

**구조 결정**: App Router의 기존 `/signup/complete` 경로에 `page.js`와 대응 SCSS Module만 추가한다. Header는 상위 `src/app/(site)/layout.js`가 제공하므로 페이지 파일에서 import하거나 렌더링하지 않는다. 공통 컴포넌트나 새 폴더 구조는 만들지 않는다.

## 구현 설계

### `page.js`

- 상태와 이벤트가 필요하지 않은 Server Component로 유지하며 `"use client"`를 작성하지 않는다.
- 최상위 `main` 안에 제목, 마스코트 영역, 두 줄 안내, 로그인 Link를 의미 순서대로 배치한다.
- 기존 `public/images/fbee.webp`를 `next/image`로 표시하고 의미 있는 대체 텍스트를 제공한다.
- 이미지의 `width`와 `height`는 종횡비 공간을 확보하는 기준값으로 제공하고 실제 화면별 크기는 SCSS에서 비율을 유지하며 조정한다.
- `Link`는 정적 내부 경로 `/login`을 사용하고 현재 탭에서 이동한다.
- Header, 인증 판정, 상태, 타이머와 이벤트 핸들러를 작성하지 않는다.

### `page.module.scss`

- `styles/abstracts/colors`, `styles/abstracts/typography` 등 필요한 기존 공통 SCSS만 불러온다.
- 페이지 영역은 가용 화면 높이 안에서 완료 콘텐츠를 중앙 정렬하되, 내용이 커지는 경우 잘리지 않도록 최소 높이와 여백을 함께 사용한다.
- 마스코트 래퍼의 배경에 `radial-gradient(circle, 중심색, 투명색)`를 사용하고 별도 배경 이미지를 추가하지 않는다.
- 이미지에는 유연한 너비와 `height: auto`, `object-fit: contain`을 적용해 자르기와 왜곡을 방지한다.
- 프비 이미지에만 `transform: translateY()` 기반 keyframes를 적용해 `0`에서 `-18px` 사이를 약 2.8초 동안 천천히 왕복하고 무한 반복한다.
- 원형 그라디언트는 이미지가 아닌 고정된 래퍼에 적용해 제목·안내·Link와 함께 움직이지 않도록 한다.
- `@media (prefers-reduced-motion: reduce)`에서는 프비 애니메이션을 제거하고 기본 위치를 유지한다.
- 데스크톱 기본 스타일을 작성하고 `1024px`, `480px` 미디어 쿼리에서 Figma의 제목·이미지·안내·링크 크기와 간격을 조절한다.
- 로그인 Link는 56px 높이, 노란 배경, 남색 글자와 충분히 둥근 외형을 유지하고 키보드 포커스가 식별되도록 한다.
- 승인된 프비 상하 이동 외의 애니메이션과 transition은 추가하지 않는다.

## 반응형 기준

| 기준 화면       | 주요 계획                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| 데스크톱 1320px | 제목 48px, 넓은 중앙 콘텐츠, 약 647px 로그인 이동 영역을 기준으로 배치한다.                                        |
| 태블릿 1024px   | 제목 36px, 중앙 정렬을 유지하고 Figma의 태블릿 간격과 약 715px 이동 영역을 화면 가용 너비 안에서 적용한다.         |
| 모바일 480px    | 좌우 20px 여백, 제목 24px, 안내 16px, 약 440px 이하의 전체 너비 이동 영역과 축소된 마스코트·그라디언트를 적용한다. |

기준 화면 사이 너비에서는 고정 폭만 사용하지 않고 `width`, `max-width`, 내부 여백을 조합해 가로 스크롤과 요소 겹침을 막는다.

## 단계별 구현 순서

1. `page.js`에 정적이고 의미 있는 완료 안내 구조와 `/login` Link를 작성한다.
2. `page.module.scss`에 데스크톱 중앙 배치, radial-gradient, 이미지 비율 보존과 로그인 Link 외형을 작성한다.
3. 프비 이미지에만 느린 상하 keyframes를 적용하고 모션 감소 환경에서 중지한다.
4. 1024px와 480px 미디어 쿼리로 제목·이미지·안내·이동 영역의 크기와 간격을 조정한다.
5. Header 중복 없음, 정적 이동, 세 화면의 넘침·왜곡·겹침 없음, 애니메이션 범위와 키보드 이동을 수동 검증한다.
6. `npm run lint`로 정적 검사를 수행한다.

## 복잡성 기록

헌법 위반이나 정당화가 필요한 예외가 없다.
