# 구현 계획: 요약 상세 영속 학습노트·북마크

**브랜치**: `feature/summary-detail` | **작성일**: 2026-08-12 | **명세**: [spec.md](./spec.md)

**입력**: 영속 데이터 기반 학습노트 생성·조회·수정·삭제, 사용자별 북마크 저장과 목록 진입 호환 요구사항(FR-053–FR-071)

## 요약

기존 mock read-only 연결을 팀 Supabase의 영속 데이터로 전환한다. `auth.users.id`를 소유권 기준으로 사용하고 기존 `profiles`에서는 공개 표시용 `id`, `nickname`만 안전한 읽기 인터페이스로 제공한다. `summaries`, `learning_notes`, `bookmarks`를 마이그레이션으로 추가하고 Server Component 조회, Server Action 변경, RLS와 컬럼 권한으로 공개 조회·작성자 전용 변경·사용자 본인의 북마크만 허용한다.

## 기술 배경

**언어/버전**: JavaScript, React 19.2.4

**주요 의존성**: Next.js 16.2.12 App Router, `@supabase/supabase-js` 2.112.3, `@supabase/ssr` 0.12.4, Supabase CLI 2.113.0

**저장소**: 팀 Supabase Postgres 17, 기존 `auth.users`·`public.profiles`, 신규 테이블 3개와 접근 가능한 노트 작성자 닉네임 조회 함수

**테스트**: 팀 Supabase에 리뷰된 마이그레이션 적용, 임시 요약본 1개와 두 인증 사용자 기반 RLS 검증, `npm run lint`, `npm run build`, 수동 경로 시나리오

**대상 플랫폼**: 데스크톱 웹 브라우저; 기존 반응형 스타일의 회귀만 방지하고 신규 모바일·태블릿 설계는 제외

**프로젝트 유형**: Next.js App Router 웹 애플리케이션

**성능 목표**: 준비된 검증 데이터에서 조회·쓰기 확정 결과를 3초 이내 표시하고, 다른 사용자의 학습노트 변경 성공 사례와 중복 북마크를 0건으로 유지

**제약 사항**: 기존 `profiles` 컬럼·데이터와 공통 Supabase 클라이언트·Proxy를 변경하지 않는다. 새 패키지, 로컬 Supabase, Docker와 `seed.sql`을 추가하지 않는다. 요약본 생성·수정, 잠금 인증, 퀴즈 저장은 구현하지 않으며 요약본 삭제만 사용자 승인으로 포함한다. 비공개 요약본은 잠금 기능 전까지 작성자 외 사용자에게 공개하지 않는다. 서비스 역할 키를 애플리케이션에 사용하지 않는다.

**작업 규모**: 신규 DB 테이블 3개와 RLS·GRANT·인덱스, 요약 상세 4개 경로의 mock 조회 교체, 학습노트 폼·소유자 동작·북마크 동작의 최소 Client Component 경계

## 헌법 점검

*관문: 조사 전과 설계 후 모두 통과했다.*

- [x] `AGENTS.md`, `docs/specs/Summary.md`, 기능 명세, 현재 코드와 기존 Supabase 안내를 확인했다.
- [x] Next.js App Router, JavaScript, SCSS Module과 기존 `@/*` 별칭을 유지한다.
- [x] 사용자가 승인한 Supabase DB 범위만 설계하고 새 패키지나 별도 데이터 요청 라이브러리를 추가하지 않는다.
- [x] 기존 `profiles`, `src/lib/supabase/*`, `proxy.js`의 공통 계약을 변경하지 않는다.
- [x] 신규 DB 스키마는 추적 가능한 `supabase/migrations`에 두고 애플리케이션에서 임의 생성하지 않는다.
- [x] Server Action과 RLS에서 인증·소유권을 중복 확인하며 브라우저 입력의 작성자 식별자를 신뢰하지 않는다.
- [x] 기존 `NoteItem`, `EmptyState`, `CommonModal`, `Loading`을 우선 재사용한다.
- [x] 요약본 쓰기, 잠금 인증, 퀴즈 저장과 관련 없는 페이지·컴포넌트 리팩터링을 제외한다.
- [x] 사용자의 승인에 따라 팀 Supabase를 직접 사용하고 로컬 DB·seed는 추가하지 않는다.
- [x] 기존 mock 데이터는 팀 DB로 이관하지 않고 임시 테스트 요약본 한 건만 검증 후 제거한다.
- [x] 학습노트 삭제 성공 후 현재 요약 상세로 이동한다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성한다.

