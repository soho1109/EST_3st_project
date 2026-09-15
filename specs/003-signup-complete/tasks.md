# 작업 목록: 회원가입 완료 페이지

**입력**: `specs/003-signup-complete/`의 설계 문서

**필수 문서**: `plan.md`, `spec.md`

**참고 문서**: `research.md`, `data-model.md`, `contracts/SignupCompletePage.md`, `quickstart.md`

**테스트**: 자동 테스트나 TDD는 요청되지 않았다. 각 사용자 스토리에서 수동 검증을 수행하고 마지막에 lint를 실행한다.

**구성**: 핵심 완료 안내와 로그인 이동을 MVP로 먼저 구현하고, 반응형 스타일을 별도 단위로 추가한 뒤 전체 범위를 검증한다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 다른 파일에서 선행 작업 없이 병렬로 수행할 수 있는 작업에만 표시
- **[US#]**: 사용자 스토리 단계의 작업에만 표시
- 모든 작업에는 확인하거나 변경할 정확한 파일 경로를 포함한다.

## 1단계: 준비

**목적**: 구현 전 명세, 소유권과 재사용 대상을 확인한다.

- [x] T001 `AGENTS.md`, `.specify/memory/constitution.md`, `specs/003-signup-complete/spec.md`, `specs/003-signup-complete/plan.md`에서 구현 범위와 금지 사항을 확인한다.
- [x] T002 `specs/003-signup-complete/research.md`, `specs/003-signup-complete/data-model.md`, `specs/003-signup-complete/contracts/SignupCompletePage.md`, `specs/003-signup-complete/quickstart.md`에서 확정 문구·경로·검증 기준을 확인한다.
- [x] T003 `public/images/fbee.webp`, `src/app/(site)/layout.js`, `src/styles/abstracts/_colors.scss`, `src/styles/abstracts/_typography.scss`를 확인하고 자산과 공통 스타일만 재사용하며 Header와 레이아웃은 수정하지 않음을 기록한다.

**확인 지점**: 구현 대상이 `src/app/(site)/signup/complete/page.js`와 `src/app/(site)/signup/complete/page.module.scss`로 제한되고, 새 패키지·공통 컴포넌트·인증 구조가 필요하지 않음을 확인한다.

---

## 2단계: 공통 선행 작업

**목적**: 별도의 공통 선행 작업이 없는 단순 정적 페이지임을 유지한다.

이 기능에는 사용자 스토리보다 먼저 구현할 공통 모델, 서비스, API 또는 기반 구조가 없다. 준비 단계 완료 후 사용자 스토리 1을 바로 시작한다.

---

## 3단계: 사용자 스토리 1 - 가입 완료 확인과 로그인 이동 (우선순위: P1) 🎯 MVP

**목표**: 사용자가 회원가입 완료 정보와 마스코트를 확인하고 한 번의 선택으로 `/login`에 이동할 수 있게 한다.

**독립 검증**: `/signup/complete`에서 제목, 프비 이미지, 원형 배경, 두 줄 안내와 로그인 Link를 확인하고 마우스와 키보드로 `/login`에 이동한다.

### 사용자 스토리 1 구현

- [x] T004 [US1] `src/app/(site)/signup/complete/page.js`에 상태 없는 Server Component를 만들고 `h1`, 프비 이미지, 두 줄 안내와 `/login` Link를 의미 순서대로 작성한다.
- [x] T005 [US1] `src/app/(site)/signup/complete/page.js`에서 `next/image`로 `/images/fbee.webp`를 의미 있는 대체 텍스트와 기준 크기로 표시하고 `next/link`로 현재 탭 내부 이동을 구성한다.
- [x] T006 [US1] `src/app/(site)/signup/complete/page.module.scss`에 데스크톱 중앙 배치, 화면 배경, 제목·안내 타이포그래피, `radial-gradient`, 이미지 비율 보존과 56px 로그인 이동 영역 스타일을 작성한다.
- [x] T007 [US1] `src/app/(site)/signup/complete/page.module.scss`에서 프비 이미지에만 `transform` 기반으로 `0`에서 `-18px` 사이를 이동하는 약 2.8초의 느린 무한 왕복 애니메이션을 적용하고 `prefers-reduced-motion: reduce`에서는 중지한다.
- [x] T008 [US1] `src/app/(site)/signup/complete/page.module.scss`에 로그인 Link의 식별 가능한 키보드 포커스 스타일을 추가한 뒤 `src/app/(site)/signup/complete/page.js`와 함께 실행해 원형 배경·문구·Link는 고정되고 프비만 움직이는지, 모션 감소 시 정지하는지와 `/login` 이동을 수동 검증한다.

**확인 지점**: 사용자 스토리 1만으로 가입 완료 안내와 로그인 이동이 가능한 MVP가 완성된다.

### 커밋 경계 1

- 대상: `src/app/(site)/signup/complete/page.js`, `src/app/(site)/signup/complete/page.module.scss`, 완료 처리한 `specs/003-signup-complete/tasks.md`
- 권장 커밋 메시지: `feat: 회원가입 완료 안내와 로그인 이동 구현`
- 사용자가 직접 커밋을 완료한 뒤 사용자 스토리 2로 진행한다.

---

## 4단계: 사용자 스토리 2 - 기기별 완료 화면 확인 (우선순위: P2)

**목표**: 데스크톱, 태블릿과 모바일에서 완료 콘텐츠를 중앙에 유지하고 잘림·왜곡·겹침 없이 표시한다.

**독립 검증**: 1320px, 1024px, 480px와 기준 사이 너비에서 제목·이미지·안내·로그인 이동 영역의 크기와 순서, 좌우 여백, 가로 스크롤 여부를 확인한다.

### 사용자 스토리 2 구현

- [x] T009 [US2] `src/app/(site)/signup/complete/page.module.scss`에 1024px 태블릿 기준의 제목 36px, 중앙 마스코트·그라디언트, 안내 20px와 화면 가용 너비 안의 로그인 이동 영역을 작성한다.
- [x] T010 [US2] `src/app/(site)/signup/complete/page.module.scss`에 480px 모바일 기준의 좌우 20px 여백, 제목 24px, 안내 16px, 축소된 마스코트·그라디언트와 최대 440px 로그인 이동 영역을 작성한다.
- [x] T011 [US2] `src/app/(site)/signup/complete/page.module.scss`에서 유연한 너비, `max-width`, 자동 높이와 최소 여백을 조정해 기준 사이 화면에서도 가로 넘침·이미지 왜곡·요소 겹침이 없게 한다.
- [x] T012 [US2] `src/app/(site)/signup/complete/page.js`와 `src/app/(site)/signup/complete/page.module.scss`를 1320px, 1024px, 480px 및 중간 너비에서 실행해 Figma 배치, 두 줄 문구, 이미지 비율과 가로 스크롤 부재를 수동 검증한다.

**확인 지점**: 사용자 스토리 1과 2가 결합되어 모든 기준 화면에서 동일한 완료 흐름을 제공한다.

### 커밋 경계 2

- 대상: `src/app/(site)/signup/complete/page.module.scss`, 완료 처리한 `specs/003-signup-complete/tasks.md`
- 권장 커밋 메시지: `style: 회원가입 완료 페이지 반응형 디자인 적용`
- 사용자가 직접 커밋을 완료한 뒤 최종 검증으로 진행한다.

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 승인된 기능 범위와 코드 품질을 최종 확인한다.

- [x] T013 `src/app/(site)/signup/complete/page.js`와 `src/app/(site)/signup/complete/page.module.scss`에서 실제 회원가입 완료 여부 판정, Loading, Suspense, `loading.js`, 자체 자동 이동·타이머와 승인되지 않은 추가 애니메이션이 없는지 확인한다. 로그인 사용자 접근은 기존 CommonModal의 `alreadyLoggedIn` 계약을 사용한다.
- [x] T017 회원가입 성공 시 현재 탭에 완료 시각을 기록하고 `/signup/complete`에서 5분 유효성을 검사해 표식 없는 비로그인 접근에 상태 `403` CommonModal을 표시한 뒤 `/signup`으로 이동시킨다.
- [x] T014 `src/app/(site)/signup/complete/page.js`, `src/app/(site)/signup/complete/page.module.scss`, `src/app/(site)/layout.js`, `src/components/Header.jsx`를 비교해 페이지가 Header를 직접 렌더링하지 않고 공통 파일을 수정하지 않았는지 확인한다.
- [x] T015 `specs/003-signup-complete/quickstart.md`의 기능·반응형·키보드 검증 시나리오를 모두 실행하고 결과를 `specs/003-signup-complete/tasks.md` 체크박스에 반영한다.
- [x] T016 프로젝트 루트에서 `npm run lint`를 실행하고 회원가입 완료 페이지 관련 오류가 없는지 확인한 뒤 결과를 `specs/003-signup-complete/tasks.md`에 반영한다.

### 커밋 경계 3

- 대상: 최종 검증 결과가 반영된 `specs/003-signup-complete/tasks.md`
- 권장 커밋 메시지: `chore: 회원가입 완료 페이지 검증 완료`
- production build는 이번 작업 범위에 포함하지 않는다.

---

## 의존성과 실행 순서

### 단계 의존성

- 준비 단계 T001~T003은 즉시 시작하며 순서대로 범위를 확인한다.
- 별도 공통 선행 구현은 없다.
- 사용자 스토리 1 T004~T008은 준비 단계가 끝난 뒤 순서대로 수행한다.
- 사용자 스토리 2 T009~T012는 사용자 스토리 1의 마크업과 데스크톱 스타일을 기준으로 수행한다.
- 최종 검증 T013~T016은 두 사용자 스토리가 모두 완료된 뒤 수행한다.

### 사용자 스토리 의존성

- **사용자 스토리 1(P1)**: 다른 스토리에 의존하지 않는 MVP다.
- **사용자 스토리 2(P2)**: 사용자 스토리 1에서 만든 같은 페이지와 SCSS Module에 반응형 스타일을 추가하므로 T004~T008 완료 후 시작한다.

### 병렬 실행 가능성

대상 소스가 두 파일뿐이고 SCSS 클래스가 먼저 작성한 마크업에 의존하므로 안전한 구현 병렬 작업은 없다. 같은 파일을 동시에 수정해 충돌시키지 않고 작은 단위로 순차 실행한다.

## 구현 전략

### MVP 우선

1. T001~T003으로 범위와 자산을 확인한다.
2. T004~T008로 데스크톱 기준 완료 안내와 `/login` 이동을 완성한다.
3. 첫 번째 커밋 경계에서 사용자 검증과 커밋을 기다린다.

### 점진적 전달

1. T009~T012로 태블릿·모바일과 중간 화면을 추가한다.
2. 두 번째 커밋 경계에서 반응형 검증과 커밋을 기다린다.
3. T013~T016으로 범위 위반, 전체 수동 시나리오와 lint를 검증한다.
4. 세 번째 커밋 경계에서 문서 체크 상태만 최종 반영한다.

## 참고

- 모든 구현 작업은 `- [ ] T### [P?] [US#?] 설명` 형식을 지킨다.
- 실제 인증·Supabase·완료 판정·세션·모달·로딩과 승인된 프비 상하 이동 외의 애니메이션은 후속 명세 없이는 추가하지 않는다.
- 구현 중 공통 Header 변경이 필요해 보이면 작업을 멈추고 영향 범위를 사용자에게 알린다.
- git commit과 git push는 사용자가 직접 수행한다.
