---

description: "로그인 페이지 UI 구현을 위한 작업 목록"
---

# 작업 목록: 로그인 페이지

**입력**: `/specs/003-login-page/`의 설계 문서

**필수 문서**: `plan.md`, `spec.md`

**참고 문서**: `research.md`, `data-model.md`, `contracts/LoginPage.md`, `quickstart.md`

**구현 범위**: 로그인 UI, 입력 검증, 기본 세션 유지 안내, 공통 Loading 배치, 반응형 스타일

**제외 범위**: 실제 Supabase 인증, OAuth, API, 세션 저장·복구, 가짜 인증 성공, `loading.js`, Suspense fallback, production build

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 다른 파일에서 의존성 없이 병렬로 수행할 수 있는 작업에만 표시
- **[US#]**: 사용자 스토리 단계의 작업에만 표시

## 1단계: 준비

**목적**: 구현 전 파일 경계, 재사용 자산과 금지 범위 확인

- [x] T001 `AGENTS.md`, `.specify/memory/constitution.md`, `specs/003-login-page/spec.md`, `specs/003-login-page/plan.md`의 로그인 페이지 범위와 규칙을 확인한다.
- [x] T002 `src/components/CommonModal.jsx`, `src/components/Loading.jsx`, `src/app/(site)/layout.js`의 기존 계약을 확인하고 수정 대상에서 제외한다.
- [x] T003 [P] `public/images/kakao-icon.svg`, `public/images/google-icon.svg`와 root layout의 Material Symbols 설정을 확인한다.

**확인 지점**: 생성 파일은 `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`이고 공통 수정 파일은 `src/styles/abstracts/_mixins.scss`뿐임을 확인한다.

---

## 2단계: 공통 선행 작업

**목적**: 로그인과 이후 페이지에서 재사용할 Input·버튼 외형을 SCSS mixin으로 준비

- [x] T004 `src/styles/abstracts/_mixins.scss`에 테두리, 모서리 반경, 그림자와 내부 정렬을 제공하는 Input 외형 mixin을 추가한다.
- [x] T005 `src/styles/abstracts/_mixins.scss`에 배경색과 너비를 인자로 받고 공통 정렬·타이포그래피·모서리를 제공하는 버튼 외형 mixin을 추가한다.
- [x] T006 `src/styles/abstracts/_mixins.scss`의 기존 `font` mixin을 유지하고 새 mixin이 로그인 페이지별 크기·배치까지 고정하지 않는지 확인한다.

**확인 지점**: 새 React Input·Button 컴포넌트 없이 공통 외형만 재사용할 수 있다.

### 커밋 경계 1

- 변경 파일: `src/styles/abstracts/_mixins.scss`
- 검증: 기존 mixin 보존, Input mixin 값, 버튼 인자 적용 가능 여부 확인
- 권장 커밋: `git commit -m "style: 로그인 입력 및 버튼 공통 mixin 추가"`

---

## 3단계: 사용자 스토리 1 - 이메일과 비밀번호 로그인 UI (우선순위: P1) 🎯 MVP

**목표**: 이메일·비밀번호 입력, 입력 검증, 기본 세션 유지 안내와 요청 상태 표시 경계를 제공한다.

**독립 검증**: `/login`에서 초기 상태, 입력란 이탈 오류, 유효값 수정 시 오류 해제, 로그인 버튼 활성화와 기본 세션 유지 안내를 확인한다.

### 사용자 스토리 1 구현

- [x] T007 [US1] `src/app/(site)/login/page.js`를 Client Component로 생성하고 이메일, 비밀번호, 입력란 이탈 여부, 폼 오류, `isLoading` 상태와 파생 폼 유효성을 구성한다.
- [x] T008 [US1] `src/app/(site)/login/page.js`에 이메일 필수·형식 및 비밀번호 필수 검증을 구현하고 이탈 후 고정된 단일 오류 공간에 우선순위별 한 문구 표시, 유효값 수정 시 즉시 갱신·해제, 비밀번호 상시 마스킹을 적용한다.
- [x] T009 [US1] `src/app/(site)/login/page.js`에 로고·소개 문구, Material Symbols `person`·`lock`, 이메일·비밀번호 입력, `info` 아이콘과 기본 세션 유지 안내 및 유효성 기반 로그인 버튼을 구성한다.
- [x] T010 [US1] `src/app/(site)/login/page.js`에서 `isLoading`일 때 기존 `Loading`을 한 번만 렌더링하고 모든 입력·인증 버튼을 비활성화하되 가짜 성공과 별도 세션 선택 처리는 추가하지 않는다.
- [x] T011 [US1] `src/app/(site)/login/page.js`의 label, 오류 연결, 비활성화와 Material Symbols 관련 접근성 속성에 목적을 설명하는 주석을 적용한다.
- [x] T012 [US1] `src/app/(site)/login/page.module.scss`를 생성하고 `@use "styles/abstracts/mixins" as mixin;`으로 공통 mixin을 적용해 데스크톱 `1320px` 로그인 UI와 배경·Input·placeholder·버튼 상태 스타일을 구현한다.
- [x] T013 [US1] `src/app/(site)/login/page.module.scss`에 태블릿 `1024px`과 모바일 `480px` 레이아웃, 지정 영역·로고·로그인 버튼 크기와 gutter·margin 차이를 반영하되 배경·Input 그림자·placeholder 스타일은 데스크톱 기준으로 유지한다.

**확인 지점**: 이메일 로그인 UI와 클라이언트 검증을 독립적으로 실행할 수 있으며 실제 인증은 발생하지 않는다.

### 커밋 경계 2

- 변경 파일: `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`
- 검증: 초기 상태, blur 검증, 오류 해제, 버튼 활성화, 기본 세션 유지 안내, 1320px·1024px·480px 표시 확인
- 권장 커밋: `git commit -m "feat: 로그인 폼 UI와 반응형 검증 구현"`

---

## 4단계: 사용자 스토리 2 - 카카오·구글 간편 로그인 진입 UI (우선순위: P2)

**목표**: 지정된 카카오·구글 자산을 사용한 간편 로그인 버튼을 제공한다.

**독립 검증**: `/login`에서 두 제공자의 아이콘과 접근 가능한 이름이 올바르게 표시되고, 실제 OAuth나 가짜 세션을 만들지 않는지 확인한다.

### 사용자 스토리 2 구현

- [x] T014 [US2] `src/app/(site)/login/page.js`에 `/images/kakao-icon.svg`와 `/images/google-icon.svg`를 각각 사용하는 간편 로그인 버튼과 제공자별 접근 가능한 이름을 추가한다.
- [x] T015 [US2] `src/app/(site)/login/page.js`에서 간편 로그인 버튼이 `isLoading` 중 비활성화되도록 연결하고 실제 OAuth 이동, 성공 응답 또는 세션 저장은 구현하지 않는다.
- [x] T016 [US2] `src/app/(site)/login/page.module.scss`에 간편 로그인 구분선, 버튼 배치와 데스크톱 `56px`, 태블릿·모바일 `48px` 크기를 반영한다.

**확인 지점**: 두 간편 로그인 버튼의 시각 요소와 상태는 독립적으로 확인할 수 있고 외부 인증은 실행되지 않는다.

### 커밋 경계 3

- 변경 파일: `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`
- 검증: 제공자별 SVG 대응, 접근 가능한 이름, 화면별 크기, OAuth·가짜 인증 미구현 확인
- 권장 커밋: `git commit -m "feat: 소셜 로그인 진입 UI 추가"`

---

## 5단계: 사용자 스토리 3 - 접근 안내와 회원가입 경로 (우선순위: P3)

**목표**: 비로그인 사용자의 회원가입 이동을 제공하고 CommonModal 연결은 실제 인증 연동 단계로 분리한다.

**독립 검증**: 회원가입 링크가 `/signup`으로 이동하고 로그인 페이지가 Header를 중복 렌더링하지 않으며, CommonModal 계약을 변경하지 않았는지 확인한다.

### 사용자 스토리 3 구현

- [x] T017 [US3] `src/app/(site)/login/page.js`에 `/signup`을 가리키는 `Link`와 회원가입 안내 문구를 추가한다.
- [x] T018 [US3] `src/app/(site)/login/page.js`에 실제 로그인 판정과 오류 응답이 없는 동안 `CommonModal`용 임시 상태나 항상 닫힌 표시 경계를 만들지 않고 인증 연동 단계로 이관한다.
- [x] T019 [US3] `src/app/(site)/login/page.module.scss`에 회원가입 안내와 링크 상태 스타일을 반영하고 페이지가 `Header`용 공간이나 Header UI를 중복 생성하지 않도록 확인한다.

**확인 지점**: 회원가입 이동은 동작하고 Header·CommonModal의 기존 책임과 로그인 페이지 책임이 분리되어 있다.

### 커밋 경계 4

- 변경 파일: `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`
- 검증: `/signup` 이동, Header 미렌더링, CommonModal 계약 보존, 실제 사용자·오류 판정 미구현 확인
- 권장 커밋: `git commit -m "feat: 로그인 회원가입 경로 추가"`

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 승인된 UI 범위와 정적 품질을 확인

- [x] T020 `src/app/(site)/login/page.js`와 `src/app/(site)/login/page.module.scss`를 `/login`에서 실행해 `specs/003-login-page/quickstart.md`의 초기 화면·입력 검증·공통 SCSS 시나리오를 수동 검증한다.
- [x] T021 `src/app/(site)/login/page.js`와 `src/app/(site)/login/page.module.scss`를 1320px·1024px·480px에서 확인해 지정 너비·간격·로고·버튼 크기와 통일 스타일을 검증한다.
- [x] T022 `src/app/(site)/login/page.js`에서 Header 중복, 새 공통 React Input·Button, Suspense fallback, `loading.js`, 실제 Supabase·OAuth·세션·가짜 성공 처리가 추가되지 않았는지 범위를 검증한다.
- [x] T023 `src/app/(site)/login/page.js`, `src/app/(site)/login/page.module.scss`, `src/styles/abstracts/_mixins.scss`를 대상으로 `npm run lint`를 실행하고 로그인 작업 관련 오류를 해결한다.

### 커밋 경계 5

- 변경 파일: 검증 중 수정이 필요한 로그인 범위 파일만 포함
- 검증: 수동 반응형 시나리오와 `npm run lint` 통과; production build는 실행하지 않음
- 권장 커밋: `git commit -m "chore: 로그인 페이지 UI 검증 완료"`

---

## 의존성과 실행 순서

### 단계 의존성

- 준비 단계(T001~T003)는 즉시 시작한다.
- 공통 mixin(T004~T006)을 완료한 뒤 로그인 전용 스타일을 작성한다.
- 사용자 스토리 1(T007~T013)이 로그인 페이지의 기본 구조를 생성한다.
- 사용자 스토리 2(T014~T016)와 사용자 스토리 3(T017~T019)는 기본 페이지가 생성된 뒤 순서대로 같은 파일에 추가한다.
- 최종 검증(T020~T023)은 구현 대상 스토리를 모두 완료한 뒤 실행한다.

### 사용자 스토리 의존성

- **사용자 스토리 1(P1)**: T004~T006 완료 후 독립적인 MVP로 구현하고 검증할 수 있다.
- **사용자 스토리 2(P2)**: T007에서 생성한 로그인 페이지 구조에 의존하지만 실제 이메일 로그인 동작에는 의존하지 않는다.
- **사용자 스토리 3(P3)**: T007에서 생성한 로그인 페이지 구조에 의존하며 소셜 로그인 UI와는 독립적이다.

### 병렬 실행 기회

- T003은 코드 수정 없이 자산을 확인하므로 T001~T002와 병렬로 수행할 수 있다.
- 나머지 구현 작업은 동일한 `_mixins.scss`, `page.js`, `page.module.scss`를 순차적으로 수정하므로 병렬 표시하지 않는다.

## 구현 전략

### MVP 우선

1. T001~T006으로 범위와 공통 SCSS 기반을 확정한다.
2. T007~T013으로 이메일 로그인 UI, 검증, Loading 배치와 반응형 화면을 완성한다.
3. 커밋 경계 2에서 실제 인증 없이 사용자 스토리 1을 독립 검증한다.

### 점진적 제공

1. MVP 이후 T014~T016으로 소셜 로그인 진입 UI를 추가한다.
2. T017~T019로 회원가입 경로를 추가하고 CommonModal 연결을 인증 연동 단계로 분리한다.
3. T020~T023으로 수동 검증과 lint를 완료한다.

## 참고

- 각 커밋 경계에서 사용자가 직접 커밋한 뒤 다음 단계로 진행할 수 있다.
- `src/components/CommonModal.jsx`, `src/components/Loading.jsx`, `src/components/Header.jsx`, `src/app/(site)/layout.js`는 수정하지 않는다.
- `src/app/(site)/login/loading.js` 또는 다른 경로의 `loading.js`를 생성하지 않는다.
- 실제 인증이 연결되기 전에는 인증 성공·실패를 흉내 내는 Promise나 임시 세션을 추가하지 않는다.
- production build는 이번 작업 목록에 포함하지 않는다.
