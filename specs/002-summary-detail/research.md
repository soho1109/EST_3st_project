# 조사 결과: 요약 상세 영속 학습노트·북마크

## 결정 1: 소유권은 Auth 사용자, 표시는 Profile로 분리

**결정**: 콘텐츠와 북마크의 사용자 외래키는 `auth.users.id`를 참조한다. 기존 `profiles`는 수정하지 않고 현재 요청 주체가 접근 가능한 특정 요약본의 학습노트 작성자만 반환하는 security-definer 함수 `public.get_learning_note_author_names(summary_id)`를 추가한다. 함수는 고정 `search_path`와 소유자를 사용하고 `PUBLIC` 실행 권한을 회수한 뒤 필요한 역할에만 EXECUTE를 허용한다.

**근거**: Auth 사용자를 소유권 기준으로 삼으면 저장이 프로필 생성 상태에 의존하지 않는다. 제한 함수는 학습노트에 등장하지 않는 회원의 UUID·닉네임도 공개하지 않는다.

**검토한 대안**: `profiles.id` 직접 FK는 프로필 행 생성이 보장되지 않으면 저장을 막고, 프로필 전체 SELECT 정책 완화는 승인되지 않은 정보 공개 범위를 만든다.

## 결정 2: 팀 Supabase를 직접 사용하고 mock은 이관하지 않음

**결정**: 로컬 Supabase·Docker·seed를 추가하지 않는다. 리뷰된 마이그레이션을 팀 DB에 적용하고 기존 Auth 사용자 소유의 임시 공개 요약본 한 건으로 검증한 뒤 관련 테스트 데이터를 삭제한다. 기존 mock JSON은 DB로 이관하지 않는다.

**근거**: 사용자는 로컬 DB 운영보다 단순한 팀 DB 검증을 선택했다. 테스트 데이터와 스키마 변경을 분리하면 실제 DB에 mock 전체가 남지 않는다.

**검토한 대안**: 로컬 Docker는 격리와 재현성이 좋지만 현재 팀 작업 흐름에는 추가 설정 부담이 크다. mock 전체 이관은 실제 사용자 UUID와 맞지 않고 운영 DB에 가짜 데이터를 남긴다.

## 결정 3: 요약본·학습노트·북마크 관계형 테이블

**결정**: `summaries`, `learning_notes`, `bookmarks` 세 테이블을 추가한다. 학습노트와 북마크는 요약본을 참조한다.

**근거**: 현재 DB에는 `profiles`만 있어 학습노트와 북마크가 참조할 영속 요약본이 없다. 상위 관계를 DB 외부 문자열로만 유지하면 존재 여부, 삭제 정리와 접근 권한을 강제할 수 없다.

**검토한 대안**: JSON 안에 상위 데이터를 복제하는 방식은 관계 무결성과 상위 범위 검증을 잃는다.

## 결정 4: 북마크는 유일 관계 행로 표현

**결정**: `(user_id, summary_id)` 유일 관계의 존재가 북마크 상태다. 저장은 충돌 시 아무것도 변경하지 않은 뒤 관계를 다시 조회해 멱등 성공으로 확정하고, 해제는 DELETE로 처리한다.

**근거**: 반복 클릭과 동시 요청에서도 관계 한 건만 유지해야 한다. 일반 UPSERT는 필요 없는 UPDATE 권한을 요구한다.

**검토한 대안**: `is_active` Boolean은 현재 범위에 없는 이력·복원 의미를 추가한다.

## 결정 5: RLS와 최소 컬럼 권한을 함께 적용

**결정**: 신규 테이블에 RLS를 활성화하고 기본 권한을 회수한 뒤 작업별 최소 테이블·컬럼 권한만 부여한다. RLS는 `(select auth.uid())`와 상위 요약본 접근 가능 여부를 사용한다.

