# 구현 계획: 학습노트 전체 목록

**브랜치**: `feature/all-notes` | **작성일**: 2026-08-13 | **명세**: [`spec.md`](./spec.md)

**입력**: `/specs/003-all-notes/spec.md`의 기능 명세

## 요약

로그인 사용자의 `/mypage/summaries`와 모든 작성자의 공개 요약본 소속 노트를 보여주는 `/allnote`에 같은 학습노트 전체 목록 화면을 제공한다. 페이지 크기는 12개로 고정하고 `createdAt`과 `noteId`의 복합 커서로 최신순 추가 조회를 안정화한다. 두 라우트는 기능 전용 Client Component인 `AllNotes`를 공유하며, 기존 `NoteItem`, `Banner`, `EmptyState`, `CommonModal`, `AuthGuard`의 계약을 재사용한다.

이 기능은 새 Supabase 테이블·마이그레이션·RLS·비밀번호 저장 방식·공개 API를 중복해서 만들지 않는다. 기존 Supabase 브라우저 클라이언트와 `002-summary-detail`이 소유한 영속 데이터·인증·RLS 계약을 사용해 실제 목록 loader를 연결한다.

## 기술 배경

**언어/버전**: JavaScript, React 19.2.4

**주요 의존성**: Next.js 16.2.12 App Router, `@supabase/supabase-js` 2.112.3, `@supabase/ssr` 0.12.4, Sass 1.102.0, 기존 `next/image`·`next/link`

**저장소**: 기존 Supabase 인증·데이터 서비스와 `summaries`·`learning_notes` 화면 조회 계약. 이 기능에서 새 스키마, 중복 마이그레이션, seed, RLS 정책 또는 데이터 요청 라이브러리를 추가하지 않으며, 승인된 `002-summary-detail` DB 선행 조건을 확인한 뒤 실제 loader만 연결함

**테스트**: [quickstart.md](./quickstart.md)의 데스크톱 수동 인수 시나리오, `npm run lint`, `npm run build`, `git diff --check`. 별도 테스트 패키지는 추가하지 않음

**대상 플랫폼**: 1440px 데스크톱 웹 브라우저. 태블릿·모바일 반응형은 범위에서 제외

**프로젝트 유형**: Next.js App Router 웹 애플리케이션

**성능 목표**: 목록 진입 후 3초 이내에 전체 개수와 첫 12개 또는 빈 목록을 표시한다. 동일 커서의 동시 요청과 이미 표시한 행의 중복을 0건으로 유지한다.

**제약 사항**:

- 기존 공통 컴포넌트의 props·책임과 `src/lib/supabase/*`·Proxy를 변경하지 않는다.
- 페이지 크기 12, 최신 작성순, 작성일 `YYYY.MM.DD`, 퍼센트 미표시를 고정한다.
- 비로그인 내 목록은 `AuthGuard`로 처리하고, `/allnote`에서는 잠긴 요약본 소속 노트를 조회 대상에서 제외한다.
- 일반 조회 실패는 호출 경로에 맞는 공통 오류 모달 후속 이동을 유지한다.
- 검색, 북마크, 학습노트 CRUD, 퀴즈, 새 API, 새 패키지와 프로젝트 구조에 없는 새 폴더를 추가하지 않는다. `AGENTS.md`와 명세에 정의된 정식 `mypage/summaries` 라우트 폴더는 예외가 아니다.
- 현재 소스의 `/mypage/mysummaries`와 명세의 `/mypage/summaries` 경로 충돌은 삭제·이름 변경 없이 기록하고 구현 전에 영향 범위를 확인한다.

**작업 규모**: 정식 내 목록 라우트 1개, 전체 노트 라우트 `/allnote` 1개, 두 화면이 공유하는 `AllNotes` Client Component와 SCSS Module을 구현하고 기존 Supabase loader·RLS 계약에 연결한다. 기존 공통 컴포넌트와 인증·Supabase 기반 파일은 재사용한다.

## 헌법 점검

*관문: 0단계 조사 전에 통과했으며 1단계 설계 후 다시 확인했다.*

