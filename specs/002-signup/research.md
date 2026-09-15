# 조사 결과: 회원가입 페이지

## 1. 상호작용 경계

**결정**: `src/app/(site)/signup/page.js`를 Client Component로 구성한다.

**근거**: 약관과 입력값, touched 상태, 비밀번호 표시 여부 및 이벤트 처리는 브라우저 상호작용 상태가 필요하다. Next.js App Router는 상태와 이벤트 핸들러가 필요한 UI에 Client Component 사용을 안내한다.

**검토한 대안**: 페이지를 Server Component로 유지하고 하위 폼을 새 공통 컴포넌트로 분리하는 방식은 가능하지만, 이 페이지에서만 사용하는 폼을 불필요하게 분리하고 새 구조를 만들기 때문에 제외한다.

## 2. 로그인 화면 이동

**결정**: `이미 계정이 있습니다.` 이동에는 `next/link`의 `Link`와 고정 경로 `/login`을 사용한다.

**근거**: 목적지가 정적으로 정해진 내부 이동이며 프로젝트와 Next.js 모두 Link를 우선한다.

**검토한 대안**: `useRouter().push()`는 서버 결과나 조건부 이동이 아니므로 불필요하다. 일반 `a`는 내부 App Router 이동의 기본 선택이 아니다.

## 3. 폼 상태와 전체 동의

**결정**: 네 입력값과 두 개별 약관을 로컬 상태로 관리하고 전체 동의는 `isServiceTermsAccepted && isAiTermsAccepted`로 계산한다.

**근거**: 전체 동의와 개별 상태를 모두 독립 상태로 저장하면 서로 다른 값이 될 수 있다. 계산된 값은 명세의 양방향 관계를 항상 보장한다.

**검토한 대안**: 전체 동의까지 별도 상태로 저장하는 방식은 동기화 코드와 불일치 가능성을 늘려 제외한다. 전역 상태는 단일 페이지 폼에 과도하며 금지되어 있다.

## 4. 검증 공개 시점과 접근성

**결정**: 입력값과 touched 상태를 분리하고 blur 또는 제출 시점 이후 오류를 표시한다. 오류가 공개된 입력에 `aria-invalid`와 오류 문구 연결을 제공한다.

**근거**: 최초 빈 화면에서 오류를 보여주지 않는 명세를 지키면서 사용자가 수정할 입력과 오류 설명의 관계를 보조기기에 전달할 수 있다.

**검토한 대안**: 입력할 때마다 즉시 오류를 공개하면 최초·작성 중 경험이 명세와 달라진다. `useRef`만으로 값을 읽는 방식은 선택 관계와 파생 유효 상태를 화면에 일관되게 반영하기 어렵다.

## 5. 중복 확인 없는 UI 단계

**결정**: 닉네임·이메일 중복 확인 상태, 가짜 응답 및 지연 Promise를 만들지 않는다. 이번 단계는 로컬 형식 검증까지만 제공하고 실제 가입 가능 판정은 후속 인증 계약에서 완성한다.

**근거**: 명세가 실제 API와 가짜 중복 결과를 모두 금지한다. 임의의 통과 상태를 만들면 UI가 실제 가입 가능 상태인 것처럼 오해될 수 있다.

**검토한 대안**: 항상 성공하는 가짜 검사나 임시 Boolean은 사용자 조건을 위반하므로 제외한다. 가입 버튼을 영구 비활성화하는 방식도 UI 검증 가치를 낮추므로, tasks 단계에서 로컬 유효성에 따른 시각 상태와 실제 제출 차단 경계를 명확히 나눠야 한다.

## 6. 공통 스타일 재사용

**결정**: 기존 `_mixins.scss`의 `input-base`와 `button-base`를 그대로 사용하고 회원가입의 크기·배치·상태 스타일은 `page.module.scss`에서 추가한다.

**근거**: 로그인 페이지와 같은 입력 테두리·그림자·모서리 및 버튼 기본 외형을 유지하면서 페이지별 너비와 색상을 표현할 수 있다.

**검토한 대안**: 새 공통 React Input·Button 또는 새 mixin을 만드는 방식은 요청 범위를 넘어가므로 제외한다.

## 7. Loading 연결 정책

**결정**: 이번 UI 단계에서는 Loading을 렌더링하지 않는다. 실제 요청 연결 시에만 페이지 소유 Boolean `isLoading`으로 기존 Loading을 조건부 렌더링한다.

**근거**: Loading은 요청을 시작하거나 판정하지 않으며, 가짜 Promise 없이 요청 중 상태가 발생하지 않는다. 이벤트 요청에는 Suspense가 아니라 호출 측 상태를 사용한다.

**검토한 대안**: 고정 `isLoading = false` 상태를 미리 두는 방식은 사용되지 않는 상태를 만들고, 가짜 Promise는 명시적으로 금지되어 있어 제외한다.

## 참고 자료

- Next.js Server and Client Components: https://nextjs.org/docs/app/getting-started/server-and-client-components
- Next.js Link: https://nextjs.org/docs/app/api-reference/components/link
- MDN `aria-invalid`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-invalid
- MDN `aria-describedby`: https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-describedby
