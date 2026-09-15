# 작업 목록: 회원가입 페이지

**입력**: `specs/002-signup/`의 `spec.md`, `plan.md`, `research.md`, `data-model.md`, `contracts/SignupPage.md`, `quickstart.md`

**테스트**: 자동 테스트는 요청되지 않았다. 각 커밋 경계에서 `npm run dev` 기반 수동 검증을 수행하고 마지막 단계에서 `npm run lint`를 실행한다.

**구성**: 사용자 스토리별로 구현과 검증을 묶고, 작은 기능 단위로 직접 커밋할 수 있도록 경계를 지정한다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **[P]**는 서로 다른 파일을 수정하며 미완료 작업에 의존하지 않는 경우에만 사용한다.
- 실제 구현 파일은 `src/app/(site)/signup/page.js`, `src/app/(site)/signup/page.module.scss` 두 개로 제한한다.
- `Header.jsx`, `src/app/(site)/layout.js`, `_mixins.scss`, `Loading.jsx`는 수정하지 않는다.

## 1단계: 준비

**목적**: 구현 전 명세, 재사용 대상과 금지 범위를 확정한다.

- [x] T001 `AGENTS.md`, `docs/specs/Signup.md`, `specs/002-signup/spec.md`, `specs/002-signup/plan.md`, `specs/002-signup/contracts/SignupPage.md`에서 구현 범위와 입력 순서를 다시 확인한다.
- [x] T002 `src/styles/abstracts/_mixins.scss`, `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`, `src/components/Loading.jsx`에서 재사용 방식만 확인하고 수정 금지 대상을 기록한다.

**확인 지점**: 생성 파일 2개와 수정하지 않을 공통 파일이 명확하다.

---

## 2단계: 공통 선행 작업

**목적**: 사용자 스토리 구현을 시작할 최소 페이지 기반을 마련한다.

- [x] T003 `src/app/(site)/signup/page.js`를 Client Component로 생성하고 `next/link`의 `Link` 및 상대 경로 `./page.module.scss`만 불러오는 기본 페이지 구조를 작성한다.
- [x] T004 `src/app/(site)/signup/page.module.scss`를 생성하고 `styles/abstracts/colors`, `styles/abstracts/typography`, `styles/abstracts/mixins`를 프로젝트 규칙에 맞게 불러온다.

**확인 지점**: `/signup`이 컴파일되며 Header, Loading, CommonModal 또는 새 공통 컴포넌트가 추가되지 않았다.

---

## 3단계: 사용자 스토리 1 - 가입 정보 작성 (우선순위: P1) 🎯 MVP

**목표**: 사용자가 약관 영역과 닉네임·이메일·비밀번호·비밀번호 확인 입력을 확인하고 로컬 회원가입 정보를 작성할 수 있다.

**독립 검증**: `/signup`에서 네 입력이 지정된 순서로 표시되고 값을 입력할 수 있으며, 가입하기를 선택해도 실제 또는 가짜 요청과 화면 이동이 발생하지 않는지 확인한다.

### 사용자 스토리 1 구현

- [x] T005 [US1] 제목, 구분선, 약관 `fieldset`, 네 입력란, 가입하기 버튼과 `/login` Link를 의미에 맞는 순서로 `src/app/(site)/signup/page.js`에 작성한다.
- [x] T006 [US1] 닉네임·이메일·비밀번호·비밀번호 확인의 문자열 상태와 `handle` 접두사의 변경 처리 함수를 `src/app/(site)/signup/page.js`에 구현한다.
- [x] T007 [US1] 비밀번호와 비밀번호 확인의 독립적인 표시·숨김 Boolean 상태 및 키보드로 조작 가능한 전환 버튼을 `src/app/(site)/signup/page.js`에 구현하고 접근성 속성의 목적을 주석으로 설명한다.
- [x] T008 [US1] 브라우저 기본 제출만 차단하고 Supabase, API, 이동, Loading, 가짜 Promise를 실행하지 않는 `handleSubmit` 경계를 `src/app/(site)/signup/page.js`에 구현한다.
- [x] T009 [US1] 기존 `input-base`, `button-base` mixin을 재사용해 데스크톱 기준 폼·입력·버튼·비밀번호 안내의 기본 외형을 `src/app/(site)/signup/page.module.scss`에 작성한다.
- [x] T010 [US1] 최초 빈 상태, 입력 순서, 비밀번호 표시 전환과 요청 부재를 `specs/002-signup/quickstart.md`의 1·3·4번 기준으로 `/signup`에서 수동 검증한다.

**확인 지점**: 입력 가능한 데스크톱 회원가입 UI가 완성되며 실제 인증 동작은 없다.

### 커밋 경계 1

