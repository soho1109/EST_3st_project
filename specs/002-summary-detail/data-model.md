# 데이터 모델: 요약 상세 영속 학습노트·북마크

## 기존 엔티티

### AuthUser (`auth.users`)

Supabase Auth가 관리하는 사용자 원본이며 신규 콘텐츠와 북마크의 소유권 기준이다. 이번 기능은 이 테이블을 직접 수정하지 않는다.

| 필드 | 형태 | 현재 용도 |
|---|---|---|
| `id` | UUID | 요약본·학습노트 작성자와 북마크 소유자 외래키 |

### Profile (`public.profiles`)

사용자가 제공한 기존 테이블이며 이번 기능의 마이그레이션에서 변경하지 않는다.

| 필드 | 형태 | 제약 | 현재 용도 |
|---|---|---|---|
| `id` | UUID | Primary Key | 공개 닉네임 조회의 사용자 식별자 |
| `nickname` | text | Nullable, Unique | 학습노트 목록 작성자 표시 |
| `profile_image_url` | text | Nullable | 현재 상세 범위에서 사용하지 않음 |
| `bio` | text | Nullable | 현재 상세 범위에서 사용하지 않음 |
| `created_at` | timestamptz | 기존 정의 유지 | 프로필 생성 시각 |
| `updated_at` | timestamptz | 기존 정의 유지 | 프로필 수정 시각 |

**표시 계약**:

- 기존 RLS와 생성 트리거는 변경하지 않는다.
- 제한된 작성자 닉네임 함수는 접근 가능한 요약본에 실제로 등장하는 `id`, `nickname`만 제공한다.
- 대응하는 Profile이 없거나 닉네임이 null이면 화면은 `알 수 없는 사용자`를 표시한다.

### LearningNoteAuthorName (`public.get_learning_note_author_names(summary_id)` 결과)

현재 요청 주체가 접근 가능한 특정 요약본의 학습노트 작성자만 제공하는 security-definer 함수 결과다.

| 필드 | 형태 | 원본 |
|---|---|---|
| `id` | UUID | `profiles.id` |
| `nickname` | text | `profiles.nickname` |

- 입력 요약본이 공개이거나 현재 사용자 소유일 때만 결과를 반환한다.
- 해당 요약본의 학습노트에 등장하는 작성자만 반환한다.
- 결과에는 `profile_image_url`, `bio`, 시각 필드를 포함하지 않는다.
- 함수는 고정 `search_path`, 고정 소유자를 사용하고 `PUBLIC` 권한을 회수한 뒤 `anon`, `authenticated`에만 EXECUTE를 허용한다.
- 기본 `profiles` 테이블의 권한과 RLS 정책은 변경하지 않는다.

## 신규 엔티티

### Summary (`public.summaries`)

학습노트와 북마크가 참조하는 영속 요약본이다. 이번 증분에서는 조회와 작성자 본인 삭제를 제공하며 생성·수정 UI와 정책은 열지 않는다.

| 필드 | 형태 | 필수 | 기본값·제약 |
|---|---|---:|---|
| `id` | UUID | 예 | Primary Key, `gen_random_uuid()` |
| `author_id` | UUID | 예 | `auth.users.id` 참조, `ON DELETE RESTRICT` |
| `topic` | text | 예 | `btrim(topic) = topic`, 1자 이상 |
| `title` | text | 예 | `btrim(title) = title`, 1자 이상 |
| `ai_summary` | jsonb | 예 | `jsonb_typeof(ai_summary) = 'object'` |
| `is_private` | boolean | 예 | 기본값 `false` |
| `created_at` | timestamptz | 예 | 현재 시각 |
| `updated_at` | timestamptz | 예 | 현재 시각, 변경 시 자동 갱신 |

**조회 규칙**:

- 공개 요약본은 방문자와 로그인 사용자가 조회할 수 있다.
- 비공개 요약본은 잠금 인증 기능이 없으므로 작성자만 조회할 수 있다.
- 학습노트가 하나라도 소속된 요약본은 삭제할 수 없다.
- 존재하지 않거나 조회할 수 없는 요약본은 애플리케이션에서 찾을 수 없음으로 처리한다.

**AI 요약 화면 구조**:

```text
ai_summary
  title: string
  sections: array
    sectionId: string
    heading: string
    content: string[]
```

서버 정규화는 위 구조가 아니면 조회 오류로 처리하며 빈 `sections` 배열은 허용한다.

### LearningNote (`public.learning_notes`)

사용자가 요약본을 기반으로 작성하는 영속 학습 기록이다.

