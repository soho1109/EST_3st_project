# 구현 계획: 공통 빈 상태 안내

**브랜치**: `feature/empty-state` | **작성일**: 2026-08-10 | **명세**: [spec.md](./spec.md)

**입력**: `/specs/008-empty-state/spec.md`의 기능 명세

## 요약

기존 요약 상세에 직접 작성된 빈 상태 이미지와 문구를 `EmptyState` 공통 컴포넌트로 옮긴다. 컴포넌트는 필수 `message`만 받아 동일한 이미지·배치·접근성 상태를 표시하고, 목록 보유 여부와 로딩·오류 판정은 각 호출 영역이 소유한다. 전체·나의·북마크 요약본 목록, 요약 상세의 학습노트 목록, 마이페이지 북마크 섹션은 정상 조회 결과가 비었을 때 각 명세에 지정된 문구로 공통 컴포넌트를 사용한다.

## 기술 배경

**언어/버전**: JavaScript, React 19.2.4

**주요 의존성**: Next.js 16.2.12 App Router, Sass 1.102.x, `next/image`

**저장소**: 기존 정적 목 데이터와 호출 영역의 목록 상태만 사용하며 영속 저장소는 추가하지 않음

**테스트**: 적용 페이지 수동 검증, ESLint, Next.js production build, 변경 형식 검사

**대상 플랫폼**: 웹 브라우저

**프로젝트 유형**: Next.js 웹 애플리케이션

**성능 목표**: 목록 상태가 정상 완료로 확정된 뒤 1초 이내에 목록 또는 EmptyState 중 하나만 표시

**제약 사항**: 새 패키지, 데이터 요청, 인증, 검색, 북마크 변경, 생성 유도 동작을 추가하지 않는다. EmptyState에는 버튼·링크·자동 이동·내부 표시 상태를 두지 않는다. 기존 실제 경로의 대소문자와 파일명은 이번 기능에서 변경하지 않는다.

**작업 규모**: 공통 컴포넌트와 대응 SCSS Module 각 1개 생성, 기존 호출 컴포넌트·페이지 3개와 요약 상세 SCSS Module 1개 수정

## 헌법 점검

_관문: 0단계 조사 전과 1단계 설계 후 모두 통과했다._

- [x] `AGENTS.md`, Constitution, `docs/specs/AllSummary.md`, `docs/specs/Summary.md`, `docs/specs/Mypage.md`, 관련 Spec Kit 명세와 기존 코드를 확인했다.
- [x] Next.js App Router, JavaScript, SCSS Module, `@/*` 별칭과 평면 공통 컴포넌트 구조를 유지한다.
- [x] 승인되지 않은 의존성, 폴더, 데이터 통신, 인증 또는 상태 관리 구조를 추가하지 않는다.
- [x] 기존 공통 EmptyState가 없고 요약 상세에만 중복 가능한 빈 상태 마크업과 스타일이 있음을 확인했다.
- [x] 공통 EmptyState 표시와 명세에 지정된 다섯 적용 대상만 다룬다.
- [x] 현재 Git에 등록된 `src/components/Allsummary.jsx` 이름은 규칙과 차이가 있지만 이번 기능에서 이름을 변경하거나 관련 import를 확장 수정하지 않는다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성한다.

**설계 후 재점검**: 조사, UI 상태 모델, UI 계약과 검증 절차는 위 관문을 유지하며 복잡성 예외가 필요하지 않다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/008-empty-state/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── EmptyState.md
└── tasks.md              # 다음 /speckit-tasks 단계에서 생성
```

### 소스 코드

```text
src/
├── app/
│   └── (site)/
│       ├── Mypage/
│       │   └── page.js
│       └── Summary/
│           └── [summaryId]/
│               ├── page.js
│               └── page.module.scss
└── components/
    ├── Allsummary.jsx
    ├── EmptyState.jsx
    └── EmptyState.module.scss

public/
└── images/
    └── clear.webp
