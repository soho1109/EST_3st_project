# 작업 목록: 요약 노트 비밀번호 모달

**입력**: `/specs/004-note-password-modal/`의 설계 문서

**필수 문서**: `plan.md`, `spec.md`

**참고 문서**: `research.md`, `data-model.md`, `contracts/NotePwModal.md`, `quickstart.md`

**테스트**: 자동 테스트는 요청되지 않았다. `/dev/notepwmodal`의 독립 검증 시나리오와 lint, build로 검증한다.

**구성**: `NotePwModal`의 세 사용자 스토리를 우선순위대로 구현하되 실제 백엔드, API, 세션 인증, 서비스 페이지 이동 및 현재 존재하지 않는 `CommonModal` 구현은 포함하지 않는다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 다른 파일에서 선행 작업과 충돌하지 않고 병렬로 수행할 수 있는 작업에만 표시
- **[US#]**: 사용자 스토리 단계의 작업에만 표시
- 모든 구현 작업에는 정확한 파일 경로와 완료 조건을 포함

## 1단계: 준비

**목적**: 구현 범위와 기존 프로젝트 자원을 확인하고 임의 구현을 방지한다.

- [x] T001 `AGENTS.md`, `.specify/memory/constitution.md`, `specs/004-note-password-modal/spec.md`, `specs/004-note-password-modal/plan.md`, `specs/004-note-password-modal/contracts/NotePwModal.md`를 다시 확인해 승인된 세 소스 파일과 props 계약을 구현 기준으로 확정한다.
- [x] T002 [P] `src/styles/abstracts/_colors.scss`, `src/styles/abstracts/_variables.scss`, `src/styles/abstracts/_mixins.scss`, `src/styles/abstracts/_typography.scss`, `src/app/layout.js`를 확인해 재사용 가능한 디자인 토큰과 Material Symbols 제공 상태를 기록하고 새 전역 스타일이나 패키지가 필요하지 않은지 확인한다.
- [x] T003 [P] `src/components`, `src/app/(dev)/dev/page.js` 및 `src/app/(dev)/dev/layout.js`를 확인해 `NotePwModal`·`CommonModal` 중복 구현 여부와 기존 `/dev` 파일을 수정하지 않는 범위를 재확인한다.

---

## 2단계: 공통 선행 작업

**목적**: 모든 사용자 스토리가 사용할 최소 컴포넌트 및 개발 확인 화면의 뼈대를 준비한다.

- [x] T004 `src/components/NotePwModal.jsx`에 `"use client"`, `NotePwModal` 기본 export, `isOpen`, `isSubmitting`, `errorMessage`, `onSubmit`, `onClose` props 기본 계약과 `isOpen=false`일 때 렌더링하지 않는 컴포넌트 뼈대를 작성한다.
- [x] T005 `src/components/NotePwModal.module.scss`를 생성하고 `NotePwModal.jsx`에서 SCSS Module을 불러오는 연결만 준비하며 전역 스타일은 변경하지 않는다.
- [x] T006 `src/app/(dev)/dev/notepwmodal/page.js`를 Client Component로 생성하고 `NotePwModal`을 import해 열림 상태와 개발용 결과 선택 상태를 관리하는 확인 화면 뼈대를 작성하되 `src/app/(dev)/dev/page.js`는 수정하지 않는다.

**확인 지점**: 승인된 세 파일만 생성되고 `/dev/notepwmodal` 경로가 컴파일될 준비가 완료됨

---

## 3단계: 사용자 스토리 1 - 잠긴 요약 노트 인증 (우선순위: P1) 🎯 MVP

**목표**: 사용자가 차단 배경 위의 모달에서 마스킹된 비밀번호를 버튼 또는 Enter로 한 번 제출하고, 검증 중에는 중복 제출할 수 없게 한다.

**독립 검증**: `/dev/notepwmodal`에서 모달을 열어 배경 클릭 차단, 빈 값 제출 방지, 버튼·Enter의 동일한 단일 제출, 제출 중 입력·버튼 비활성화를 확인한다. 성공 목 결과는 모달을 닫되 실제 서비스 경로로 이동하거나 세션을 저장하지 않는다.

### 사용자 스토리 1 구현

- [x] T007 [US1] `src/components/NotePwModal.jsx`에 `password` 내부 상태, 제어 입력, `type="password"`, 잠금 아이콘, 제목·레이블·placeholder·제출 문구, `<form onSubmit>` 기반 `handleSubmit`을 구현하고 빈 값·공백 값·`isSubmitting` 중 제출을 차단한 뒤 유효한 제출 직후 입력을 초기화한다.
- [x] T008 [US1] `src/components/NotePwModal.jsx`에 대화상자 이름 연결, 입력 레이블, 장식 아이콘 숨김, 제출 상태 비활성 속성을 적용해 기본 접근성 계약을 구현한다.
- [x] T009 [US1] `src/components/NotePwModal.module.scss`에 전체 화면 고정 배경막, 중앙 정렬된 흰색 둥근 모달, 베이지색 입력 영역, 주황색 전체 너비 제출 버튼과 명세의 데스크톱 배치를 기존 색상·타이포그래피 토큰으로 구현한다.
- [x] T010 [US1] `src/app/(dev)/dev/notepwmodal/page.js`에 모달 열기, 성공 목 결과, 지연된 제출 상태를 연결해 `isOpen`, `isSubmitting`, `onSubmit` 계약과 중복 제출 차단을 실제 API 없이 검증할 수 있게 한다.
- [x] T011 [US1] `specs/004-note-password-modal/quickstart.md`의 기본 디자인, 버튼 제출, Enter 제출, 빈 값 제출, 검증 중 중복 제출 시나리오를 `/dev/notepwmodal`에서 수행하고 각 기대 결과를 확인한다.

**확인 지점**: 사용자 스토리 1만으로 모달의 핵심 입력·제출 흐름을 독립 실행하고 검증할 수 있음

---

## 4단계: 사용자 스토리 2 - 잘못된 비밀번호 재입력 (우선순위: P2)

**목표**: 잘못된 비밀번호 결과를 모달 내부에서 안내하고, 비워진 입력으로 같은 오류를 반복해서 재시도할 수 있게 한다.

**독립 검증**: `/dev/notepwmodal`에서 불일치 목 결과를 연속 두 번 선택해 매 제출 직후 입력값이 비워지고 `비밀번호가 일치하지 않습니다.`가 표시되며 모달이 유지되는지 확인한다.

### 사용자 스토리 2 구현

- [x] T012 [US2] `src/components/NotePwModal.jsx`에 `errorMessage` 인라인 렌더링, 입력과 오류 설명 연결, 오류 알림 접근성 속성을 추가하고 오류 상태에서도 입력 및 재제출이 가능하게 한다.
- [x] T013 [US2] `src/components/NotePwModal.module.scss`에 디자인 흐름을 깨뜨리지 않는 인라인 오류 문구와 오류 상태 간격·색상을 기존 토큰으로 추가한다.
- [x] T014 [US2] `src/app/(dev)/dev/notepwmodal/page.js`에 비밀번호 불일치 목 결과를 연결해 모달 유지, 정확한 오류 문구 전달, 반복 재시도를 검증할 수 있게 한다.
- [x] T015 [US2] `specs/004-note-password-modal/quickstart.md`의 비밀번호 불일치 시나리오를 같은 오류로 두 번 연속 수행해 입력 초기화, 오류 표시, 재제출 가능 여부를 확인한다.

**확인 지점**: 사용자 스토리 2가 실제 백엔드 없이 독립적으로 반복 검증됨

---

## 5단계: 사용자 스토리 3 - 모달 닫기 및 서버 오류 처리 (우선순위: P3)

**목표**: 사용자가 명시적 닫기 버튼으로 원래 확인 화면에 머물고, 시스템 오류 목 결과가 모달 밖의 호출 측 책임으로 전달되게 한다.

**독립 검증**: `/dev/notepwmodal`에서 닫기 버튼, 배경막 클릭, 시스템 오류 목 결과를 각각 실행해 입력 초기화·현재 경로 유지·배경막 비종료·모달 종료·호출 측 오류 상태 전달을 확인한다. `CommonModal` 표시는 해당 컴포넌트 준비 전까지 검증에서 제외한다.

### 사용자 스토리 3 구현

- [x] T016 [US3] `src/components/NotePwModal.jsx`에 접근 가능한 이름을 가진 Material `close` 버튼과 `handleClose`를 구현해 입력 초기화 후 `onClose`를 한 번 호출하고, 배경막 클릭은 닫기나 뒤쪽 페이지 동작으로 전달되지 않게 한다.
- [x] T017 [US3] `src/components/NotePwModal.module.scss`에 우측 상단 닫기 버튼의 배치와 상호작용 상태를 기존 디자인 토큰으로 구현하고 배경막이 뒤쪽 페이지의 포인터 상호작용을 완전히 차단하게 한다.
- [x] T018 [US3] `src/app/(dev)/dev/notepwmodal/page.js`에 닫기 결과와 시스템 오류 목 결과를 연결해 실제 API 없이 모달 종료 및 호출 측 오류 상태 수신을 확인하되 `CommonModal`, 세션 저장, 서비스 라우팅은 구현하지 않는다.
- [x] T019 [US3] `specs/004-note-password-modal/quickstart.md`의 닫기 및 시스템 오류 연결 시나리오를 수행해 `/dev/notepwmodal` 경로 유지와 호출 측 상태 전달을 확인하고, `CommonModal` 통합은 후속 의존 작업으로 남긴다.

**확인 지점**: 세 사용자 스토리를 각각 독립적으로 검증할 수 있고 모달과 호출 측 책임이 분리됨

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 승인된 기능 범위 전체의 품질과 프로젝트 규칙 준수를 확인한다.

- [x] T020 `src/components/NotePwModal.jsx`, `src/components/NotePwModal.module.scss`, `src/app/(dev)/dev/notepwmodal/page.js`를 검토해 PascalCase·camelCase·handle/is 접두사·kebab-case·SCSS Module 대괄호 접근 규칙과 승인된 props 계약 준수를 확인한다.
- [x] T021 `npm run lint`를 실행해 `src/components/NotePwModal.jsx`와 `src/app/(dev)/dev/notepwmodal/page.js`를 포함한 lint 오류가 없는지 확인한다.
- [x] T022 `npm run build`를 실행해 `/dev/notepwmodal` 및 `NotePwModal`이 Next.js production build에서 정상 컴파일되는지 확인한다.
- [x] T023 `specs/004-note-password-modal/quickstart.md`의 전체 수동 시나리오를 순서대로 수행하고 백엔드·API·세션 인증·서비스 이동·`CommonModal` 구현이 변경 범위에 포함되지 않았는지 최종 확인한다.
- [x] T024 `git diff -- src/components/NotePwModal.jsx src/components/NotePwModal.module.scss 'src/app/(dev)/dev/notepwmodal/page.js' 'src/app/(dev)/dev/page.js'`로 승인된 세 파일만 구현 변경되었고 기존 `src/app/(dev)/dev/page.js`가 수정되지 않았는지 확인한다.

---

## 의존성과 실행 순서

### 단계 의존성

- 준비 단계(T001~T003)는 즉시 시작하며 모두 완료한 뒤 공통 선행 작업을 진행한다.
- 공통 선행 작업(T004~T006)은 사용자 스토리 구현의 파일 뼈대이므로 모두 완료되어야 한다.
- 사용자 스토리 1(T007~T011)은 MVP이며 사용자 스토리 2와 3보다 먼저 완료한다.
- 사용자 스토리 2(T012~T015)는 사용자 스토리 1의 입력·제출 계약을 확장한다.
- 사용자 스토리 3(T016~T019)은 사용자 스토리 1의 모달과 개발 확인 화면을 확장한다.
- 최종 검증(T020~T024)은 모든 구현 작업이 끝난 후 수행한다.

### 사용자 스토리 의존성

- **사용자 스토리 1(P1)**: T004~T006에만 의존하며 독립적인 MVP다.
- **사용자 스토리 2(P2)**: T007의 제출 후 입력 초기화와 T010의 목 제출 흐름에 의존한다.
- **사용자 스토리 3(P3)**: T007의 내부 입력 상태와 T010의 호출 측 상태 구조에 의존한다.
- **후속 통합**: 실제 비밀번호 검증, 동일 브라우저 세션 인증, 성공 후 서비스 이동, `CommonModal` 표시는 현재 작업 이후 별도 기능에서 처리한다.

## 병렬 실행 예시

동일 파일을 순차적으로 확장하므로 구현 단계의 병렬 작업은 제한한다. 준비 단계에서는 다음 두 확인을 병렬 수행할 수 있다.

```text
T002: 스타일 토큰과 Material Symbols 제공 상태 확인
T003: 기존 컴포넌트 및 /dev 구조와 변경 제외 파일 확인
```

사용자 스토리별 구현은 `NotePwModal.jsx`, `NotePwModal.module.scss`, `notepwmodal/page.js` 사이의 계약이 연결되므로 각 스토리 안에서 번호 순서대로 수행한다.

## 구현 전략

### MVP 우선

1. T001~T006으로 범위와 파일 뼈대를 준비한다.
2. T007~T011로 사용자 스토리 1의 기본 모달과 제출 흐름을 완성한다.
3. `/dev/notepwmodal`에서 MVP를 독립 검증한다.

### 점진적 확장

1. T012~T015로 비밀번호 불일치와 반복 재입력을 추가한다.
2. T016~T019로 명시적 닫기와 시스템 오류 전달을 추가한다.
3. T020~T024로 규칙, lint, build, 전체 시나리오와 변경 범위를 검증한다.

## 참고

- 실제 백엔드, API, 세션 인증, 서비스 페이지 이동은 구현하지 않는다.
- 현재 없는 `CommonModal`을 생성하거나 대체하지 않는다.
- 기존 `src/app/(dev)/dev/page.js`는 수정하지 않는다.
- 모든 작업은 승인된 세 소스 파일과 본 기능의 Spec Kit 문서 범위 안에서 수행한다.
