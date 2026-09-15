# 조사 결과: 학습노트 전체 목록

## 조사 범위

- 대상 기능: `specs/003-all-notes/spec.md`
- 관련 원본 명세: `docs/specs/All-notes.md`, `docs/specs/AllSummary.md`, `docs/specs/Mypage.md`, `docs/specs/Summary.md`, `docs/specs/Header.md`
- 재사용 대상: `NoteItem`, `Banner`, `EmptyState`, `CommonModal`, `AuthGuard`, 사이트 `layout.js`
- 기존 설계 의존성: `specs/002-summary-detail`의 학습노트 조회 모델과 Supabase 인증·RLS 경계

## 결정 1: 두 경로는 하나의 기능 전용 Client Component로 목록 상호작용을 공유한다

**결정**: `/allnote/page.js`와 다른 목록 페이지가 공용 `src/components/AllNotes.jsx`를 사용해 목록 상태·추가 로딩·행 렌더링을 공유한다. `IntersectionObserver`, 요청 중복 방지, 오류 모달 상태처럼 브라우저 API와 이벤트가 필요한 부분만 Client Component 경계에 둔다.

**근거**:

- Next.js App Router의 페이지와 레이아웃은 기본적으로 Server Component이며, 상태·이벤트·브라우저 API가 필요한 부분만 Client Component로 분리하는 방식이 프로젝트 규칙과 일치한다.
- 두 경로는 총 개수, 12개 단위 추가, 행 정보, 빈 상태, 오류 처리 규칙이 동일하고 목록 범위만 다르다. 동일 로직을 두 페이지에 복사하면 중복 로딩 방지와 오류 후속 이동이 어긋날 위험이 있다.
- `AllNotes`는 여러 목록 페이지에서 사용하는 기능 전용 공용 컴포넌트로 두며, 범용 목록 프레임워크나 별도 상태 관리 라이브러리는 추가하지 않는다.

**대안 검토**:

- 페이지마다 목록 로직을 직접 작성하는 방법은 새 공통 컴포넌트를 만들지 않는 장점이 있지만, 두 경로의 커서·중복 방지·상태 전이를 중복 구현하게 되어 제외했다.
- 전체 페이지를 Client Component로 만들고 라우트·데이터 문맥까지 한 파일에서 처리하는 방법은 가능하지만, 범위와 데이터 책임이 페이지에 섞인다. 페이지는 얇은 라우트 어댑터로 유지한다.