| 필드 | 형태 | 필수 | 기본값·제약 |
|---|---|---:|---|
| `id` | UUID | 예 | Primary Key, `gen_random_uuid()` |
| `summary_id` | UUID | 예 | `summaries.id` 참조, `ON DELETE RESTRICT` |
| `author_id` | UUID | 예 | `auth.users.id` 참조, `ON DELETE RESTRICT` |
| `title` | text | 예 | `btrim(title) = title`, 1–50자 |
| `learned_summary` | text | 예 | 기본값 `""`, trim 저장, 최대 1,000자 |
| `reflection` | text | 예 | 기본값 `""`, trim 저장, 최대 1,000자 |
| `reference_materials` | text | 예 | 기본값 `""`, trim 저장, 최대 1,000자 |
| `is_quiz_completed` | boolean | 예 | 기본값 `false`, 이번 증분에서는 읽기만 함 |
| `created_at` | timestamptz | 예 | 현재 시각, 최신순 정렬 기준 |
| `updated_at` | timestamptz | 예 | 현재 시각, 변경 시 자동 갱신 |

**불변 조건**:

- `summary_id`, `author_id`, `created_at`은 생성 후 변경하지 않는다.
- 작성자 ID는 FormData에서 받지 않고 인증 사용자 ID로 기록한다.
- 수정은 제목과 세 본문 필드만 허용한다.
- 단건 조회·수정·삭제는 `id`와 상위 `summary_id`를 함께 확인한다.
- 목록은 `summary_id`로 제한한 뒤 `created_at`, `id` 내림차순으로 제공한다.

**인덱스**:

- Primary Key: `(id)`
- 목록 조회: `(summary_id, created_at desc, id desc)`

### Bookmark (`public.bookmarks`)

로그인 사용자가 요약본을 저장했음을 나타내는 관계 엔티티다.

| 필드 | 형태 | 필수 | 기본값·제약 |
|---|---|---:|---|
| `id` | UUID | 예 | Primary Key, `gen_random_uuid()` |
| `user_id` | UUID | 예 | `auth.users.id` 참조, `ON DELETE CASCADE` |
| `summary_id` | UUID | 예 | `summaries.id` 참조, `ON DELETE CASCADE` |
| `created_at` | timestamptz | 예 | 현재 시각 |

**불변 조건**:

- `(user_id, summary_id)` 조합은 유일하다.
- `user_id`는 FormData에서 받지 않고 인증 사용자 ID로 기록한다.
- 관계 생성은 북마크 저장, 관계 삭제는 북마크 해제를 의미한다.
- 별도 `is_active` 상태와 수정 전이는 없다.

**인덱스**:

- Unique: `(user_id, summary_id)`
- 요약본 FK 조회·삭제: `(summary_id)`

## 관계

```text
AuthUser 1 ── N Summary
AuthUser 1 ── N LearningNote
AuthUser 1 ── N Bookmark

Summary 1 ── N LearningNote
Summary 1 ── N Bookmark

AuthUser N ── N Summary  (Bookmark 관계로 연결)
Profile 0..1 ── 1 AuthUser  (닉네임 표시용 ID 대응)
```
## RLS와 권한 행렬

| 엔티티 | 주체 | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| Summary | 방문자 | 공개 항목 | 불가 | 불가 | 불가 |
| Summary | 로그인 사용자 | 공개 항목 또는 본인 작성 항목 | 불가 | 불가 | 본인 작성 행 |
| LearningNote | 방문자 | 공개 요약본 소속 | 불가 | 불가 | 불가 |
| LearningNote | 로그인 사용자 | 접근 가능한 요약본 소속 | 본인을 작성자로 생성 | 본인 작성 및 상위 접근 가능 행 | 본인 작성 및 상위 접근 가능 행 |
| Bookmark | 방문자 | 불가 | 불가 | 불가 | 불가 |
| Bookmark | 로그인 사용자 | 본인 관계 | 본인 관계 | 불가 | 본인 관계 |

**권한 세부 규칙**:

- 신규 세 테이블은 RLS를 활성화한다.
- LearningNote INSERT의 `with check`는 `author_id = auth.uid()`와 상위 Summary 접근 가능 여부를 모두 확인한다.
- LearningNote UPDATE·DELETE는 `author_id = auth.uid()`와 접근 가능한 상위 Summary 존재를 함께 확인한다.
- LearningNote UPDATE 권한은 `title`, `learned_summary`, `reflection`, `reference_materials` 컬럼으로 제한한다.
- LearningNote INSERT 권한은 `summary_id`, `author_id`, `title`, 세 본문 컬럼으로 제한하고 시스템 필드는 제외한다.
- Bookmark SELECT·INSERT는 본인과 상위 Summary 접근을 확인하고 DELETE는 `user_id = auth.uid()`만 확인한다.
- 기존 Profile 정책은 변경하지 않고 제한된 작성자 닉네임 함수 실행만 허용한다.

