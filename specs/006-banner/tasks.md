---
description: "공통 광고 배너 구현을 위한 작업 목록"
---

# 작업 목록: 공통 광고 배너

**입력**: `/specs/006-banner/`의 설계 문서

**필수 문서**: `spec.md`, `plan.md`

**참고 문서**: `research.md`, `data-model.md`, `contracts/Banner.md`, `quickstart.md`

**테스트 방식**: 별도 테스트 도구를 추가하지 않고 `/dev/banner` 수동 시나리오, ESLint와 production build로 검증한다.

**구성**: 작은 기능 단위로 구현·검증하며 각 사용자 스토리 완료 지점을 독립 커밋 경계로 사용한다. 작업 완료 직후 해당 체크박스를 갱신한다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 선행 작업 완료 후 서로 다른 파일에서 독립적으로 수행 가능한 작업
- **[US#]**: `spec.md`의 사용자 스토리 번호
- 모든 작업에는 정확한 파일 경로와 완료 조건을 포함한다.

## 1단계: 준비

**목적**: 구현 범위, 계약, 자산과 기존 구조를 변경 전에 확정

- [x] T001 `AGENTS.md`, `.specify/memory/constitution.md`, `specs/006-banner/spec.md`, `specs/006-banner/plan.md`를 확인하고 현재 브랜치가 `feature/banner`인지 검증한다.
- [x] T002 `specs/006-banner/research.md`, `specs/006-banner/data-model.md`, `specs/006-banner/contracts/Banner.md`, `specs/006-banner/quickstart.md`에서 입력 계약, 목적지 판별, 크기와 검증 기준을 확인한다.
- [x] T003 `public/images/banner.jpg`, `src/components/`, `src/app/(dev)/dev/`와 `src/styles/abstracts/`를 확인하고 원본 1322×358 자산과 기존 구조를 변경하지 않음을 확정한다.

**확인 지점**: 생성할 소스 파일 4개, 수정 금지 파일과 범위 제외 항목이 확정됨

---

## 2단계: 공통 선행 작업

**목적**: 모든 사용자 스토리가 공유하는 이미지 배너 골격과 개발 확인 기반 작성

- [x] T004 [P] 부모 너비를 채우는 배너·이미지 기본 클래스와 전체 이미지 표시 기반을 `src/components/Banner.module.scss`에 작성한다.
- [x] T005 [P] 기본 이미지 `/images/banner.jpg`, 원본 치수 1322×358, `imageSrc`, `alt`, `href` 입력을 갖는 서버 컴포넌트 골격을 `src/components/Banner.jsx`에 작성하되 별도 CTA 요소는 추가하지 않는다.
- [x] T006 서로 다른 배너 사례를 한 화면에 배치할 개발 확인 골격을 `src/app/(dev)/dev/banner/page.js`와 `src/app/(dev)/dev/banner/page.module.scss`에 작성하고 기존 `src/app/(dev)/dev/page.js`는 수정하지 않는다.

**확인 지점**: `/dev/banner`에서 기본 이미지만 표시되고 이후 링크·너비·누락 상태를 추가할 수 있음

**커밋 경계 제안**: 배너 이미지 기본 골격과 개발 확인 기반

---

## 3단계: 사용자 스토리 1 - 배너를 통한 광고 이동 (우선순위: P1) 🎯 MVP

**목표**: 이미지 전체를 선택해 내부 목적지는 현재 탭, 외부 HTTP(S) 목적지는 새 탭에서 열기

**독립 검증**: 내부·외부 목적지를 가진 두 배너의 중앙과 가장자리를 선택해 각각 정해진 탭과 목적지로 한 번 이동하는지 확인

### 사용자 스토리 1 구현

- [x] T007 [US1] `/`로 시작하고 `//`가 아닌 내부 목적지와 파싱 가능한 HTTP(S) 외부 목적지를 구분하는 판별 로직을 `src/components/Banner.jsx`에 작성한다.
- [x] T008 [US1] 내부 목적지일 때 이미지 전체를 `Link`로 감싸 현재 탭에서 이동하도록 `src/components/Banner.jsx`에 구현한다.
- [x] T009 [US1] 외부 HTTP(S) 목적지일 때 이미지 전체를 새 탭 `<a>`로 감싸고 원래 페이지와 실행 컨텍스트를 분리하도록 `src/components/Banner.jsx`에 구현한다.
- [x] T010 [US1] 링크 래퍼가 배너 전체 너비와 이미지 전체 클릭 영역을 차지하고 키보드 포커스를 구분하도록 `src/components/Banner.module.scss`에 작성한다.
- [x] T011 [US1] 내부 목적지와 외부 목적지 사례를 `src/app/(dev)/dev/banner/page.js`에 추가하고 배너 내부에는 별도 버튼·문구·아이콘·오버레이를 넣지 않는다.
- [x] T012 [US1] `specs/006-banner/quickstart.md`의 내부·외부 이동 시나리오를 `/dev/banner`에서 실행해 전체 이미지 클릭 영역, 현재 탭과 새 탭 동작을 검증한다.

**확인 지점**: 사용자 스토리 1만으로 내부·외부 이동 가능한 배너 MVP를 독립 실행하고 검증할 수 있음

**커밋 경계 제안**: 내부·외부 이동 배너 MVP

---

## 4단계: 사용자 스토리 2 - 서로 다른 페이지 너비에 맞춘 표시 (우선순위: P2)

**목표**: 페이지별 크기 유형 없이 부모 영역 너비에 따라 같은 이미지를 다른 크기로 표시

**독립 검증**: 서로 다른 세 부모 너비에서 동일 배너가 각 너비를 채우고 1322:358 비율로 전체 표시되는지 확인

### 사용자 스토리 2 구현

- [x] T013 [US2] 최상위 배너, 링크 래퍼와 이미지에 `width: 100%`, 자동 높이, 블록 표시와 비율 유지 규칙을 `src/components/Banner.module.scss`에 완성한다.
- [x] T014 [US2] 좁은 영역, 넓은 영역과 임의의 세 번째 영역을 재현하는 부모 너비 클래스만 `src/app/(dev)/dev/banner/page.module.scss`에 작성한다.
- [x] T015 [US2] 같은 `Banner`를 세 부모 영역에 배치하고 `main`, `list`, `variant`, 고정 크기 prop을 전달하지 않도록 `src/app/(dev)/dev/banner/page.js`를 확장한다.
- [x] T016 [US2] `specs/006-banner/quickstart.md`의 크기 시나리오를 `/dev/banner`에서 실행해 잘림·왜곡 0건과 부모 너비만으로 크기가 달라지는지 검증한다.

**확인 지점**: 사용자 스토리 2를 공통 배너 변경 없이 부모 컨테이너만으로 독립 검증할 수 있음

**커밋 경계 제안**: 부모 너비 반응형 배너

---

## 5단계: 사용자 스토리 3 - 불완전한 배너 정보 처리 (우선순위: P3)

**목표**: 이미지나 목적지 정보가 불완전할 때 깨진 이미지와 잘못된 이동 방지

**독립 검증**: 이미지 없음, 목적지 없음, 빈 목적지와 미지원 스킴을 전달해 미표시 또는 링크 없는 이미지 결과를 확인

### 사용자 스토리 3 구현

- [x] T017 [US3] `imageSrc`가 명시적으로 없거나 빈 값이면 컨테이너 없이 `null`을 반환하도록 `src/components/Banner.jsx`에 구현한다.
- [x] T018 [US3] `href`가 없거나 빈 값, `//`, `javascript:` 및 미지원 스킴이면 링크 없이 같은 이미지만 렌더링하도록 `src/components/Banner.jsx`에 구현한다.
- [x] T019 [US3] 이미지 없음, 목적지 없음과 미지원 목적지 사례를 `src/app/(dev)/dev/banner/page.js`에 추가하고 사례 설명은 배너 바깥에만 표시한다.
- [x] T020 [US3] `specs/006-banner/quickstart.md`의 누락·잘못된 값 시나리오를 `/dev/banner`에서 실행해 깨진 이미지, 빈 영역, 의도하지 않은 이동과 새 탭 열기가 0건인지 검증한다.

**확인 지점**: 사용자 스토리 3을 API나 오류 UI 없이 단순 입력값만으로 독립 검증할 수 있음

**커밋 경계 제안**: 배너 누락·유효하지 않은 목적지 처리

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 전체 계약, 디자인, 범위와 프로젝트 품질 확인

- [x] T021 `src/components/Banner.jsx`와 `src/components/Banner.module.scss`를 `specs/006-banner/contracts/Banner.md`와 대조해 별도 CTA·문구·아이콘·오버레이, 페이지별 크기 유형, Client Component 전환이 없는지 확인한다.
- [x] T022 `src/app/(dev)/dev/banner/page.js`와 `src/app/(dev)/dev/banner/page.module.scss`에서 내부·외부·비대화형·미표시와 세 부모 너비 시나리오를 모두 최종 검증한다.
- [x] T023 `npm run lint`를 실행해 `src/components/Banner.jsx`, `src/components/Banner.module.scss`, `src/app/(dev)/dev/banner/page.js`, `src/app/(dev)/dev/banner/page.module.scss` 관련 오류가 없는지 확인한다.
- [x] T024 `npm run build`를 실행해 `/dev/banner`가 포함된 production build가 성공하는지 확인한다.
- [x] T025 `git diff --name-only`로 소스 변경이 `src/components/Banner.jsx`, `src/components/Banner.module.scss`, `src/app/(dev)/dev/banner/page.js`, `src/app/(dev)/dev/banner/page.module.scss`에만 있고 `src/app/(dev)/dev/page.js`와 제품 페이지가 수정되지 않았는지 확인한다.

**커밋 경계 제안**: 전체 계약 및 검증 완료

---

## 의존성과 실행 순서

### 단계 의존성

- 준비 단계는 즉시 시작할 수 있다.
- 공통 선행 작업은 모든 사용자 스토리보다 먼저 완료한다.
- 사용자 스토리는 P1 → P2 → P3 순서로 진행한다.
- 최종 검증은 세 사용자 스토리 구현과 독립 검증 후 수행한다.
- 각 커밋 경계에서 사용자 검증과 직접 커밋 완료를 확인한 뒤 다음 단계로 진행한다.

### 사용자 스토리 의존성

- **사용자 스토리 1(P1)**: T004~T006 이후 시작하며 이동 가능한 배너 MVP를 제공한다.
- **사용자 스토리 2(P2)**: 공통 이미지와 링크 래퍼를 재사용하므로 US1 완료 후 진행하지만 목적지 판별 규칙에는 변경을 주지 않는다.
- **사용자 스토리 3(P3)**: 같은 렌더링 분기를 수정하므로 US1 이후 진행하며 US2의 부모 너비 클래스에는 의존하지 않는다.

### 의존성 흐름

```text
준비(T001~T003)
  └─ 공통 기반(T004~T006)
      └─ US1 이동 배너(T007~T012)
          ├─ US2 부모 너비(T013~T016)
          └─ US3 누락·유효성(T017~T020)
              └─ 최종 검증(T021~T025)
```

## 병렬 실행 예시

### 공통 선행 작업

T004와 T005는 계약 확정 후 서로 다른 파일을 생성하므로 병렬 수행할 수 있다. T006은 두 결과를 사용할 준비가 된 후 수행한다.

```text
T004: src/components/Banner.module.scss 공통 스타일 골격
T005: src/components/Banner.jsx 이미지 컴포넌트 골격
```

### 사용자 스토리별 판단

- **US1**: 목적지 판별과 렌더링 분기가 같은 `Banner.jsx`를 순차 변경하므로 T007 → T008 → T009를 유지한다.
- **US2**: T013 완료 후 개발 페이지의 부모 스타일 T014와 배치 T015를 순서대로 연결한다.
- **US3**: 이미지 없음과 목적지 유효성 분기가 같은 `Banner.jsx`에 있으므로 T017 → T018 순서를 유지한다.

작업 충돌 방지와 작은 단위 커밋 원칙을 위해 추가 병렬화는 권장하지 않는다.

## 구현 전략

### MVP 우선

1. T001~T006으로 이미지 배너 골격과 개발 확인 기반을 만든다.
2. T007~T012로 내부·외부 전체 이미지 이동을 구현하고 검증·커밋한다.
3. 이 시점에 이동 가능한 광고 배너 MVP를 독립 사용할 수 있다.

### 점진적 전달

1. T013~T016으로 부모 너비 반응형 표시만 추가해 검증·커밋한다.
2. T017~T020으로 누락·미지원 입력 처리만 추가해 검증·커밋한다.
3. T021~T025로 전체 계약, lint와 build를 검증해 최종 커밋한다.

### 작업 중지와 커밋 원칙

- 구현 에이전트는 각 `커밋 경계 제안`에서 작업을 멈추고 변경 파일, 검증 결과와 권장 커밋 명령을 사용자에게 알린다.
- 사용자가 직접 커밋한 뒤 완료를 알리면 다음 단계로 진행한다.
- 구현 에이전트는 직접 `git commit` 또는 `git push`를 실행하지 않는다.

## 참고

- 모든 구현 작업은 `- [ ] T### [P?] [US#?] 설명` 형식을 지킨다.
- 같은 파일을 수정하는 작업은 병렬 작업으로 표시하지 않는다.
- 체크박스는 구현과 검증이 완료된 직후 갱신한다.
- 실제 API, 서버 통신, 광고 관리, 클릭 통계, 새 패키지는 포함하지 않는다.
- 기존 `src/app/(dev)/dev/page.js`와 제품 페이지는 수정하지 않는다.