- [x] `AGENTS.md`, Constitution, 관련 `docs/specs`, `003-all-notes` 명세, 기존 코드와 관련 설계 산출물을 확인했다.
- [x] Next.js App Router, JavaScript, SCSS, `@/*` 별칭과 기존 평면 `src/components` 구조를 유지한다.
- [x] 승인되지 않은 의존성, 폴더, 데이터 통신 구조, Supabase 스키마와 인증 저장 방식을 추가하지 않는다.
- [x] `NoteItem`, `Banner`, `EmptyState`, `CommonModal`, `AuthGuard`, 사이트 `Header`를 우선 재사용하고 변경 영향 범위를 확인했다.
- [x] 하나의 학습노트 전체 목록 기능만 다루며, 북마크·퀴즈·CRUD·검색을 포함하지 않는다.
- [x] `/mypage/mysummaries`와 `/mypage/summaries`의 기존 충돌을 사용자에게 보고하고 기존 파일 삭제·이름 변경을 계획하지 않았다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성했다.

**설계 후 재점검**: 통과. 추가한 설계는 승인된 기존 Supabase 조회·인증·RLS 계약을 연결하는 두 라우트와 하나의 기능 전용 Client Component로 제한된다. 복합 커서는 목록 안정성을 위한 데이터 계약이며 새 외부 의존성이나 스키마 변경이 아니다. 구현은 `feature/all-notes` 기능 브랜치에서 진행한다.

## Phase 0: 조사 결과

세부 결정과 대안은 [research.md](./research.md)에 기록했다.

- Next.js의 Server/Client Component 경계에 따라 라우트와 브라우저 상호작용을 분리한다.
- 두 목록은 12개 단위와 `createdAt + noteId` 복합 커서로 같은 정렬 기준을 유지한다.
- 기존 Supabase 인증·데이터 서비스와 `002-summary-detail`의 조회 모델을 재사용하며 새 API·DB 구조는 만들지 않는다.
- 내 목록은 `AuthGuard`, 전체 목록의 공개 요약본 필터는 기존 데이터 서비스, 오류는 `CommonModal`로 연결한다.
- 기존 공통 컴포넌트 props를 바꾸지 않고 데이터 어댑터에서 표시 모델을 정규화한다.
- 정식 내 목록 URL은 명세의 `/mypage/summaries`를 사용하되 기존 `/mypage/mysummaries`는 건드리지 않는다.

## Phase 1: 설계 및 계약

데이터 모델은 [data-model.md](./data-model.md), 조회·UI·오류 경계는 [contracts/all-notes-contract.md](./contracts/all-notes-contract.md), 실행 검증은 [quickstart.md](./quickstart.md)에 정의했다.

### 모델 경계

- `StudyNoteListItem`은 `noteId`, `summaryId`, `authorNickname`, `title`, `createdAt`, `createdAtDisplay`, `quizStatus`만 화면에 필요한 형태로 갖는다.
- `StudyNoteListPage`는 `totalCount`, 최대 12개의 `items`, `nextCursor`, `hasMore`를 반환한다.
- 목록 범위는 `mine` 또는 `all`이며 사용자 식별자는 `mine` 범위에서 서비스가 현재 인증 세션으로 결정한다.
- 공개 여부 필터와 목록 Client 상태를 조회 데이터와 분리하여 잠긴 요약본 소속 항목이 렌더링되지 않게 한다.

### 인터페이스 경계

- 논리 조회 함수 `loadStudyNotePage(scope, cursor)`는 기존 데이터 서비스가 제공하는 페이지 모델을 소비한다.
- `AllNotes`는 목록 페이지 데이터, 배너, 범위와 다음 페이지 로더를 입력으로 받아 기존 공통 컴포넌트를 조합한다.
- 외부 공개 HTTP API, Route Handler와 새 Supabase 데이터 계층은 추가하지 않는다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/003-all-notes/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── all-notes-contract.md
└── tasks.md             # 다음 /speckit-tasks에서 생성
```

### 계획된 소스 코드

```text
src/
├── app/
│   └── (site)/
│       ├── mypage/
│       │   └── summaries/
│       │       └── page.js                 # 명세의 정식 내 목록 진입점 추가
│       ├── allnote/
│       │   └── page.js                     # 모든 작성자의 공개 노트 진입점 추가
│       └── summary/
│           └── [summaryId]/
│               └── notes/                  # 생성·상세·수정 하위 경로 유지
├── components/
│   ├── AllNotes.jsx                         # 여러 목록 페이지에서 공유하는 Client Component
│   └── AllNotes.module.scss
└── lib/
    └── supabase/                           # 기존 client/server/proxy 재사용, 변경하지 않음
