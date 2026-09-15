---
description: "공통 모달 기능 구현을 위한 작업 목록"
---

# 작업 목록: 공통 모달

**입력**: `/specs/005-common-modal/`의 설계 문서

**필수 문서**: `spec.md`, `plan.md`

**참고 문서**: `research.md`, `data-model.md`, `contracts/CommonModal.md`, `quickstart.md`

**테스트 방식**: 별도 자동화 테스트 도입 없이 `/dev/commonmodal` 수동 시나리오, ESLint, production build로 검증한다.

**구성**: 작은 기능 단위로 구현·검증하며 각 사용자 스토리 완료 지점을 독립 커밋 경계로 사용한다. 작업 완료 직후 해당 체크박스를 갱신한다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 선행 작업 완료 후 서로 다른 파일에서 독립적으로 수행 가능한 작업
- **[US#]**: `spec.md`의 사용자 스토리 번호
- 모든 작업은 승인된 파일 범위와 정확한 경로를 포함한다.

## 1단계: 준비

**목적**: 구현 범위, 계약과 기존 구조를 변경 전에 확정

- [x] T001 `AGENTS.md`, `.specify/memory/constitution.md`, `specs/005-common-modal/spec.md`, `specs/005-common-modal/plan.md`를 확인하고 현재 브랜치가 `feature/common-modal`인지 검증한다.
- [x] T002 `specs/005-common-modal/research.md`, `specs/005-common-modal/data-model.md`, `specs/005-common-modal/contracts/CommonModal.md`, `specs/005-common-modal/quickstart.md`에서 props, 모드, 오류 문구, 검증 기준을 확인한다.
- [x] T003 기존 `src/components/NotePwModal.jsx`, `src/components/NotePwModal.module.scss`, `src/styles/abstracts/`, `public/images/fbee.webp`를 확인하고 재사용할 패턴과 자산만 기록한다.

**확인 지점**: 생성할 소스 파일 3개와 수정 금지 파일이 확정되고 명세 충돌을 임의로 구현하지 않은 상태

---

## 2단계: 공통 선행 작업

**목적**: 모든 사용자 스토리가 공유하는 모달 구조와 개발 확인 기반 작성

- [x] T004 [P] 공통 배경막, 흰색 모달 컨테이너, 프비 이미지 영역, 닫기 버튼, 문구와 버튼 영역의 기본 스타일을 `src/components/CommonModal.module.scss`에 작성한다.
- [x] T005 [P] `isOpen`, `mode`, `status`, `onClose`, `onConfirm` 계약과 `isOpen=false` 반환, dialog 의미 구조, 프비 이미지, Material `close` 버튼을 갖춘 `src/components/CommonModal.jsx` 기본 골격을 작성한다.
- [x] T006 T004와 T005의 클래스 연결을 확인하고 배경막 클릭 및 Escape에 닫기 동작을 등록하지 않으며 뒤쪽 포인터 상호작용이 차단되도록 `src/components/CommonModal.jsx`와 `src/components/CommonModal.module.scss`를 정리한다.
- [x] T007 하나의 `CommonModal` 인스턴스, `isOpen` 상태, `mode` 선택과 결과 문구만 제공하는 개발 확인 골격을 `src/app/(dev)/dev/commonmodal/page.js`에 작성하고 `src/app/(dev)/dev/page.js`는 수정하지 않는다.

**확인 지점**: `/dev/commonmodal`에서 빈 공통 모달 골격을 한 개만 열고 닫을 수 있으며 공통 구조가 이후 모드를 수용할 수 있음

**커밋 경계 제안**: 공통 골격과 개발 확인 기반

---

## 3단계: 사용자 스토리 1 - 공통 안내 모드 이용 (우선순위: P1) 🎯 MVP

**목표**: 준비 중, 선택형 로그인 안내, 보호 경로 로그인 안내와 이미 로그인된 안내를 일관된 모달로 제공

**독립 검증**: `preparing`, `suggestLogin`, `requireLogin`, `alreadyLoggedIn`을 차례로 표시해 문구, 버튼, 닫기, 고정 링크와 3초 자동 이동이 계약과 일치하는지 확인

### 사용자 스토리 1 구현

- [x] T008 [US1] `preparing`의 고정 문구와 `onClose` 기반 현재 페이지 유지 동작을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T009 [US1] `suggestLogin`의 고정 문구, `/login` 및 `/summary` `Link`, `onClose` 동작을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T010 [US1] 자동 이동 모드의 목적지 설정과 `useEffect` 3초 단일 타이머·정리 로직을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T011 [US1] `requireLogin`의 3초 후 `/login` 이동과 닫기 시 즉시 `/login` 이동을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T012 [US1] `alreadyLoggedIn`의 3초 후 `/` 이동과 닫기 시 즉시 `/` 이동을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T013 [US1] 네 안내 모드를 선택·재공개하고 결과를 확인할 수 있도록 `src/app/(dev)/dev/commonmodal/page.js`의 개발 확인 제어를 완성한다.
- [x] T014 [US1] `specs/005-common-modal/quickstart.md`의 안내 모드 시나리오를 `/dev/commonmodal`에서 실행해 정적 링크, 즉시 이동, 3초 이동과 중복 이동 방지를 검증한다.

**확인 지점**: 사용자 스토리 1만으로 네 안내 모드를 독립 실행하고 검증할 수 있음

**커밋 경계 제안**: 공통 안내 모드 MVP

---

## 4단계: 사용자 스토리 2 - 삭제 확인 및 취소 (우선순위: P2)

**목표**: 실제 데이터를 변경하지 않고 삭제 승인과 취소를 명확하게 호출 측에 전달

**독립 검증**: `confirmDelete`에서 삭제·취소·닫기를 각각 실행해 `onConfirm`은 삭제에서만 한 번 호출되고 취소·닫기는 `onClose`만 호출되는지 확인

### 사용자 스토리 2 구현

- [x] T015 [US2] `confirmDelete` 고정 문구, 삭제·취소 버튼과 닫기 아이콘의 `onConfirm`·`onClose` 분기를 `src/components/CommonModal.jsx`에 구현하고 실제 삭제 요청은 추가하지 않는다.
- [x] T016 [US2] 삭제 버튼과 취소 버튼의 색상·배치·포커스 상태를 제공 디자인과 기존 토큰에 맞춰 `src/components/CommonModal.module.scss`에 작성한다.
- [x] T017 [US2] `confirmDelete` 선택과 승인 호출 횟수를 로컬 결과 문구로 확인하도록 `src/app/(dev)/dev/commonmodal/page.js`를 확장하되 삭제 대상이나 모의 API를 추가하지 않는다.
- [x] T018 [US2] `specs/005-common-modal/quickstart.md`의 삭제 시나리오를 실행해 삭제 승인 1회, 취소·닫기 시 승인 0회와 현재 데이터 유지 조건을 검증한다.

**확인 지점**: 사용자 스토리 2를 실제 삭제 없이 독립 실행하고 콜백 결과로 검증할 수 있음

**커밋 경계 제안**: 삭제 확인 모드

---

## 5단계: 사용자 스토리 3 - 시스템 오류 확인 (우선순위: P3)

**목표**: 시스템·서버·네트워크 오류를 내부 정보 노출 없이 고정 문구로 안내하고 401은 로그인 페이지, 나머지는 메인 페이지로 한 번 이동

**독립 검증**: 지원 상태, 네트워크 오류, 미지원·미지정 상태를 전달해 문구를 확인하고 3초 후 또는 닫기 시 401은 `/login`, 나머지는 `/` 이동이 한 번만 실행되는지 확인

### 사용자 스토리 3 구현

- [x] T019 [US3] `401`, `403`, `404`, `429`, `500`, `502/503/504`, `network`, 그 외 상태의 고정 문구 매핑을 `src/components/CommonModal.jsx`에 구현한다.
- [x] T020 [US3] `error` 문구 뒤에 상태별 목적지 안내를 표시하고 기존 자동 이동 기반으로 401은 `/login`, 나머지는 `/`로 3초 후 또는 닫기 시 즉시 이동하도록 `src/components/CommonModal.jsx`에 연결한다.
- [x] T021 [US3] 오류 상태별 문구가 여러 줄에서도 디자인을 유지하도록 `src/components/CommonModal.module.scss`의 안내 문구 영역을 보완한다.
- [x] T022 [US3] 오류 상태 전체와 미지정·미지원 상태를 선택할 수 있도록 `src/app/(dev)/dev/commonmodal/page.js`의 개발 확인 제어를 확장한다.
- [x] T023 [US3] `specs/005-common-modal/quickstart.md`의 오류 시나리오를 실행해 상태별 문구, 내부 오류 원문 미노출, 3초 이동, 즉시 이동과 타이머 정리를 검증한다.

**확인 지점**: 사용자 스토리 3을 실제 API 없이 단순 `status` 값으로 독립 실행하고 검증할 수 있음

**커밋 경계 제안**: 오류 안내 모드

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 여섯 모드 전체의 디자인·상호작용·프로젝트 품질 확인

- [x] T024 `src/components/CommonModal.jsx`에서 허용하지 않은 mode 확장, Promise·Response·오류 원문·경로 입력 props, 실제 인증·삭제·API 로직이 없는지 `specs/005-common-modal/contracts/CommonModal.md`와 대조한다.
- [x] T025 제공 디자인을 기준으로 여섯 모드의 프비 이미지, 닫기 아이콘, 중앙 정렬, 배경막, 모드별 버튼 구성을 `src/components/CommonModal.jsx`와 `src/components/CommonModal.module.scss`에서 최종 확인한다.
- [x] T026 배경막 클릭과 Escape로 닫히지 않음, 뒤쪽 포인터 입력 0건, 한 번에 하나의 모달만 표시됨을 `src/app/(dev)/dev/commonmodal/page.js`에서 검증한다.
- [x] T027 `npm run lint`를 실행하고 이번 기능 파일인 `src/components/CommonModal.jsx`, `src/components/CommonModal.module.scss`, `src/app/(dev)/dev/commonmodal/page.js` 관련 오류를 해결한다.
- [x] T028 `npm run build`를 실행하고 `/dev/commonmodal`을 포함한 production build가 성공하는지 확인한다.
- [x] T029 `git diff --name-only`로 소스 변경이 `src/components/CommonModal.jsx`, `src/components/CommonModal.module.scss`, `src/app/(dev)/dev/commonmodal/page.js`에만 있고 `src/app/(dev)/dev/page.js`가 수정되지 않았는지 확인한다.

**커밋 경계 제안**: 전체 디자인 및 검증 보완

---

## 의존성과 실행 순서

### 단계 의존성

- 1단계는 즉시 시작할 수 있다.
- 2단계는 모든 사용자 스토리의 공통 렌더링 기반이므로 먼저 완료한다.
- 사용자 스토리 1, 2, 3은 공통 기반 이후 P1 → P2 → P3 순서로 진행한다.
- 최종 단계는 세 사용자 스토리 구현과 독립 검증 후 수행한다.
- 각 커밋 경계에서 사용자 검증과 커밋 완료를 확인한 뒤 다음 단계로 진행한다.

### 사용자 스토리 의존성

- **사용자 스토리 1(P1)**: T004~T007 이후 시작하며 단독 MVP로 사용할 수 있다.
- **사용자 스토리 2(P2)**: 공통 기반에만 의존하지만 같은 `CommonModal` 파일을 수정하므로 US1 완료 후 진행한다.
- **사용자 스토리 3(P3)**: T010의 자동 이동 기반을 재사용하므로 US1 완료 후 진행하며 US2의 삭제 로직에는 의존하지 않는다.

### 의존성 흐름

```text
준비(T001~T003)
  └─ 공통 기반(T004~T007)
      ├─ US1 안내 모드(T008~T014) ─┬─ US2 삭제 확인(T015~T018)
      │                            └─ US3 오류 안내(T019~T023)
      └──────────────────────────────── 최종 검증(T024~T029)
```

## 병렬 실행 예시

### 공통 선행 작업

T004와 T005는 계약이 확정된 뒤 서로 다른 파일을 생성하므로 병렬 수행할 수 있다. T006은 두 결과가 모두 완료된 후 수행한다.

```text
T004: src/components/CommonModal.module.scss 공통 스타일
T005: src/components/CommonModal.jsx 기본 골격
```

### 사용자 스토리별 판단

- **US1**: T008~T012가 같은 `CommonModal.jsx`와 자동 이동 기반을 순차 확장하므로 병렬 수행하지 않는다.
- **US2**: JSX 클래스 계약 뒤 SCSS와 개발 페이지를 수정해야 하므로 T015 → T016 → T017 순서를 유지한다.
- **US3**: 오류 매핑과 자동 이동 연결이 같은 파일을 수정하므로 T019 → T020 이후 스타일과 개발 페이지를 순차 검증한다.

작업 충돌 방지와 작은 단위 커밋 원칙을 위해 추가 병렬화는 권장하지 않는다.

## 구현 전략

### MVP 우선

1. T001~T007로 공통 골격과 개발 확인 기반을 만든다.
2. T008~T014로 사용자 스토리 1을 완성하고 검증·커밋한다.
3. 이 시점에 준비 중 및 로그인 안내 모드 MVP를 독립 확인할 수 있다.

### 점진적 전달

1. T015~T018로 삭제 확인만 추가해 검증·커밋한다.
2. T019~T023으로 오류 안내만 추가해 검증·커밋한다.
3. T024~T029로 전체 디자인·상호작용·lint·build를 확인한 뒤 최종 커밋한다.

### 작업 중지와 커밋 원칙

- 구현 에이전트는 각 `커밋 경계 제안`에서 작업을 멈추고 변경 파일, 검증 결과와 권장 커밋 명령을 사용자에게 알린다.
- 사용자가 직접 커밋한 뒤 완료를 알리면 다음 단계로 진행한다.
- 구현 에이전트는 직접 `git commit` 또는 `git push`를 실행하지 않는다.

## 참고

- 모든 구현 작업은 `- [ ] T### [P?] [US#?] 설명` 형식을 지킨다.
- 같은 파일을 수정하는 작업은 병렬 작업으로 표시하지 않는다.
- 체크박스는 해당 작업의 구현과 검증이 완료된 직후 갱신한다.
- 실제 백엔드, API, 데이터베이스, 인증, 삭제 요청, 새 패키지와 상태 관리 라이브러리는 작업에 포함하지 않는다.
- 기존 `src/app/(dev)/dev/page.js`와 제품 페이지는 수정하지 않는다.
