# 구현 계획: 요약 노트 비밀번호 모달

**브랜치**: `feature/note-password-modal` | **작성일**: 2026-08-07 | **명세**: [spec.md](./spec.md)

**입력**: `/specs/004-note-password-modal/spec.md`의 기능 명세

## 요약

잠긴 요약 노트 접근 전에 표시되는 공통 `NotePwModal`을 Client Component로 설계한다. 컴포넌트는 모달 표시, 비밀번호 입력, 버튼·Enter 제출, 검증 중 비활성화, 비밀번호 불일치 표시와 입력 초기화, 명시적 닫기를 담당한다. 비밀번호 검증, 동일 브라우저 세션의 인증 유지, 성공 후 경로 이동, 시스템 오류 시 `CommonModal` 표시는 호출 측이 담당하며 props 계약으로 연결한다. 백엔드와 `CommonModal`이 아직 준비되지 않았으므로 구체적인 통신 및 저장 방식은 이 계획에서 결정하지 않는다.

## 기술 배경

**언어/버전**: JavaScript (ECMAScript) / 프로젝트의 Next.js 빌드 환경

**주요 의존성**: Next.js 16.2.12, React 19.2.4, Sass 1.102.x, 프로젝트에 이미 적용된 Material Symbols

**저장소**: 컴포넌트 내부의 일시적인 비밀번호 입력 상태만 사용하며 영구 저장소는 사용하지 않음

**테스트**: ESLint, Next.js production build, `/dev/notepwmodal` 전용 확인 화면을 이용한 수동 인수 시나리오 검증

**대상 플랫폼**: 데스크톱 웹 브라우저

**프로젝트 유형**: Next.js App Router 웹 애플리케이션

**성능 목표**: 제출 한 번당 검증 요청 한 번만 전달하고 검증 중 중복 제출 0건을 보장

**제약 사항**: 백엔드 검증 API와 세션 인증 저장 방식은 미정이며 임의 구현하지 않음. 현재 `CommonModal.jsx`가 존재하지 않으므로 오류 모달 자체를 이번 기능에서 생성하지 않음. 제공된 데스크톱 디자인만 대상으로 함

**작업 규모**: 공통 컴포넌트 1개, 대응 SCSS Module 1개, 백엔드 없이 상태를 검증하는 개발 전용 확인 페이지 1개. 향후 전체 요약 목록과 요약 상세 계열 호출 화면에서 재사용

## 헌법 점검

*관문: 0단계 조사 전과 1단계 설계 후 모두 확인했다.*

- [x] `AGENTS.md`, 관련 명세, Constitution, 기존 코드를 확인했다.
- [x] Next.js App Router, JavaScript, SCSS, `@/*` 별칭을 유지한다.
- [x] 승인되지 않은 의존성, 폴더, 데이터 통신 구조를 추가하지 않는다.
- [x] 기존 공통 컴포넌트 재사용 여부와 변경 영향 범위를 확인했다.
- [x] 한 가지 기능과 승인된 파일 범위만 다룬다.
- [x] 모든 Spec Kit 산출물을 한국어로 작성한다.

**사전 설계 판정**: 통과. 백엔드 및 세션 구조는 결정하지 않고 외부 계약으로 남긴다.

**설계 후 재점검**: 통과. 새 의존성·폴더·통신 구조를 추가하지 않았으며 현재 없는 `CommonModal`을 임의 구현 범위에 포함하지 않았다.

## 프로젝트 구조

### 이 기능의 문서

```text
specs/004-note-password-modal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── NotePwModal.md
└── tasks.md              # /speckit-tasks 단계에서 생성
```

### 소스 코드

```text
src/
├── app/
│   └── (dev)/
│       └── dev/
│           └── notepwmodal/
│               └── page.js
│
└── components/
    ├── NotePwModal.jsx
    └── NotePwModal.module.scss
```

`src/app/(dev)/dev/page.js`는 수정하지 않는다. `notepwmodal/page.js`는 컴포넌트 검증을 위한 개발 전용 호출 화면이며 실제 서비스 경로, 비밀번호 검증 API 또는 세션 인증을 구현하지 않는다. 서비스 통합 단계에서는 실제 호출 위치와 `CommonModal` 준비 여부를 다시 확인한다.

