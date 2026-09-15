# Supabase 개발 환경 안내

이 문서는 팀원이 동일한 Supabase 프로젝트를 로컬 Next.js 환경에 연결하는 방법과 공통 인증 기반 코드의 역할을 설명한다.

실제 Project URL, Publishable Key, 개인 Access Token과 데이터베이스 비밀번호는 Git이나 메신저에 공유하지 않는다.

## 1. 팀원 공통 설정

### 저장소와 패키지 준비

최신 제품 코드를 받은 뒤 의존성을 설치한다.

```bash
git switch development
git pull origin development
npm install
```

`npm install`을 실행하면 `package.json`에 등록된 다음 패키지가 함께 설치된다.

- `@supabase/supabase-js`: 인증, 데이터베이스와 Storage를 사용하는 JavaScript SDK
- `@supabase/ssr`: Next.js 서버 렌더링에서 쿠키 기반 인증을 연결하는 도구
- `supabase`: 마이그레이션, 프로젝트 연결과 원격 관리에 사용하는 개발용 CLI

공식 문서:

- [Supabase JavaScript 설치](https://supabase.com/docs/reference/javascript/installing)
- [Supabase SSR 클라이언트 생성](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase CLI 시작하기](https://supabase.com/docs/guides/local-development/cli/getting-started)

### 로컬 환경변수 등록

1. 팀 계정으로 [Supabase Dashboard](https://supabase.com/dashboard)에 로그인한다.
2. 팀 프로젝트를 연다.
3. 프로젝트 상단의 `Connect`를 선택한다.
4. `App Frameworks`에서 `Next.js`를 선택한다.
5. 프로젝트 루트에 `.env.local`을 만들고 표시된 두 값을 입력한다.

```env
NEXT_PUBLIC_SUPABASE_URL=본인이_확인한_Project_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=본인이_확인한_Publishable_Key
```

`=` 앞뒤에는 공백이나 따옴표를 넣지 않는다. `.env.local`은 Git에서 제외되므로 각 팀원이 직접 만들어야 한다. `.env.example`에는 변수 이름만 있으며 실제 값을 작성하지 않는다.

`NEXT_PUBLIC_`은 값을 숨긴다는 뜻이 아니라 브라우저 코드에서도 사용할 수 있다는 뜻이다. Publishable Key는 브라우저 공개를 전제로 하지만, 데이터 접근은 반드시 RLS 정책으로 제한해야 한다.

다음 키는 브라우저 코드와 `NEXT_PUBLIC_` 환경변수에 절대 넣지 않는다.

- Secret Key
- `service_role` Key
- 개인 Supabase CLI Access Token

공식 문서:

- [Next.js 환경변수](https://nextjs.org/docs/pages/guides/environment-variables)
- [Supabase API Key 이해하기](https://supabase.com/docs/guides/getting-started/api-keys)
- [Supabase 데이터 보안과 RLS](https://supabase.com/docs/guides/database/secure-data)

### 실행 확인

```bash
npm run dev
```

기존 페이지를 열었을 때 환경변수, Supabase 또는 Proxy 오류가 없으면 공통 연결이 정상이다. 아직 로그인 기능을 연결하지 않은 상태에서는 사용자 세션이 없는 것이 정상이다.

## 2. CLI를 사용하는 팀원만 수행할 설정

일반 페이지와 컴포넌트 개발만 하는 팀원은 CLI 로그인과 프로젝트 연결을 매번 수행할 필요가 없다. 마이그레이션, Edge Function 또는 원격 Supabase 설정을 담당하는 팀원만 아래 과정을 수행한다.

CLI 버전을 확인한다.

```bash
npx supabase --version
```

본인의 Supabase 계정으로 로그인한다.

```bash
npx supabase login --no-browser
```

터미널에 표시된 `https://` 주소 전체를 본인이 로그인한 브라우저에서 열고, 브라우저가 발급한 Verification Code를 터미널에 입력한다. 개인 Access Token이나 Verification Code를 다른 사람과 공유하지 않는다.

접근 가능한 프로젝트를 확인한다.

```bash
npx supabase projects list
```

로컬 저장소를 팀 프로젝트에 연결한다.

```bash
npx supabase link --project-ref 본인이_확인한_PROJECT_ID
```

`supabase/` 폴더는 프로젝트 설정과 향후 마이그레이션을 공유하기 위한 제품 파일이므로 Git에 포함한다. 반면 `supabase/.temp/`의 로컬 상태는 포함하지 않는다.

공식 문서:

- [Supabase CLI 명령](https://supabase.com/docs/reference/cli/introduction)
- [Supabase 로컬 개발](https://supabase.com/docs/guides/local-development)

## 3. 공통 Supabase 코드 구조

```text
src/lib/supabase/
├── client.js  # Client Component와 브라우저 이벤트용
├── server.js  # Server Component, Server Action과 Route Handler용
└── proxy.js   # 요청마다 세션 토큰을 검증하고 쿠키를 갱신

src/proxy.js   # Next.js Proxy 진입점과 실행 경로 설정

src/components/
├── AuthProvider.jsx # 사이트 전체의 브라우저 인증 상태 공유
├── GuestGuard.jsx   # 비로그인 사용자 전용 페이지의 최초 접근 판정
└── AuthGuard.jsx    # 로그인 사용자 전용 페이지 보호
```

### 브라우저 클라이언트

로그인 버튼, 로그아웃 버튼과 브라우저 이벤트에서 Supabase를 사용할 때 생성한다.

```js
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
```

### 서버 클라이언트

Server Component, Server Action과 Route Handler에서 현재 요청 사용자의 쿠키를 이용할 때 생성한다. 요청 사이에 클라이언트를 전역으로 공유하지 않는다.

```js
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
```

페이지 보호와 권한 확인에는 `getClaims()`를 우선 사용하고, 최신 사용자 레코드가 필요하면 `getUser()`를 사용한다. 서버 권한 판정에서 쿠키에 들어 있는 `getSession()` 결과만 단독으로 신뢰하지 않는다.

### Proxy와 쿠키

로그인 성공 시 Supabase는 Access Token과 Refresh Token으로 구성된 세션을 만든다. 비밀번호 자체를 쿠키에 저장하지 않는다.

Proxy는 페이지 렌더링 전에 다음 작업을 수행한다.

1. 브라우저가 보낸 세션 쿠키를 읽는다.
2. `getClaims()`로 현재 토큰을 검증한다.
3. 갱신이 필요하면 Supabase가 전달한 새 쿠키를 현재 서버 요청과 브라우저 응답에 모두 반영한다.
4. 사용자별 인증 응답이 Vercel이나 브라우저 캐시에 저장되지 않도록 캐시 방지 응답 헤더를 적용한다.

`request.cookies` 갱신은 현재 Server Component가 새 세션을 사용하게 하고, `response.cookies` 갱신은 브라우저가 다음 요청부터 새 세션을 사용하게 한다. 공통 인증 기반 파일은 담당자와 협의 없이 임의로 수정하지 않는다.

공식 문서:

- [Supabase 세션](https://supabase.com/docs/guides/auth/sessions)
- [Supabase SSR 클라이언트와 Proxy](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js cookies](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Next.js Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)

## 4. 기능 개발에서 사용하는 방법

### 공통 인증 구조

`src/app/(site)/layout.js`가 `Header`와 모든 사이트 페이지를 `AuthProvider`로 감싸고 있다. 기능 페이지에서 사용자 세션을 확인하기 위해 `getUser()`나 `getClaims()`를 반복 호출하지 않는다. Client Component에서는 `useAuth()`로 이미 확인된 공통 상태를 읽는다.

```js
"use client";

import { useAuth } from "@/components/AuthProvider";

export default function ExampleComponent() {
  const { user, isAuthenticated, isAuthLoading, supabase } = useAuth();

  // 페이지 명세에 맞는 화면과 요청을 작성한다.
}
```

`useAuth()`가 제공하는 값은 다음과 같다.

| 값 | 형태 | 사용하는 상황 |
| --- | --- | --- |
| `user` | Supabase User 또는 `null` | `user.id`, 이메일과 사용자 메타데이터가 필요할 때 |
| `isAuthenticated` | Boolean | 로그인 여부에 따라 버튼이나 동작을 구분할 때 |
| `isAuthLoading` | Boolean | 앱 최초 세션 확인이 끝났는지 구분할 때 |
| `supabase` | Browser Supabase Client | Client Component의 인증·데이터 요청에서 공통 클라이언트가 필요할 때 |
| `isLoggingOut` | Boolean | 로그아웃 중 버튼을 비활성화하거나 공통 Loading을 표시할 때 |
| `signOut` | Function | 공통 로그아웃 처리와 메인 페이지 이동이 필요할 때 |

`isAuthLoading`은 로그인·저장 요청의 로딩 상태가 아니다. 로그인 요청은 로그인 페이지의 `isLoading`, 저장 요청은 해당 기능의 `isLoading`처럼 요청을 시작한 호출 측에서 별도로 관리한다.

### 로그인 전용 페이지: AuthGuard

마이페이지처럼 페이지 전체가 로그인 사용자 전용이면 최상위 화면을 `AuthGuard`로 감싼다.

```js
import AuthGuard from "@/components/AuthGuard";

export default function ProtectedPage() {
  return (
    <AuthGuard>
      <main>{/* 로그인 사용자에게만 공개할 페이지 */}</main>
    </AuthGuard>
  );
}
```

`AuthGuard`는 최초 인증 확인 또는 로그아웃 중에는 `Loading`, 비로그인 상태에는 `CommonModal`의 `requireLogin` 모드를 표시한다. 로그인 상태에서만 `children`을 렌더링한다.

현재 적용된 경로는 다음과 같다.

- `/mypage`
- `/mypage/mysummaries`
- `/mypage/bookmarks`

새 페이지가 로그인 전용인지 여부는 해당 페이지 명세를 확인한 뒤 결정한다. 공개 페이지를 편의상 `AuthGuard`로 감싸지 않는다.

### 비로그인 전용 페이지: GuestGuard

로그인과 회원가입처럼 비로그인 사용자만 이용하는 페이지는 최상위 화면을 `GuestGuard`로 감싼다.

```js
import GuestGuard from "@/components/GuestGuard";

export default function GuestOnlyPage() {
  return (
    <GuestGuard>
      <main>{/* 로그인 또는 회원가입 화면 */}</main>
    </GuestGuard>
  );
}
```

`GuestGuard`는 페이지 최초 진입 시점의 인증 상태만 판정한다. 이미 로그인한 상태로 접근하면 `alreadyLoggedIn` 모달을 표시한다. 비로그인 상태로 정상 진입한 뒤 로그인이나 회원가입에 성공한 경우에는 인증 상태가 바뀌어도 현재 제출과 이동 절차를 방해하지 않는다.

회원가입 완료 페이지는 회원가입 직후의 완료 표식을 로그인 상태보다 먼저 판정하는 별도 접근 규칙이 있으므로 일반 `GuestGuard`로 감싸지 않는다.

### 공개 페이지의 로그인 전용 기능

요약노트 상세처럼 페이지 조회는 공개지만 퀴즈나 북마크 동작만 로그인 전용이면 페이지 전체에 `AuthGuard`를 사용하지 않는다. 해당 버튼의 호출부에서 `isAuthenticated`를 확인한다.

```js
const { isAuthenticated } = useAuth();

function handleProtectedAction() {
  if (!isAuthenticated) {
    setIsLoginModalOpen(true);
    return;
  }

  // 로그인 사용자에게 허용된 동작을 실행한다.
}
```

비로그인 사용자가 기능을 선택했을 때는 해당 명세에 따라 `CommonModal`의 `suggestLogin` 모드를 사용한다. 로그인 전용 버튼을 무조건 숨길지, 표시한 뒤 모달로 안내할지는 페이지 명세를 따른다.

### 작성자·소유자 전용 기능

수정과 삭제처럼 로그인 여부만으로 허용할 수 없는 기능은 현재 사용자 ID와 데이터의 작성자 ID를 비교한다.

```js
const { user } = useAuth();
const isAuthor = user?.id === summary.userId;

return isAuthor ? <button type="button">삭제</button> : null;
```

화면에서 버튼을 숨기는 것은 사용성 처리일 뿐 보안 정책이 아니다. 사용자가 직접 요청을 보내더라도 다른 사람의 데이터를 수정·삭제할 수 없도록 Supabase 테이블에 작성자 기준 RLS 정책을 설정해야 한다.

### 페이지 담당자 작업 범위

- 페이지 전체가 로그인 전용이면 `AuthGuard`를 적용한다.
- 공개 페이지의 일부 기능만 제한하면 `useAuth()`와 `suggestLogin` 모달을 사용한다.
- 본인 데이터 조회에는 임시 문자열 대신 `user.id`를 사용한다.
- 수정·삭제에는 로그인 여부와 작성자 일치 여부를 모두 확인한다.
- 데이터 조회·저장·수정·삭제 권한은 RLS로 다시 제한한다.
- 공통 `AuthProvider`, Guard, Supabase 클라이언트와 Proxy는 페이지마다 복사하거나 임의로 수정하지 않는다.

### 어떤 클라이언트를 선택할지

| 작업 위치 또는 상황 | 사용할 파일 | 생성 방법 |
| --- | --- | --- |
| Client Component의 클릭·제출 이벤트 | `@/lib/supabase/client` | `const supabase = createClient()` |
| Server Component의 최초 데이터 조회 | `@/lib/supabase/server` | `const supabase = await createClient()` |
| Server Action과 Route Handler | `@/lib/supabase/server` | `const supabase = await createClient()` |
| 세션 토큰 검증과 갱신 | 공통 Proxy | 기능 개발자가 직접 호출하지 않음 |

파일 상단에 `"use client"`가 있고 `onClick`, `onSubmit`, `useState` 등을 사용하는 화면이면 브라우저 클라이언트를 사용한다. `async function Page()` 형태의 Server Component라면 서버 클라이언트를 사용한다.

### Server Component에서 목록 조회

다음 예시는 테이블이 생성된 뒤 서버에서 목록을 처음 불러오는 기본 형태다.

```js
import { createClient } from "@/lib/supabase/server";

export default async function ExamplePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("실제_테이블명")
    .select("필요한_컬럼명")
    .order("정렬_컬럼명", { ascending: false });

  if (error) {
    // 페이지 명세에 정의된 공통 오류 처리로 연결한다.
  }

  return <div>{/* data를 화면에 렌더링 */}</div>;
}
```

`실제_테이블명`, 컬럼과 정렬 기준은 확정된 데이터베이스 명세와 마이그레이션을 확인한 뒤 입력한다. 화면에서 사용하지 않는 컬럼까지 `select("*")`로 가져오지 않는다.

- [Supabase JavaScript SELECT](https://supabase.com/docs/reference/javascript/select)

### Client Component에서 사용자 이벤트 처리

저장 버튼처럼 사용자의 동작으로 요청을 시작할 때 사용하는 기본 형태다.

```js
"use client";

import { createClient } from "@/lib/supabase/client";

export default function ExampleForm() {
  async function handleSubmit(event) {
    event.preventDefault();

    const supabase = createClient();
    const { data, error } = await supabase
      .from("실제_테이블명")
      .insert({ 실제_컬럼명: "저장할 값" })
      .select()
      .single();

    if (error) {
      // 페이지 명세에 정의된 폼 오류 또는 CommonModal 처리로 연결한다.
      return;
    }

    // 성공 이후 상태 변경이나 이동은 해당 페이지 명세를 따른다.
  }

  return <form onSubmit={handleSubmit}>{/* 입력 UI */}</form>;
}
```

사용자 이벤트 요청에서는 해당 페이지가 Boolean `isLoading`을 관리하고 공통 `Loading`을 표시한다. 같은 요청에 Suspense fallback을 중복 적용하지 않는다.

- [Supabase JavaScript INSERT](https://supabase.com/docs/reference/javascript/insert)

### 현재 로그인 사용자 확인

서버에서 페이지 보호나 권한 확인이 필요하면 `getClaims()`를 우선 사용한다.

```js
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase.auth.getClaims();
const userId = data?.claims?.sub;
```

최신 이메일과 사용자 메타데이터 등 Auth 사용자 레코드가 필요하면 `getUser()`를 사용한다.

```js
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
```

`userId`나 `user`가 없을 때 이동 또는 안내 모달을 어떻게 처리할지는 각 페이지 명세를 따른다. 화면에서 사용자를 확인했더라도 데이터 접근 권한은 반드시 RLS 정책으로 다시 제한한다.

- [Supabase SSR 인증 메서드 선택](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Auth JavaScript API](https://supabase.com/docs/reference/javascript/auth-api)

### Storage에 프로필 이미지나 썸네일 업로드

버킷과 접근 정책이 만들어진 뒤 Client Component의 파일 선택 이벤트 등에서 사용할 수 있다.

```js
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const filePath = `${userId}/${crypto.randomUUID()}-${file.name}`;

const { data, error } = await supabase.storage
  .from("실제_버킷명")
  .upload(filePath, file, {
    upsert: false,
  });
```

- `실제_버킷명`은 팀에서 생성한 버킷 이름으로 바꾼다.
- 사용자 파일은 충돌과 덮어쓰기를 피하도록 사용자 ID와 고유한 파일명을 조합한다.
- 업로드 전에 파일 형식과 용량을 해당 페이지 명세에 맞게 검증한다.
- 업로드 성공 후 반환된 `data.path`를 필요한 테이블 컬럼에 저장한다.
- Public 버킷은 공개 URL을 사용할 수 있지만, Private 버킷은 Signed URL 또는 인증된 다운로드를 사용한다.
- 버킷이 존재해도 `storage.objects`의 RLS 정책이 없으면 업로드나 조회가 거부될 수 있다.

```js
const { data: publicUrlData } = supabase.storage
  .from("실제_Public_버킷명")
  .getPublicUrl(filePath);

const publicUrl = publicUrlData.publicUrl;
```

- [Supabase Storage 업로드](https://supabase.com/docs/reference/javascript/storage-from-upload)
- [Supabase Storage 접근 제어](https://supabase.com/docs/guides/storage/security/access-control)

### 데이터베이스와 Storage 작업 전 확인사항

기능 개발자는 쿼리를 작성하기 전에 다음 내용을 담당자와 확인한다.

1. 실제 테이블·컬럼 또는 버킷 이름
2. 로그인하지 않은 사용자도 접근 가능한지
3. 본인이 만든 행과 파일만 수정·삭제할 수 있는지
4. 필요한 SELECT, INSERT, UPDATE와 DELETE RLS 정책이 존재하는지
5. 실패 시 폼 내부 오류, `CommonModal` 또는 다른 UI 중 무엇을 사용하는지

RLS는 프론트엔드의 버튼 숨김을 대신하는 것이 아니라, 사용자가 직접 API를 호출해도 허용된 데이터만 접근하도록 데이터베이스에서 최종적으로 차단하는 보안 규칙이다. 공개 스키마의 테이블과 Storage는 정책을 확인하지 않은 채 배포하지 않는다.

- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 팀원이 수정하지 않아도 되는 코드

일반 기능을 개발할 때 다음 파일의 쿠키 처리 코드를 복사하거나 페이지마다 다시 작성하지 않는다.

```text
src/lib/supabase/client.js
src/lib/supabase/server.js
src/lib/supabase/proxy.js
src/proxy.js
src/components/AuthProvider.jsx
src/components/AuthGuard.jsx
src/components/GuestGuard.jsx
```

기능 코드에서는 상황에 맞는 `createClient()`를 import한 뒤 Supabase Auth, Database 또는 Storage API를 호출한다. 공통 코드 변경이 필요하면 인증 설정 담당자와 먼저 협의한다.

## 5. Vercel 배포

`.env.local`은 Vercel에 자동으로 전달되지 않는다. 배포 담당자는 Vercel 프로젝트의 Environment Variables에 다음 값을 별도로 등록한다.

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Secret Key와 `service_role` Key를 `NEXT_PUBLIC_` 변수로 등록하지 않는다. 등록 후 새 배포를 실행해야 빌드에 환경변수가 반영된다.

- [Vercel 환경변수](https://vercel.com/docs/environment-variables)