참고: [Next.js `use client` 지시어](https://nextjs.org/docs/app/api-reference/directives/use-client), [Next.js Server 및 Client Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

## 결정 2: 페이지 크기는 12로 고정하고 `createdAt`과 `noteId`의 복합 커서를 사용한다

**결정**: 첫 조회와 추가 조회 모두 최대 12개를 사용한다. 정렬 키는 `createdAt` 내림차순, 동일 시각의 순서를 보장하는 `noteId` 내림차순으로 고정하고, 다음 조회에는 마지막 항목의 두 값을 함께 전달한다.

**근거**:

- 명세가 첫 묶음과 이후 묶음을 각각 최대 12개로 요구한다.
- 작성일만 커서로 사용하면 같은 시각에 생성된 노트가 다음 묶음에서 누락되거나 중복될 수 있다. 고유 식별자를 보조 정렬·커서로 사용하면 각 항목의 위치가 결정적이다.
- 클라이언트는 현재 요청 중인 커서를 잠그고 이미 보유한 복합 키를 확인하여 같은 묶음의 중복 요청과 중복 표시를 모두 차단한다.

**대안 검토**:

- 단순 `offset` 페이지네이션은 구현이 간단하지만 목록 중간에 새 노트가 생길 때 페이지 경계가 이동해 중복·누락 가능성이 있다.
- `createdAt` 단일 커서는 동률 시각을 구분하지 못하므로 사용하지 않는다.

참고: [Supabase 데이터 정렬](https://supabase.com/docs/reference/javascript/order), [Supabase 데이터 범위 조회](https://supabase.com/docs/reference/javascript/range), Supabase 공식 예시의 고유 보조 키를 포함한 keyset pagination 패턴

## 결정 3: 데이터 통신은 기존 Supabase·요약 상세 계약을 소비하고 새 API나 스키마를 추가하지 않는다

**결정**: 이 기능은 목록 화면과 목록 조회·접근 상태의 논리 계약만 정의한다. `src/lib/supabase/client.js`, `src/lib/supabase/server.js`, `src/lib/supabase/proxy.js`의 공통 구현과 `specs/002-summary-detail`에서 정의한 영속 데이터 모델·RLS 경계를 재사용한다. 새 테이블, 마이그레이션, Route Handler, 데이터 요청 라이브러리, 서비스 역할 키는 추가하지 않는다.

**근거**:

- 프로젝트 규칙은 Supabase 인증·데이터베이스·서버 통신 구조가 명세로 확정되지 않은 경우 임의로 결정하지 않도록 한다.
- 현재 프로젝트에는 브라우저·서버 Supabase 클라이언트와 인증 Proxy가 이미 있고, 요약 상세 계획이 `summaries`·`learning_notes` 관계와 표시용 학습노트 모델을 정의한다.
- 이 기능의 가정도 로그인 상태, 사용자 식별과 요약본 공개 여부가 기존 서비스 영역에서 제공된다고 명시한다.
- Supabase는 2026년 5월부터 새 public 스키마 객체를 Data API에 자동 노출하지 않는 방향으로 변경했으므로, 향후 스키마 변경이 필요하더라도 별도 승인·GRANT·RLS 검토가 필요한 범위다. 이 기능은 그 변경을 만들지 않는다.

**대안 검토**:

- 기능 전용 API Route를 새로 만들면 브라우저에서 호출하기 쉬우나, 기존 프로젝트에 없는 통신 계층과 인증 전달 규칙을 추가하게 되므로 제외했다.
- 이 기능에서 Supabase 마이그레이션까지 함께 만들면 목록을 독립적으로 완성할 수 있지만, `002-summary-detail`의 영속 데이터 작업과 중복되고 작업 범위가 커진다.
- 목록 검증은 실제 Supabase 서비스 계약의 결과를 사용하며, 영속 데이터와 별도의 목데이터를 운영 경로에 섞지 않는다.

참고: [Supabase SSR 클라이언트 생성](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Changelog](https://supabase.com/changelog)

## 결정 4: 접근 제어와 오류 후속 이동은 기존 공통 컴포넌트 계약으로 연결한다

**결정**:

- `/mypage/summaries`는 기존 `AuthGuard`로 감싼다. 비로그인 사용자는 자식 목록을 보지 않고 `CommonModal`의 `requireLogin` 동작을 통해 3초 후 `/login`으로 이동한다.
- `/allnote`는 공개 요약본이면 비로그인 조회를 허용하고 잠긴 요약본 소속 노트는 조회 단계에서 제외한다.
- 일반 조회 실패는 `CommonModal`의 `error` 모드로 표현하고, 모달 종료 시 호출 경로에 따라 `/mypage` 또는 `/`로 이동한다.

**근거**:

- 기존 `AuthGuard`와 `CommonModal`의 책임과 모드가 각각 명세화되어 있다.

**대안 검토**:

- 목록 페이지에서 로그인·오류 모달을 각각 새로 구현하면 공통 문구와 타이머가 분산된다.
- 전체 목록에서 잠긴 요약본의 노트를 먼저 제외하므로 별도 비밀번호 저장·세션 인증 방식을 추가하지 않는다.

## 결정 5: 표시 데이터는 어댑터에서 정규화하고 기존 UI 컴포넌트를 변경하지 않는다

**결정**: 목록 조회 결과를 화면 모델로 정규화한다. 날짜는 `YYYY.MM.DD`, 퀴즈 상태는 `completed` 또는 `notStarted`, 긴 닉네임·제목은 행 스타일의 ellipsis로 처리한다. `NoteItem`에는 `summaryId`, `noteId`, `authorNickname`, `title`, `createdAt`, `quizStatus`를 전달한다.

**근거**:

- `NoteItem`은 이미 정확한 상세 경로 링크와 퀴즈 전·후 이미지 매핑을 제공한다.
- `Banner`는 유효한 내부·외부 목적지와 이미지 누락을 이미 판별하며, `EmptyState`는 호출자가 문구를 전달하는 구조다.
- 명세는 작성일 영역의 퍼센트 표시를 제외하고 별도 CTA를 금지한다.

**대안 검토**:

- `NoteItem`에 목록 전용 상태나 퍼센트 props를 추가하면 기존 상세 목록 호출부에 영향이 생기고 명세에도 없는 데이터를 도입하게 된다.
- 배너·빈 상태를 페이지마다 직접 작성하면 공통 계약과 시각적 동작이 달라질 수 있어 기존 컴포넌트를 재사용한다.

## 결정 6: 현재 경로 충돌은 삭제·이름 변경 없이 정식 경로를 기준으로 기록한다

**결정**: 내 목록의 정식 경로는 `/mypage/summaries`, 모든 노트 목록의 정식 경로는 `/allnote`로 계획한다. 현재 소스의 `/mypage/mysummaries`는 이 계획에서 삭제·이름 변경하지 않으며, `/summary/[summaryId]/notes` 목록 페이지도 추가하지 않는다. 노트 생성·상세·수정 하위 경로는 기존 위치를 유지한다.

**근거**:

- 기능 명세, `docs/specs/Mypage.md`, `AGENTS.md`의 구조가 모두 `/mypage/summaries`를 기준으로 한다.
- 기존 파일을 즉시 이동하거나 삭제하면 기존 링크와 작업 중인 팀원의 경로에 영향을 줄 수 있다.

**대안 검토**:

- 기존 `/mypage/mysummaries`를 즉시 이름 변경하는 방법은 경로를 하나로 만들지만, 사용자가 승인하지 않은 파일 이동과 기존 호출부 변경이 된다.
- `/mypage/mysummaries`만 계속 사용하는 방법은 명세의 URL과 일치하지 않으므로 제외했다.

## 조사 결론

기술적 미확정 사항은 새 기술 선택으로 확장하지 않고 기존 공통 컴포넌트·Supabase 인증 경계·요약 상세 데이터 계약으로 해소했다. 구현 시에는 목록 화면과 두 라우트, 복합 커서 페이지네이션, 공개 요약본 필터, 오류 후속 이동만 다루며 스키마·비밀번호 저장 방식·북마크 동작은 범위에서 제외한다.