**설계 후 재점검**: 신규 구조는 Supabase 표준 마이그레이션 폴더와 기존 라우트 내부 Server Action 파일, 필요한 최소 상호작용 컴포넌트로 제한한다. DB 권한을 RLS와 컬럼 GRANT로 강제한다. 기존 프로필 정책을 변경하지 않고 접근 가능한 노트 작성자만 반환하는 제한 함수만 추가한다. 신규 폴더·파일 생성은 구현 단계의 사전 승인 범위에 명시한다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/002-summary-detail/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── summary-detail-contract.md
└── tasks.md
```

### 계획된 구현 파일

```text
supabase/
└── migrations/
    └── <timestamp>_create_summary_detail_tables.sql  # 팀 DB 적용, 테스트 데이터 미포함

src/
├── lib/
│   ├── summary-detail.js              # 서버 전용 조회·정규화 함수
│   └── supabase/
│       ├── client.js                  # 기존, 변경 금지
│       ├── server.js                  # 기존, 변경 금지
│       └── proxy.js                   # 기존, 변경 금지
├── components/
│   └── (기존 공통 컴포넌트)
└── app/
    └── (site)/summary/
        ├── page.js                    # 목록 링크를 영속 요약본 UUID로 전환
        └── [summaryId]/
            ├── actions.js
            ├── layout.js
            ├── page.js
            ├── SummaryDeleteButton.jsx
            └── notes/
                ├── StudyNoteForm.jsx
                ├── StudyNoteForm.module.scss
                ├── new/page.js
                └── [noteId]/
                    ├── DeleteActionButton.jsx
                    ├── page.js
                    └── edit/page.js