- **포함 파일**: `src/app/(site)/signup/page.js`, `src/app/(site)/signup/page.module.scss`
- **완료 조건**: T005~T010 완료 및 수동 검증 정상
- **권장 메시지**: `feat: 회원가입 기본 폼과 입력 UI 구현`
- 구현 단계에서는 이 경계에서 멈추고 사용자 커밋 완료 확인 후 다음 단계로 진행한다.

---

## 4단계: 사용자 스토리 2 - 약관 및 입력 오류 수정 (우선순위: P2)

**목표**: 사용자가 전체·개별 약관 관계와 입력 오류를 확인하고 값을 수정해 로컬 UI 유효 상태를 만들 수 있다.

**독립 검증**: 약관의 모든 선택 조합과 네 입력의 빈 값·형식·조합·일치 오류를 확인하고 유효한 값으로 수정했을 때 오류가 해제되는지 확인한다.

### 사용자 스토리 2 구현

- [x] T011 [US2] 서비스 이용약관과 AI 생성 콘텐츠 이용 안내의 Boolean 상태, 계산된 전체 동의 값과 전체·개별 변경 처리 함수를 `src/app/(site)/signup/page.js`에 구현한다.
- [x] T012 [US2] 닉네임 필수, 이메일 필수·형식, 비밀번호 영문·숫자·특수문자 포함 8~16자, 비밀번호 확인 일치 검증 함수를 `src/app/(site)/signup/page.js`에 구현한다.
- [x] T013 [US2] 네 입력의 touched 상태와 blur·submit 공개 시점을 `src/app/(site)/signup/page.js`에 구현해 최초 화면에는 오류를 숨기고 수정 후 유효해지면 오류를 해제한다.
- [x] T014 [US2] 공개된 오류에만 `aria-invalid`와 오류 문구 연결을 적용하고 각 접근성 속성의 목적을 설명하는 주석을 `src/app/(site)/signup/page.js`에 작성한다.
- [x] T015 [US2] 두 필수 약관과 로컬 입력 검증 결과로 UI 단계의 폼 유효 상태를 계산하되 닉네임·이메일 중복 통과 상태나 가짜 결과를 생성하지 않고 실제 요청은 계속 차단하도록 `src/app/(site)/signup/page.js`에 구현한다.
- [x] T016 [US2] 약관, 오류, focus, disabled 및 비밀번호 안내 상태를 Figma와 공통 mixin 외형에 맞게 `src/app/(site)/signup/page.module.scss`에 작성한다.
- [x] T017 [US2] 전체·개별 약관 관계와 입력 오류 공개·해제, `8~16자` 안내 및 네트워크 요청 부재를 `specs/002-signup/quickstart.md`의 2·3·4번 기준으로 수동 검증한다.

**확인 지점**: 약관과 로컬 입력 검증은 완성되며 닉네임·이메일 중복 확인은 후속 인증 범위로 남는다.

### 커밋 경계 2

- **포함 파일**: `src/app/(site)/signup/page.js`, `src/app/(site)/signup/page.module.scss`
- **완료 조건**: T011~T017 완료 및 수동 검증 정상
- **권장 메시지**: `feat: 회원가입 약관과 입력 검증 구현`
- 구현 단계에서는 이 경계에서 멈추고 사용자 커밋 완료 확인 후 다음 단계로 진행한다.

---

## 5단계: 사용자 스토리 3 - 반응형 화면과 기존 계정 이동 (우선순위: P3)

**목표**: 데스크톱·태블릿·모바일에서 같은 가입 흐름을 사용하고 로그인 화면으로 이동할 수 있다.

**독립 검증**: 1320px, 1024px, 480px 및 경계 너비에서 화면을 비교하고 콘텐츠 넘침 없이 `/login` Link가 작동하는지 확인한다.

### 사용자 스토리 3 구현

- [x] T018 [US3] 데스크톱 1320px 기준 중앙 콘텐츠, 약관 영역, 라벨·입력 가로 배치와 전체 너비 버튼을 `src/app/(site)/signup/page.module.scss`에 완성한다.
- [x] T019 [US3] 태블릿 1024px 기준 축소된 중앙 콘텐츠와 라벨·입력 배치를 `src/app/(site)/signup/page.module.scss`의 반응형 규칙으로 구현한다.
- [x] T020 [US3] 모바일 480px 기준 20px 여백, 모바일 폼 배치와 전체 너비 버튼을 `src/app/(site)/signup/page.module.scss`의 반응형 규칙으로 구현한다.
- [x] T021 [US3] 기준점 사이 너비에서 `max-width`, 유연한 너비와 `box-sizing`으로 가로 넘침과 콘텐츠 잘림을 방지하도록 `src/app/(site)/signup/page.module.scss`를 보완한다.
- [x] T022 [US3] `이미 계정이 있습니다.`가 `next/link`의 `Link`로 `/login`에 한 번에 이동하는지 `src/app/(site)/signup/page.js`에서 확인하고 필요한 링크 문구·스타일 연결만 보완한다.
- [x] T023 [US3] 1320px, 1024px, 480px, 1025px, 1023px, 481px, 479px에서 배치·입력 순서·잘림·가로 스크롤과 `/login` 이동을 `specs/002-signup/quickstart.md`의 4·5번 기준으로 수동 검증한다.

