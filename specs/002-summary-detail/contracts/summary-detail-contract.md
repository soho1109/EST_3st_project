# 인터페이스 계약: 요약 상세 영속 학습노트·북마크

## 목적과 범위

이 계약은 요약 상세 경로가 Supabase 영속 데이터를 조회하고 요약본 삭제, 학습노트 CRUD와 북마크 저장을 수행하는 내부 인터페이스를 정의한다. 외부 공개 HTTP API나 Route Handler는 추가하지 않는다.

## 공통 원칙

- 조회는 서버 전용 모듈과 공통 서버 Supabase 클라이언트를 사용한다.
- 변경은 `src/app/(site)/summary/[summaryId]/actions.js`의 Server Action을 사용한다.
- 모든 변경은 검증된 현재 사용자와 RLS를 함께 사용해 권한을 확인한다.
- Client Component가 전달한 `authorId`나 `userId`는 받거나 신뢰하지 않는다.
- 화면에서 사용하는 필드만 명시적으로 조회하고 `select("*")`를 사용하지 않는다.
- 작성자 닉네임은 현재 요약본으로 범위가 제한된 `get_learning_note_author_names(summaryId)` 함수에서 별도 조회해 서버에서 학습노트와 병합한다.
- 데이터베이스 오류 원문, 정책명, 내부 스키마 정보는 사용자에게 그대로 노출하지 않는다.

## 서버 조회 계약

**위치**: `src/lib/summary-detail.js`