**구조 결정**: `AGENTS.md`에 정의된 대로 공통 컴포넌트를 `src/components`에 파일 단위로 배치하고 동일 이름의 SCSS Module을 사용한다. 사용자가 승인한 개발 확인용 경로 `src/app/(dev)/dev/notepwmodal/page.js`만 추가한다. 상태 관리 라이브러리와 데이터 요청 계층은 추가하지 않는다.

## 컴포넌트 설계

### 책임 분리

- `NotePwModal`: 입력값, 폼 제출, 인라인 오류 표시, 닫기 조작, 비활성 상태와 배경 상호작용 차단을 담당한다.
- 호출 측: 모달 공개 상태, 비밀번호 검증 요청, 성공 후 이동, 같은 브라우저 세션 인증 유지, 시스템 오류 시 공통 오류 모달 표시를 담당한다.
- `CommonModal`: 시스템 오류의 시각적 안내를 담당할 예정이지만 현재 파일이 없으므로 이 기능에서 생성하거나 동작을 추정하지 않는다.

### 상태와 이벤트

- 모달 내부 상태: `password`
- 호출 측 입력 props: `isOpen`, `isSubmitting`, `errorMessage`
- 호출 측 콜백 props: `onSubmit(password)`, `onClose()`
- `<form onSubmit>` 하나로 버튼과 Enter 제출을 통합한다.
- 빈 문자열 및 공백만 있는 값은 제출하지 않는다.
- `isSubmitting`이 참이면 입력과 제출 버튼을 비활성화하고 재호출을 차단한다.
- 유효한 비밀번호를 `onSubmit`에 전달한 직후 입력값을 초기화한다. 따라서 같은 오류가 반복되어도 재입력 상태가 보장된다.
- 닫기 시 입력값을 초기화하고 `onClose`를 호출한다.
- 배경막 클릭은 이벤트를 뒤쪽 페이지에 전달하지 않으며 닫기 콜백도 호출하지 않는다.

### 시각 및 접근성

- 제공된 Figma 노드와 스크린샷의 중앙 배치, 회색 배경막, 흰색 둥근 모달, 베이지색 입력 영역, 주황색 전체 너비 제출 버튼을 따른다.
- 우측 상단 닫기 버튼에는 Material `close`, 입력에는 Material 잠금 아이콘을 사용한다.
- 비밀번호 입력은 `type="password"`로 표시한다.
- 모달 영역은 대화상자임을 전달하고 제목 및 오류 문구와 연결한다.
- 아이콘만 있는 닫기 버튼에는 접근 가능한 이름을 제공한다.

## 통합 경계

- 올바른 비밀번호: 호출 측 검증 성공 → 모달 닫기 → 해당 요약 노트의 요청 경로 이동.
- 잘못된 비밀번호: 제출 직후 입력 초기화 → 호출 측이 `errorMessage` 전달 → 모달 유지 및 인라인 오류 표시.
- 서버·네트워크 오류: 호출 측이 `isOpen`을 거짓으로 전환 → 원래 페이지에서 `CommonModal` 표시.
- 같은 브라우저 세션 인증: 호출 측 또는 향후 인증 계층의 책임이며 모달은 저장소에 직접 접근하지 않는다.

## 개발 전용 확인 페이지

- 경로: `src/app/(dev)/dev/notepwmodal/page.js`
- URL: `/dev/notepwmodal`
- 목적: `NotePwModal`의 기본, 제출 중, 비밀번호 불일치, 닫기, 시스템 오류 전달 상태를 실제 백엔드 없이 확인한다.
- 목 동작: 정해진 개발용 입력 결과에 따라 성공·불일치·시스템 오류 상태를 재현하되 실제 인증 결과를 저장하거나 서비스 경로로 이동하지 않는다.
- 제한: 제품 페이지에서 사용하는 API, 세션 저장, 라우팅 구조를 추정하거나 구현하지 않는다.
- 기존 `src/app/(dev)/dev/page.js`는 변경하지 않는다.

## 복잡성 기록

헌법을 위반하는 예외는 없다.

## 1단계 이후 산출물

- [research.md](./research.md): Client Component 경계, 폼 제출, 상태 소유권, 오류 연결 방식 결정
- [data-model.md](./data-model.md): 입력·제출·오류·호출 문맥 상태 모델
- [contracts/NotePwModal.md](./contracts/NotePwModal.md): 재사용 가능한 UI props 및 이벤트 계약
- [quickstart.md](./quickstart.md): 구현 후 검증 절차와 기대 결과