**근거**: Supabase는 노출된 `public` 스키마에 RLS 사용을 권장하며 INSERT의 `with check`, UPDATE의 `using`·`with check`, DELETE의 `using`으로 행 권한을 제한한다. 컬럼 GRANT는 관계·작성자·시각·퀴즈 상태 조작을 막는다. [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

**검토한 대안**: 버튼 숨김과 Server Action 검사만으로는 다른 클라이언트의 직접 요청을 DB에서 차단하지 못한다. 서비스 역할 키는 RLS를 우회하므로 제외한다.

## 결정 6: 비공개 요약본은 작성자만 접근

**결정**: 공개 요약본은 방문자와 로그인 사용자가 조회할 수 있고, 비공개 요약본은 잠금 기능 전까지 작성자만 조회한다. 학습노트 정책에도 같은 상위 접근 조건을 적용한다. 북마크 DELETE는 비공개 전환 후에도 본인 관계를 정리할 수 있도록 사용자 조건만 적용한다.

**근거**: 이번 범위에는 비밀번호 잠금 인증이 없으므로 비공개 항목을 공개하면 보호 콘텐츠가 노출된다.

**검토한 대안**: `is_private`를 무시하는 방식은 mock 화면 검증에는 가능하지만 실제 데이터 보안 경계로 사용할 수 없다.

## 결정 7: Server Component 조회와 Server Action 변경

**결정**: 요약본·목록·상세·수정 초기값과 북마크 초기 상태는 공통 서버 클라이언트로 조회한다. 학습노트 CRUD와 북마크 저장·해제는 Server Action으로 처리한다.

**근거**: 프로젝트는 서버 Supabase 클라이언트와 쿠키 갱신 Proxy를 이미 제공한다. Supabase SSR 안내는 보호된 사용자 식별에 `getClaims()` 사용을 권장한다. [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)

**검토한 대안**: 모든 요청을 Client Component에서 수행하면 초기 로딩, 인증, 검증과 오류 정규화가 여러 경로에 반복된다. 별도 Route Handler는 내부 화면 기능에 불필요한 HTTP 계층이다.

## 결정 8: Server Action은 공개 호출 경계로 검증

**결정**: 모든 변경 Action은 `getClaims()`로 사용자를 확인하고 식별자와 입력을 검증한다. `author_id`, `user_id`는 브라우저 입력을 받지 않고 인증 사용자 값으로 강제한다.

**근거**: Next.js는 Server Function도 민감한 작업 전에 인증·권한을 확인하도록 안내한다. [Next.js `use server` security](https://nextjs.org/docs/app/api-reference/directives/use-server)

**검토한 대안**: 숨겨진 input이나 화면의 `isOwner`만 신뢰하면 요청 조작으로 다른 사용자 ID를 제출할 수 있다.

## 결정 9: 성공 후 부분 재검증과 확정 경로 이동

**결정**: 성공한 변경은 관련 요약 상세 경로만 재검증한다. 생성·수정은 학습노트 상세, 삭제는 사용자가 선택한 현재 `/summary/{summaryId}`로 이동한다. `redirect`는 오류 처리 블록 밖에서 실행한다.

**근거**: Next.js는 Server Function 변경 후 `revalidatePath`와 `redirect` 사용을 제공하며 `redirect`는 제어 흐름 예외를 사용한다. [Next.js mutations](https://nextjs.org/docs/app/getting-started/mutating-data), [Next.js redirecting](https://nextjs.org/docs/app/guides/redirecting)

**검토한 대안**: 로컬 상태만 갱신하면 새로고침 전까지 DB 확정 결과와 화면이 달라질 수 있고 전체 사이트 재검증은 범위가 너무 넓다.

## 결정 10: 제약과 실제 조회 패턴에 맞춘 인덱스

**결정**: 안정적인 최신순 목록을 위해 `(summary_id, created_at desc, id desc)`, 작성자 정책을 위해 `summaries(author_id)`, FK 삭제 검사를 위해 `bookmarks(summary_id)`, 중복 방지를 위해 북마크 유일 인덱스를 둔다.

**근거**: 인덱스는 WHERE·JOIN·ORDER BY 조건을 지원하지만 쓰기 비용도 있으므로 실제 조회와 정책 조건에 맞춰야 한다. [Supabase indexes](https://supabase.com/docs/guides/database/postgres/indexes)

**검토한 대안**: 사용하지 않는 필드의 선제 인덱스는 현재 기능과 무관한 쓰기 비용을 만든다.

## 결정 11: DB 자체도 입력 불변 조건을 강제

**결정**: 텍스트 저장값은 `btrim(value) = value`, 필수·길이 CHECK를 적용한다. `ai_summary`는 JSON object만 허용한다. UUID는 `gen_random_uuid()`, `updated_at`은 안전한 트리거로 갱신한다.

**근거**: 서버 검증만 두면 직접 Data API 요청이 공백·길이·형태 규칙을 우회할 수 있다.

**검토한 대안**: 애플리케이션 검증만 사용하는 방식은 데이터베이스 안의 불변 조건을 보장하지 못한다.

## 결정 12: 계정 삭제는 별도 수명주기 기능으로 유지

**결정**: Auth 사용자 삭제 시 작성 콘텐츠 관계는 `ON DELETE RESTRICT`, 북마크는 `ON DELETE CASCADE`를 사용한다. 콘텐츠 보존·익명화·삭제는 계정 삭제 명세에서 결정한다.

**근거**: 현재 범위에는 계정 삭제 정책이 없어 콘텐츠 자동 삭제를 추정할 수 없다. 북마크는 독립 콘텐츠가 아닌 관계다.

**검토한 대안**: Auth 사용자 삭제 시 모든 콘텐츠를 자동 삭제하면 단순하지만 승인되지 않은 비가역적 수명주기 결정을 포함한다.