**확인 지점**: 세 기준 화면과 경계 너비에서 같은 기능과 입력 순서를 유지한다.

### 커밋 경계 3

- **포함 파일**: `src/app/(site)/signup/page.js`, `src/app/(site)/signup/page.module.scss`
- **완료 조건**: T018~T023 완료 및 반응형 수동 검증 정상
- **권장 메시지**: `style: 회원가입 반응형 화면 구현`
- 구현 단계에서는 이 경계에서 멈추고 사용자 커밋 완료 확인 후 다음 단계로 진행한다.

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 승인된 UI 범위와 코드 품질을 최종 확인한다.

- [x] T024 `src/app/(site)/signup/page.js`와 `src/app/(site)/signup/page.module.scss`에서 Header·Loading·CommonModal·Suspense·`loading.js`, 실제 또는 가짜 인증·중복 확인과 새 공통 컴포넌트가 추가되지 않았는지 검토한다.
- [x] T025 키보드 Tab 순서, checkbox와 비밀번호 표시 버튼 조작, label 연결 및 오류 접근성 관계를 `specs/002-signup/quickstart.md`의 6번 기준으로 `/signup`에서 수동 검증한다.
- [x] T026 `npm run lint`를 실행해 `src/app/(site)/signup/page.js`와 관련 프로젝트 lint 오류가 없는지 확인하고 범위 내 오류만 수정한다.
- [x] T027 T010, T017, T023, T025의 결과와 미구현 후속 인증 범위를 `specs/002-signup/tasks.md` 체크박스에 반영한다.

**확인 지점**: 수동 검증과 lint가 통과했으며 production build는 실행하지 않았다.

### 커밋 경계 4

- **포함 파일**: 검증 과정에서 변경된 `src/app/(site)/signup/page.js`, `src/app/(site)/signup/page.module.scss`, 완료 상태의 `specs/002-signup/tasks.md`
- **완료 조건**: T024~T027 완료, lint 정상, 전체 수동 검증 정상
- **권장 메시지**: `chore: 회원가입 UI 최종 검증`
- `git commit`과 `git push`는 사용자가 직접 수행한다.

---

## 의존성과 실행 순서

### 단계 의존성

- 준비 단계 T001~T002는 즉시 시작한다.
- 공통 선행 작업 T003~T004는 모든 사용자 스토리보다 먼저 완료한다.
- 사용자 스토리 1은 T003~T004 이후 진행하며 첫 실행 가능한 MVP를 만든다.
- 사용자 스토리 2는 사용자 스토리 1의 폼 구조와 상태를 확장하므로 T010 이후 진행한다.
- 사용자 스토리 3은 완성된 폼 구조의 배치를 조정하므로 T017 이후 진행한다.
- 최종 검증은 T023 이후 진행한다.

### 사용자 스토리 의존성

- **US1(P1)**: 공통 선행 작업에만 의존한다.
- **US2(P2)**: US1의 네 입력과 기본 상태 구조에 의존한다.
- **US3(P3)**: US1·US2의 최종 DOM 구조와 상태 스타일에 의존한다.

### 병렬 실행 가능성

- 실제 구현 파일이 `page.js`와 `page.module.scss` 두 개뿐이고 각 단계가 앞 단계의 구조를 확장하므로 구현 작업에 안전한 `[P]` 표시를 부여하지 않는다.
- 동일 파일을 동시에 수정하지 않으며 커밋 경계별로 순차 진행한다.

## 구현 전략

### MVP 우선

1. T001~T004로 범위와 페이지 기반을 확정한다.
2. T005~T010으로 입력 가능한 데스크톱 회원가입 폼을 완성하고 커밋한다.
3. 실제 인증 없이도 정적 구조와 입력·표시 전환이 독립적으로 검증되는지 확인한다.

### 점진적 전달

1. **커밋 1**: 기본 폼과 입력 UI
2. **커밋 2**: 약관 관계와 로컬 입력 검증
3. **커밋 3**: 태블릿·모바일 반응형과 로그인 이동
4. **커밋 4**: 접근성·범위·lint 최종 검증

## 참고

- 모든 작업은 `- [ ] T### [P?] [US#?] 설명` 형식을 따른다.
- 실제 구현 작업은 정확한 대상 파일을 명시한다.
- `src/styles/abstracts/_mixins.scss`의 기존 mixin은 재사용만 하고 수정하지 않는다.
- 실제 회원가입 요청이 연결되기 전에는 `Loading`과 `isLoading` 상태를 추가하지 않는다.
- 닉네임·이메일 중복 확인 결과가 없으므로 이를 통과한 것처럼 표현하지 않는다.
- production build는 작업 목록에 포함하지 않는다.