이 모듈은 서버에서만 사용하며 DB 행을 [화면 조회 모델](../data-model.md#화면-조회-모델)로 정규화한다.

### `getSummary(summaryId)`

**입력**: UUID 형식의 `summaryId`

**결과**:

- 현재 요청 주체가 조회할 수 있는 요약본이면 `SummaryView`
- 존재하지 않거나 RLS로 조회할 수 없으면 `null`
- 데이터 요청 실패면 정규화된 조회 오류

호출 페이지는 `null`을 placeholder로 대체하지 않고 `notFound()`로 처리한다.

### `getSummaryNotes(summaryId)`

**입력**: 조회 가능한 요약본의 `summaryId`

**결과**:

- 해당 요약본에 속한 `StudyNoteView[]`
- `created_at` 내림차순
- 항목이 없으면 빈 배열
- 작성자 프로필 닉네임이 null이면 `알 수 없는 사용자`
- 데이터 요청 실패면 정규화된 조회 오류

### `getStudyNote(summaryId, noteId)`

**입력**: 상위 `summaryId`, 대상 `noteId`

**결과**:

- 두 식별자가 모두 일치하고 조회 가능한 경우 `StudyNoteView`
- 학습노트가 없거나 다른 요약본에 속하거나 RLS로 조회할 수 없으면 `null`
- 데이터 요청 실패면 정규화된 조회 오류

### `getCurrentBookmarkState(summaryId)`

**입력**: 조회 가능한 요약본의 `summaryId`

**결과**:

- 비로그인: `{ isAuthenticated: false, isBookmarked: false }`
- 로그인: 현재 사용자와 요약본의 관계 존재 여부를 포함한 `BookmarkState`
- 데이터 요청 실패면 정규화된 조회 오류

## 변경 결과 계약

폼 변경 Action이 오류로 반환할 수 있는 공통 형태다. 성공 후 이동하는 Action은 정상 성공 값을 반환하지 않고 경로를 재검증한 뒤 redirect한다.

```text
StudyNoteActionState
  status: "idle" | "error"
  fieldErrors:
    title?: string
    learnedSummary?: string
    reflection?: string
    references?: string
  formError?: string
  errorCode?: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "REQUEST_FAILED"
```

- 필드 오류는 해당 입력 옆에 표시한다.
- 인증 없음은 `/login` 이동 또는 명세의 로그인 안내 흐름으로 연결한다.
- 권한 없음·대상 없음·요청 실패는 공통 오류 영역에 표시하고 입력을 보존한다.
- DB 오류 원문은 로깅 경계에서만 사용하고 Action 결과에는 포함하지 않는다.

## Server Action 계약

### `createStudyNote(summaryId, previousState, formData)`

**사전 조건**:

- `summaryId`가 UUID 형식이며 조회 가능한 요약본이어야 한다.
- 현재 사용자 claims가 존재해야 한다.

**입력 필드**:

| FormData 이름 | 필드 | 규칙 |
|---|---|---|
| `title` | 제목 | 공백 제거 후 필수, 최대 50자 |
| `learnedSummary` | 오늘 배운 내용 요약 | 선택, 공백 제거 후 최대 1,000자 |
| `reflection` | 오늘의 회고 | 선택, 공백 제거 후 최대 1,000자 |
| `references` | 참고자료 | 선택, 공백 제거 후 최대 1,000자 |

**성공**:

1. `summary_id`는 인자로 받은 현재 요약본, `author_id`는 검증된 사용자로 강제한다.
2. 생성된 행의 `id`를 확인한다.
3. `/summary/{summaryId}`를 재검증한다.
4. `/summary/{summaryId}/notes/{createdNoteId}`로 이동한다.

**실패**: `StudyNoteActionState` 오류를 반환하고 입력을 보존한다.

### `updateStudyNote(summaryId, noteId, previousState, formData)`

**사전 조건**:

- 두 식별자는 UUID 형식이어야 한다.
- 현재 사용자가 대상 학습노트 작성자여야 한다.
- 대상 학습노트가 현재 요약본에 속해야 한다.

**입력 필드**: 생성 계약과 동일하다.

**성공**:

1. 제목과 세 본문 필드만 변경한다.
2. 변경 결과 행이 정확히 한 건인지 확인한다.
3. 요약 상세와 대상 학습노트 상세 경로를 재검증한다.
4. `/summary/{summaryId}/notes/{noteId}`로 이동한다.

**실패**: `StudyNoteActionState` 오류를 반환하고 기존 입력을 보존한다. 대상이 사라졌거나 권한이 변경된 경우 최신 상태를 다시 확인할 수 있게 한다.

### `deleteStudyNote(summaryId, noteId)`

**사전 조건**:

- 두 식별자는 UUID 형식이어야 한다.
- 현재 사용자가 대상 학습노트 작성자여야 한다.
- UI는 Action 호출 전에 공통 삭제 확인 모달을 표시해야 한다.

**성공**:

1. `id`, `summary_id`, 인증 사용자 `author_id`가 모두 일치하는 행 한 건을 삭제한다.
2. 요약 상세와 삭제된 상세 경로를 재검증한다.
3. `/summary/{summaryId}`로 이동한다.

**실패**: 구조화된 오류 결과를 반환하고 현재 화면을 유지한다. 행이 0건이면 성공으로 가장하지 않고 `NOT_FOUND` 또는 `FORBIDDEN`으로 정규화한다.

### `deleteSummary(summaryId)`

**사전 조건**:

- `summaryId`가 UUID 형식이어야 한다.
- 현재 사용자가 대상 요약본의 작성자여야 한다.
- 대상 요약본에 소속 학습노트가 없어야 한다.
- UI는 Action 호출 전에 공통 삭제 확인 모달을 표시해야 한다.

**성공**:

1. `id`와 인증 사용자 `author_id`가 모두 일치하고 소속 학습노트가 없는 요약본 한 건을 삭제한다.
2. `/summary`, `/allnote`, 마이페이지 요약·북마크 목록과 삭제된 상세 경로를 재검증한다.
3. `/allnote`로 이동한다.

**실패**: 구조화된 오류 결과를 반환하고 현재 화면을 유지한다. 행이 0건이면 성공으로 가장하지 않고 `FORBIDDEN`으로 정규화하며, 학습노트가 있으면 `CONFLICT`로 정규화한다.

### `setBookmarkState(summaryId, shouldBookmark)`

토글 시점의 반대 값을 암묵적으로 계산하지 않고 Client Component가 원하는 목표 상태를 명시한다. 서버는 현재 DB 상태와 인증 사용자를 기준으로 멱등하게 확정한다.

**입력**:

- `summaryId`: UUID 형식의 조회 가능한 요약본
- `shouldBookmark`: Boolean 목표 상태

**성공 결과**:

```text
BookmarkActionResult
  status: "success"
  isBookmarked: boolean
```

- `shouldBookmark=true`: 유일 키 충돌 시 아무것도 변경하지 않고 현재 사용자 관계를 다시 조회해 한 건의 저장 상태로 확정한다.
- `shouldBookmark=false`: 현재 사용자와 요약본의 관계를 삭제하고 없으면 미저장 상태로 확정한다.
- 성공 후 `/summary/{summaryId}`를 재검증한다. `/mypage/bookmarks`의 영속 조회 전환은 별도 목록 기능 범위다.

**실패 결과**:

```text
BookmarkActionResult
  status: "error"
  isBookmarked: boolean  # 마지막으로 확인된 서버 상태
  errorCode: "UNAUTHENTICATED" | "NOT_FOUND" | "CONFLICT" | "REQUEST_FAILED"
  message: string
```

실패 시 버튼은 임시 목표 상태를 유지하지 않고 반환된 마지막 확정 상태로 복구한다.

## 라우트 소비 계약

| 경로 | 조회와 동작 |
|---|---|
| `/summary/[summaryId]` 공통 레이아웃 | 요약본과 현재 사용자 북마크 조회, 없거나 접근 불가면 404 |
| `/summary/[summaryId]` | 학습노트 최신순 목록, 빈 배열이면 `EmptyState`, 로그인 사용자에게 작성 이동 제공 |
| `/summary/[summaryId]/notes/new` | 요약본·인증 확인, 비로그인이면 `/login` 이동, 공통 폼으로 생성 Action 호출 |
| `/summary/[summaryId]/notes/[noteId]` | 상위 관계가 맞는 학습노트 조회, 작성자에게 수정·삭제 동작 제공 |
| `/summary/[summaryId]/notes/[noteId]/edit` | 상위 관계와 작성자 확인, 비작성자면 현재 `/summary/[summaryId]` 이동, 기존 값으로 공통 폼을 채우고 수정 Action 호출 |

## UI 상태 계약

### `SummaryBookmarkButton`

- 초기 확정 상태와 인증 여부를 props로 받는다.
- 비로그인 사용자가 선택하면 저장 요청을 보내지 않고 로그인 안내 흐름을 제공한다.
- 요청 중 버튼을 비활성화하고 중복 요청을 막는다.
- 성공하면 서버 확정 상태를 표시한다.
- 실패하면 마지막 확정 상태로 복구하고 공통 오류 영역을 표시한다.
- 현재 상태는 `aria-pressed`, 동작 목적은 `aria-label`로 전달한다.

### `StudyNoteForm`

- `mode="create" | "edit"`, 초기값과 바인딩된 Action을 받는다.
- 제출 시 제목과 세 본문을 FormData로 전달한다.
- 요청 중 기존 `Loading`을 표시하고 제출 버튼을 비활성화한다.
- 필드 오류는 연결된 설명 요소로 표시하고 포커스 이탈·제출 검증 결과를 일치시킨다.
- 실패 시 사용자가 입력한 값을 보존한다.

## 오류 정규화

| 조건 | 사용자 결과 |
|---|---|
| 요약본 또는 학습노트 조회 결과 없음 | `notFound()` |
| 비로그인 작성 페이지 접근 | `/login` 이동 |
| 비로그인 Action 직접 호출 | 데이터 무변경, `UNAUTHENTICATED` |
| 비작성자 수정 페이지 접근 | 현재 `/summary/[summaryId]` 이동 |
| 비작성자 Action 직접 호출 | 데이터 무변경, `FORBIDDEN` |
| 유일 제약과 동일 목표 북마크 존재 | 저장 상태 한 건으로 확정 |
| 네트워크·서버·알 수 없는 DB 오류 | 마지막 확정 상태 유지, 공통 오류 영역 |
| 처리 중 재제출 | 추가 요청 차단 |

## 제외 계약

현재 인터페이스는 다음 동작을 제공하거나 성공한 것으로 가장하지 않는다.

- 요약본 생성·수정
- 비밀번호 잠금 인증과 세션 유지
- 퀴즈 조회·생성·제출·저장
- 프로필 생성·수정·삭제 또는 기존 정책 변경
- 서비스 역할 키를 사용한 RLS 우회
- mock JSON 쓰기 또는 영속 결과와 mock 결과 혼합