```

**구조 결정**: 서버 전용 읽기·화면 정규화는 기존 `src/lib`의 단일 `summary-detail.js`, 변경 계약은 상세 기능 경로의 `actions.js`에 제한한다. 학습노트 생성·수정에서만 사용하는 폼은 `notes` 경로에, 요약본 삭제 버튼은 `[summaryId]` 경로에, 학습노트 삭제 버튼은 `[noteId]` 경로에 배치한다. 새 서비스 폴더, Route Handler, 외부 상태 관리 계층은 만들지 않는다.

## Phase 0: 조사 결과

세부 결정과 대안은 [research.md](./research.md)에 기록한다.

- 소유권 외래키는 `auth.users.id`를 참조해 프로필 자동 생성 여부와 분리한다.
- 작성자 표시는 현재 요청 주체가 접근 가능한 특정 요약본의 학습노트 작성자만 반환하는 security-definer 함수로 조회한다.
- `/summary` 전체 목록도 영속 요약본 UUID를 사용하도록 전환해 mock 문자열 링크가 새 상세에서 404가 되지 않게 한다.
- 기존 mock 데이터는 팀 DB에 넣지 않고 임시 테스트 요약본 한 건만 등록 후 제거한다.
- 공개 요약본은 방문자가 조회할 수 있고 비공개 요약본은 잠금 기능 전까지 작성자만 조회한다.
- 학습노트 조회는 접근 가능한 요약본에 속한 항목으로 제한하고, 변경에는 인증 사용자·작성자·상위 접근 조건을 함께 적용한다.
- 북마크는 `(user_id, summary_id)` 유일 관계의 존재로 상태를 표현한다.
- 최초 조회는 Server Component, 변경은 Server Action, 처리 상태와 오류 표시는 최소 Client Component가 담당한다.
- 생성·수정 성공 후 노트 상세, 삭제 성공 후 현재 요약 상세로 이동한다.

## Phase 1: 데이터 설계

### 스키마와 관계

- `summaries.author_id`, `learning_notes.author_id`, `bookmarks.user_id`는 `auth.users.id`를 참조한다.
- `learning_notes.summary_id`, `bookmarks.summary_id`는 `summaries.id`를 참조한다.
- 요약본 삭제는 소속 학습노트가 없는 경우만 허용한다. `learning_notes.summary_id`는 `ON DELETE RESTRICT`를 유지하고, 북마크의 `summary_id`는 `ON DELETE CASCADE`를 사용한다.
- UUID 식별자는 `gen_random_uuid()`, 시간 필드는 현재 시각을 기본값으로 사용한다.
- 제목과 본문은 DB에서 `btrim(value) = value`, 필수·길이 제약을 적용해 직접 요청도 정규화 규칙을 우회하지 못하게 한다.
- `ai_summary`는 object 형태 JSON만 허용하고 서버에서 화면에 필요한 내부 구조를 검증한다.
- 안정적인 최신순 조회를 위해 `learning_notes(summary_id, created_at desc, id desc)` 인덱스와 동일한 정렬을 사용한다.
- FK와 정책 조회를 위해 `summaries(author_id)`, `bookmarks(summary_id)` 인덱스를 둔다.
- 북마크 중복 방지를 위해 `(user_id, summary_id)` 유일 제약을 둔다.
- `updated_at` 갱신 함수는 고정 `search_path`를 사용하고 일반 역할에 직접 실행 권한을 주지 않는다.

세부 필드·상태 전이는 [data-model.md](./data-model.md)를 따른다.

### 접근 제어

- 모든 신규 공개 스키마 테이블에 RLS를 활성화한다.
- 기본 테이블·컬럼 권한을 명시적으로 회수한 뒤 필요한 SELECT·INSERT·UPDATE·DELETE 컬럼만 역할별로 부여한다.
- `summaries`: 공개 항목 또는 본인 작성 항목만 SELECT 가능하며 DELETE는 본인 작성 요약본에만 허용한다. 생성·수정 정책은 현재 증분에서 열지 않는다.
- `learning_notes`: 접근 가능한 요약본의 노트만 SELECT 가능하다. INSERT·UPDATE·DELETE는 작성자 조건과 현재 상위 요약본 접근 조건을 함께 적용한다.
- `learning_notes`의 INSERT·UPDATE 권한은 사용자가 입력할 수 있는 필드로 제한해 ID·관계·작성자·시각·퀴즈 상태를 조작하지 못하게 한다.
- `bookmarks`: 현재 사용자의 행만 SELECT·INSERT·DELETE 가능하다. SELECT·INSERT는 접근 가능한 요약본만 대상으로 하고 DELETE는 비공개 전환 후에도 본인 관계를 정리하도록 사용자 조건만 적용한다.
- 기존 `profiles` 테이블과 정책은 변경하지 않고 제한된 작성자 닉네임 함수를 추가한다. 고정 `search_path`와 소유자를 사용하고 `PUBLIC` 실행 권한을 회수한 뒤 필요한 역할에만 EXECUTE를 허용한다.
- Server Action은 `getClaims()`로 사용자 식별자를 확인하고 RLS를 최종 권한 경계로 사용한다.

### 조회와 변경 흐름

1. 공통 레이아웃은 서버 클라이언트로 요약본과 현재 사용자의 북마크 존재 여부를 조회한다.
2. 요약 상세는 소속 학습노트와 공개 닉네임을 최신순으로 조회한다.
3. 작성·수정·상세 페이지는 `summaryId`와 `noteId` 관계를 함께 확인하고 결과가 없으면 404 처리한다.
4. 생성·수정 Action은 입력을 정규화·검증하고 인증 사용자를 작성자로 강제한다.
5. 요약본 삭제 Action은 인증 사용자와 요약본 작성자가 일치하고 소속 학습노트가 없는 행만 삭제한다.
6. 학습노트 삭제 Action은 작성자와 상위 요약본 접근 조건이 일치하는 행만 삭제한다.
7. 북마크 저장은 유일 키 충돌 시 변경하지 않고 현재 사용자 관계를 다시 조회해 저장 상태 하나로 확정하며, 해제는 본인 관계만 삭제한다.
8. 변경 성공 후 경로를 재검증하고 생성·수정은 학습노트 상세, 학습노트 삭제는 `/summary/{summaryId}`, 요약본 삭제는 `/allnote`로 이동한다.
9. 실패 시 구조화된 오류 결과를 반환해 입력과 마지막 확정 UI 상태를 유지한다.

인터페이스별 입력·출력·오류는 [summary-detail-contract.md](./contracts/summary-detail-contract.md)를 따른다.

## 구현 순서

1. 팀 DB의 기존 테이블·정책·마이그레이션 충돌 여부를 읽기 전용으로 확인한다.
2. 신규 테이블 3개, 제한된 닉네임 함수, 제약, 인덱스, 컬럼 GRANT와 RLS 마이그레이션을 작성한다.
3. 대상 project ref와 `db push --dry-run` 결과, 적용 SQL, 백업·PITR 또는 복구 지점, 트랜잭션 가능 여부와 실패 복구 절차를 팀에서 리뷰한다.
4. 승인 후 팀 Supabase에 마이그레이션을 적용하고 기존 Auth 사용자를 소유자로 참조하는 임시 공개 요약본 한 건을 등록한다.
5. 서버 조회 함수를 작성하고 `/summary` 목록과 상세 경로의 mock 요약본 조회를 영속 UUID 조회로 교체한다.
6. 공통 레이아웃을 Server Component로 전환하고 북마크 상호작용만 Client Component로 분리한다.
7. 학습노트 작성·수정 공통 폼과 Server Action 입력 검증·로딩·오류·성공 이동을 연결한다.
8. 상세 화면의 작성자 전용 수정 링크와 삭제 확인·Server Action을 연결한다.
9. 유효·빈·404·목록 진입·비로그인·비작성자·중복 북마크·실패 복구 시나리오를 검증한다.
10. 임시 학습노트·북마크·요약본을 관계 역순으로 제거한다.
11. `npx supabase db lint --linked`, `npm run lint`, `npm run build`, `git diff --check`를 실행하고 범위를 검토한다.

## 복잡성 기록

| 결정 | 필요한 이유 | 더 단순한 대안을 사용하지 않은 이유 |
|---|---|---|
| 신규 `summaries` 테이블 포함 | 학습노트와 북마크가 참조할 영속 요약본이 현재 DB에 없다. | mock 식별자를 관계 키로 재사용하면 DB 무결성과 상위 접근 정책을 강제할 수 없다. |
| 제한된 작성자 닉네임 함수 | 접근 가능한 노트 작성자 이름만 표시하고 전체 회원 목록 공개를 막아야 한다. | 전체 프로필 또는 모든 `id`, `nickname` 공개는 승인되지 않은 회원 디렉터리를 만든다. |
| Server Action 추가 | 인증·입력 검증·재검증·이동을 서버 경계에 모은다. | 브라우저 직접 변경은 검증과 오류 계약이 여러 페이지에 중복된다. |
| 상위 요약본을 포함한 RLS | 비공개 전환 후 하위 콘텐츠 변경과 노출을 막는다. | 학습노트 작성자 조건만 적용하면 상위 접근 권한 상실을 반영하지 못한다. |