```

**구조 결정**: `EmptyState.jsx`와 대응 SCSS Module은 `AGENTS.md`에 정의된 `src/components`의 평면 구조에 생성한다. 기존 `/images/clear.webp`를 재사용하며 새 자산과 새 앱 경로를 만들지 않는다. 목록 페이지는 이미 공통 진입점인 `Allsummary.jsx`에서 한 번 연결하고, 요약 상세와 마이페이지 북마크는 각 실제 페이지에서 연결한다.

## 구현 설계

### 공통 컴포넌트 책임

- `EmptyState`는 필수 문자열 `message`를 받아 기존 빈 상태 이미지와 안내 문구를 렌더링한다.
- 컴포넌트는 항목 배열, 로딩, 오류, 페이지 종류 또는 사용자 정보를 받지 않는다.
- 내부 상태, 이벤트 또는 브라우저 API가 없으므로 Client Component로 만들지 않는다.
- 버튼, 링크, 닫기, 재시도, 생성 유도 및 자동 이동을 제공하지 않는다.
- 공통 SCSS Module은 기존 요약 상세의 이미지 크롭, 중앙 정렬, 간격과 문구 타이포그래피를 소유한다. Grid 목록에서는 전체 열을 차지하고 일반 흐름에서는 부모 너비를 채우도록 한다.

### 표시 상태와 호출 영역 책임

- 호출 영역은 `loading`, `error`, `ready-with-items`, `ready-empty`를 구분하고 `ready-empty`에서만 `EmptyState`를 렌더링한다.
- 항목이 하나 이상 있으면 기존 카드 또는 학습노트 목록을 유지하며 EmptyState를 함께 표시하지 않는다.
- 로딩과 오류 표시는 각 기능의 기존 정책을 유지하며 EmptyState가 이를 대신하지 않는다.
- 전체 요약본과 나의 요약본은 `요약 노트가 아직 생성되지 않았습니다.`, 북마크 목록과 마이페이지 북마크는 `북마크한 요약 노트가 없습니다.`, 요약 상세 학습노트는 `현재 리스트가 없습니다.`를 전달한다.
- 현재 마이페이지의 요약 및 북마크가 하나의 정적 placeholder 배열을 공유하므로 두 컬렉션을 분리한다. 실제 서비스 연결은 추가하지 않고, 북마크의 빈 정적 상태에는 이후 데이터 연결 범위를 설명하는 임시 주석을 둔다.

### 접근성과 이미지

- 빈 상태 루트는 상태 의미와 정중한 live 안내를 제공해 검색 또는 목록 갱신 후 나타난 문구를 보조 기술이 인식할 수 있게 한다.
- 접근성 속성에는 상태 전달 목적과 사용자 영향을 설명하는 주석을 둔다.
- `/images/clear.webp`는 문구와 별개의 정보를 전달하지 않는 장식 이미지로 처리해 중복 낭독을 막는다.
- 안내 문구는 호출자가 전달한 문자열을 한 번만 표시하며 별도 숨김 문구를 중복 생성하지 않는다.

### 기존 코드 정리 범위

- `src/app/(site)/Summary/[summaryId]/page.js`의 직접 작성된 이미지·문구 마크업을 `EmptyState` 호출로 교체하고 더 이상 필요한 없는 `next/image` import를 제거한다.
- `src/app/(site)/Summary/[summaryId]/page.module.scss`의 `.empty-state`, `.empty-image` 규칙을 공통 SCSS Module로 이동한다. 버튼, 제목과 레이아웃 스타일은 유지한다.
- `src/components/Allsummary.jsx`는 기존 `summaryCards` 결과가 비었을 때 `view`에 따라 문구를 선택한다. 기존 필터·정렬·카드 props는 변경하지 않는다.
- `src/app/(site)/Mypage/page.js`는 북마크 섹션의 항목 유무만 분기한다. 프로필, 학습노트와 내 요약 노트 동작은 이번 범위에서 변경하지 않는다.
- `Allsummary.jsx`의 현재 파일명과 이를 사용하는 페이지 import는 기존 경로 충돌을 피하기 위해 유지한다.

## 구현 순서

1. `EmptyState.jsx`에 최소 `message` 입력, 장식 이미지, 안내 문구와 상태 접근성 의미를 구성한다.
2. `EmptyState.module.scss`로 기존 요약 상세의 빈 상태 스타일을 이동하고 Grid·일반 부모 양쪽의 전체 너비 배치를 정의한다.
3. 요약 상세 페이지의 직접 작성 마크업을 공통 컴포넌트로 교체하고 이동된 지역 스타일만 제거한다.
4. `Allsummary.jsx`에 항목 0개 분기와 `view`별 정확한 문구 매핑을 연결한다.
5. 마이페이지의 북마크 정적 컬렉션을 내 요약 노트 컬렉션과 분리하고, 빈 경우 공통 컴포넌트를 표시한다.
6. UI 계약과 quickstart에 따라 문구, 상호 배제 상태, 이미지, Grid 폭, 접근성을 수동 확인한다.
7. `npm run lint`, `npm run build`, `git diff --check`를 실행한다.

## 복잡성 기록

헌법 또는 `AGENTS.md`를 위반하는 예외가 없다. 기존 `Allsummary.jsx`의 파일명 규칙 차이는 이번 기능이 만든 위반이 아니며 경로 변경의 영향이 커서 현 상태를 유지한다.