## GRANT 행렬

신규 테이블의 기존 `anon`, `authenticated` 권한을 먼저 회수한 뒤 아래 권한만 부여한다.

| 객체 | `anon` | `authenticated` |
|---|---|---|
| `summaries` | SELECT | SELECT, DELETE |
| `learning_notes` | SELECT | SELECT, DELETE, 지정 컬럼 INSERT·UPDATE |
| `bookmarks` | 없음 | SELECT, DELETE, `user_id`, `summary_id` INSERT |
| `get_learning_note_author_names` | EXECUTE | EXECUTE |

LearningNote INSERT 가능 컬럼은 `summary_id`, `author_id`, `title`, `learned_summary`, `reflection`, `reference_materials`다. UPDATE 가능 컬럼은 `title`, `learned_summary`, `reflection`, `reference_materials`다. `id`, 관계, 작성자, 생성·수정 시각, 퀴즈 상태는 UPDATE할 수 없다. `TRUNCATE`, trigger 함수 직접 실행과 기타 불필요한 권한은 부여하지 않는다.

## 입력 모델

### StudyNoteInput

| 필드 | 정규화 | 검증 |
|---|---|---|
| `title` | 문자열 변환 후 앞뒤 공백 제거 | 필수, 1–50자 |
| `learnedSummary` | 문자열 변환 후 앞뒤 공백 제거 | 선택, 최대 1,000자 |
| `reflection` | 문자열 변환 후 앞뒤 공백 제거 | 선택, 최대 1,000자 |
| `references` | 문자열 변환 후 앞뒤 공백 제거 | 선택, 최대 1,000자 |

`summaryId`, `noteId`는 UUID 형식과 상위 관계를 확인한다. `authorId`와 `userId`는 사용자 입력 모델에 포함하지 않는다.

## 화면 조회 모델

### SummaryView

| 필드 | 원본 |
|---|---|
| `summaryId` | `summaries.id` |
| `authorId` | `summaries.author_id` |
| `topic` | `summaries.topic` |
| `title` | `summaries.title` |
| `aiSummary` | `summaries.ai_summary` |
| `isPrivate` | `summaries.is_private` |

### StudyNoteView

| 필드 | 원본·변환 |
|---|---|
| `noteId` | `learning_notes.id` |
| `summaryId` | `learning_notes.summary_id` |
| `authorId` | `learning_notes.author_id` |
| `authorNickname` | 제한된 작성자 닉네임 함수 결과, 행 또는 값이 없으면 `알 수 없는 사용자` |
| `title` | `learning_notes.title` |
| `learnedSummary` | `learning_notes.learned_summary` |
| `reflection` | `learning_notes.reflection` |
| `references` | `learning_notes.reference_materials` |
| `createdAt` | `learning_notes.created_at` |
| `createdAtDisplay` | `YYYY.MM.DD` 표시 변환 |
| `quizStatus` | `is_quiz_completed`에 따라 `completed` 또는 `notStarted` |
| `isOwner` | 현재 인증 사용자와 `author_id` 일치 여부 |

### BookmarkState

| 필드 | 규칙 |
|---|---|
| `summaryId` | 현재 요약본 ID |
| `isAuthenticated` | 검증된 사용자 식별자 존재 여부 |
| `isBookmarked` | 현재 사용자와 요약본의 Bookmark 관계 존재 여부 |

## 상태 전이

### 학습노트

```text
미존재
  └─ 유효한 생성 + 인증 + 상위 요약본 접근 허용 → 저장됨

저장됨
  ├─ 작성자 수정 + 유효한 입력 → 갱신됨
  ├─ 작성자 삭제 확인 → 삭제됨
  └─ 실패 또는 권한 없음 → 저장됨(마지막 확정 상태 유지)

삭제됨
  └─ 목록에서 제외, 직접 경로는 찾을 수 없음
```

### 북마크

```text
미저장
  ├─ 로그인 사용자 저장 성공 → 저장
  └─ 실패 → 미저장

저장
  ├─ 로그인 사용자 해제 성공 → 미저장
  ├─ 반복 저장 → 저장(관계 1개 유지)
  └─ 실패 → 저장
```