```

기존 `src/app/(site)/mypage/mysummaries/page.js`, 기존 요약 상세 페이지·레이아웃, `NoteItem`, `Banner`, `EmptyState`, `CommonModal`, `AuthGuard`는 이 계획에서 삭제·이름 변경하지 않는다. 데이터 조회 구현은 기존 서비스 영역 또는 `002-summary-detail`에서 승인된 조회 계약을 소비하며, 이 기능은 그 계약을 대체할 별도 모듈을 만들지 않는다.

**구조 결정**: `AllNotes`는 `/allnote`와 팀에서 추가로 사용하는 목록 페이지의 공통 기능 컴포넌트이므로 `src/components`에 둔다. 페이지 파일은 범위와 라우트 문맥만 연결하고, 목록 상태와 브라우저 API는 `AllNotes`가 공유한다.

## 준비 단계 점검 결과

- T001: `AGENTS.md`, Constitution, 기능 명세, 구현 계획과 목록 계약을 확인했다. 목록은 실제 Supabase 연결을 사용한다.
- T002: 현재 `src/app/(site)/mypage/mysummaries/page.js`와 `/mypage/page.js`의 기존 경로는 유지한다. 전체 노트 목록은 `src/app/(site)/allnote/page.js`를 정식 진입점으로 추가하고, `src/app/(site)/summary/[summaryId]/notes/page.js` 목록 파일은 만들지 않으며 `new`와 `[noteId]` 하위 경로만 유지한다.
- T003: `AuthGuard`는 인증 확인 전 `Loading`, 비로그인 시 `CommonModal mode="requireLogin"`, 인증 후 children 렌더링을 담당한다. `NoteItem`은 상세 링크와 상태·작성자·제목·작성일 props를, `Banner`는 이미지·내부/외부 목적지 props를, `EmptyState`는 message를, `CommonModal`은 오류·자동 이동·닫기 동작을 담당하므로 공개 props를 변경하지 않는다. `package.json`의 실행 검증 명령은 `npm run lint`와 `npm run build`이며 별도 테스트 스크립트는 없다.

## 기술 설계

### 라우트 구성

1. `/mypage/summaries/page.js`는 `AuthGuard` 안에서 `AllNotes scope="mine"`을 렌더링한다. 인증 확인 전에는 목록 데이터를 요청하거나 자식 내용을 공개하지 않는다.
2. `/allnote/page.js`는 `AllNotes scope="all"`을 사용해 공개 요약본 소속의 모든 작성자 노트를 표시한다. 잠긴 요약본 소속 노트는 목록 조회에서 제외한다.
3. 사이트 `layout.js`가 제공하는 Header는 수정하지 않는다. 두 경로는 로그인·회원가입 예외가 아니므로 Header 기본 펼친 상태를 사용한다.
4. 행 선택은 기존 `NoteItem`의 `/summary/[summaryId]/notes/[noteId]` 링크를 사용한다. 상세 화면 자체의 조회·수정·삭제 동작은 이 기능에서 변경하지 않는다.

### `AllNotes` 상태 및 추가 로딩

- 초기 상태는 `initialLoading`, `readyWithItems`, `readyEmpty`, `error`로 구분한다.
- 첫 응답의 `totalCount`를 목록 상단에 표시하고, 항목이 0개인 정상 완료에서만 지정된 `EmptyState` 문구를 렌더링한다.
- `hasMore=true`, 현재 요청 없음, 현재 cursor 미처리일 때만 `IntersectionObserver` sentinel을 통해 다음 페이지를 요청한다.
- `loadingMore` 동안 기존 행과 총 개수를 유지한다. 동일 cursor의 재진입은 무시한다.
- 응답 병합 전에 `${summaryId}:${noteId}` 유일 키를 확인해 이미 표시된 항목을 제거한다.
- 마지막 응답이 12개 미만이거나 `nextCursor=null`이면 `hasMore=false`로 두고 observer를 해제한다.
- 추가 로딩 실패는 기존 목록을 유지한 채 `CommonModal mode="error"`로 알리고, 모달 종료 후 현재 scope의 fallback 경로로 이동한다.

### 표시와 접근성

- 상단에는 기존 `Banner`와 `총 {count}개의 학습노트`를 표시한다. 배너에는 별도 CTA·텍스트 버튼을 추가하지 않는다.
- 행은 기존 `NoteItem`의 상태 이미지, 작성자, 제목, 작성일을 사용한다. 작성일은 조회 결과에서 `YYYY.MM.DD`로 정규화하고 퍼센트 값을 전달하지 않는다.
- 긴 작성자명·제목은 `AllNotes.module.scss`의 열별 overflow 규칙으로 경계를 유지한다.
- 기존 `EmptyState`의 접근성 의미와 `CommonModal`의 접근성 계약을 유지한다. 새 focus trap·Escape 동작·모달 구조를 추가하지 않는다.
- 데스크톱 Figma 기준의 배치·크기·색상은 기존 SCSS 토큰과 제공된 프레임을 따른다. 모바일·태블릿 별도 레이아웃은 만들지 않는다.

### 인증·오류 흐름

- `AuthGuard`의 `requireLogin`이 비로그인 내 목록을 가리고 3초 후 `/login`으로 이동하도록 기존 동작을 사용한다.
- `/allnote`는 공개 요약본 소속 노트만 조회하고 잠긴 요약본의 접근 인증은 수행하지 않는다.
- 일반 조회 오류는 `CommonModal mode="error"`로 변환한다. 내 목록은 모달 종료 후 `/mypage`, 전체 목록은 `/`로 이동한다.
- 전체 목록 행의 상세 이동과 없는 `summaryId` 처리는 기존 학습노트 상세 계약을 이용한다.

## 구현 순서

1. 구현 시작 전 `feature/all-notes` 브랜치와 현재 `feature/summary-detail`의 작업 범위를 확인하고, `/mypage/mysummaries`를 유지한 채 `/mypage/summaries`를 추가할지 팀에 공유한다.
2. 기존 Supabase 조회 결과의 목록 범위, 표시 필드, 접근·오류 상태를 계약과 대조한다. `002-summary-detail`의 DB·RLS 선행 조건을 확인하고 기존 조회 모델·잠금 인증·Supabase 공통 클라이언트의 서비스 계약을 사용하며 새 스키마·API는 만들지 않는다.
3. `src/components/AllNotes.jsx`에 scope·초기/추가 로딩·복합 cursor·중복 키·observer cleanup 상태를 구성한다.
4. `Banner`, 목록 상단 개수, `NoteItem`, `EmptyState`, `CommonModal`을 기존 props와 책임으로 연결하고 데스크톱 SCSS Module을 작성한다.
5. 두 `page.js`에 각각 `mine`과 `all` scope를 연결하고, 오류 후속 이동과 Header 레이아웃을 확인한다. 기존 `/mypage/mysummaries` 파일은 삭제·이름 변경하지 않는다.
6. [quickstart.md](./quickstart.md)의 실제 Supabase 공개·보호·빈·오류·무한 스크롤·배너 시나리오를 검증한다.
7. `002-summary-detail`의 schema·RLS 적용 상태를 확인하고, 기존 조회 계약과 `AllNotes`의 실제 loader 연결 상태를 검증한다.
8. 실제 데이터·잠금 세션·RLS 시나리오를 검증한 뒤 `npm run lint`, `npm run build`, `git diff --check`를 실행하고 변경 파일이 승인된 범위에 머무는지 검토한다.

## 복잡성 기록

헌법 또는 `AGENTS.md`를 위반하는 예외는 없다. `AllNotes` 공유는 동일 기능의 두 라우트에서 중복 로딩 방지와 상태 계약을 일관되게 유지하기 위한 최소 범위이며, 일반화된 목록 라이브러리나 새 상태 관리 계층을 도입하지 않는다.
