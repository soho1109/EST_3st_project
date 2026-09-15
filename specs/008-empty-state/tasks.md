# 작업 목록: 공통 빈 상태 안내

**입력**: `/specs/008-empty-state/`의 설계 문서

**필수 문서**: `plan.md`, `spec.md`

**선택 문서**: `research.md`, `data-model.md`, `contracts/EmptyState.md`, `quickstart.md`

**테스트**: 자동 테스트 또는 TDD가 요청되지 않았고 프로젝트에 테스트 스크립트가 없으므로 별도 테스트 파일을 생성하지 않는다. 각 사용자 스토리는 `quickstart.md`의 수동 시나리오와 기존 lint·build로 검증한다.

**경로 기준**: 구현 시점에 Git이 추적하는 실제 소문자 경로 `src/app/(site)/summary`, `src/app/(site)/mypage`를 사용한다. 기존 `src/components/Allsummary.jsx`의 파일명은 변경하지 않는다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 다른 파일에서 의존성 없이 병렬로 수행할 수 있는 작업에만 표시
- **[US#]**: 사용자 스토리 단계의 작업에만 표시
- 모든 구현 작업에는 정확한 파일 경로와 완료 조건을 포함

## 1단계: 준비

**목적**: 구현 전 명세, 실제 경로와 기존 중복 구현을 확인한다.

- [x] T001 `AGENTS.md`, `docs/specs/AllSummary.md`, `docs/specs/Summary.md`, `docs/specs/Mypage.md`, `specs/008-empty-state/spec.md`, `specs/008-empty-state/plan.md`, `specs/008-empty-state/contracts/EmptyState.md`를 읽고 문구·책임·금지 범위를 재확인한다.
- [x] T002 `src/components/Allsummary.jsx`, `src/app/(site)/summary/[summaryId]/page.js`, `src/app/(site)/summary/[summaryId]/page.module.scss`, `src/app/(site)/mypage/page.js`의 현재 내용과 Git 상태를 확인해 팀 변경을 덮어쓰지 않을 구현 기준을 기록한다.
- [x] T003 `public/images/clear.webp`의 존재 여부와 `src/app/(site)/summary/[summaryId]/page.module.scss`의 기존 `.empty-state`, `.empty-image` 스타일을 확인해 재사용할 이미지·스타일 범위를 확정한다.

---

## 2단계: 공통 선행 작업

**목적**: 모든 사용자 스토리가 사용할 최소 EmptyState 표시 계약과 공통 스타일을 만든다.

**⚠️ 중요**: 이 단계를 완료하기 전에는 사용자 스토리 적용 작업을 시작하지 않는다.

- [x] T004 [P] `src/components/EmptyState.jsx`에 필수 `message` prop, `/images/clear.webp` 장식 이미지, 안내 문구, `role="status"`와 정중한 live 안내를 구현하고 접근성 속성의 목적을 주석으로 설명한다.
- [x] T005 [P] `src/components/EmptyState.module.scss`에 `src/app/(site)/summary/[summaryId]/page.module.scss`의 기존 중앙 정렬·이미지 크롭·문구 스타일을 옮기고 일반 부모 너비와 Grid 전체 열을 모두 차지하도록 구현한다.

**확인 지점**: `EmptyState({ message })`가 내부 상태·이벤트·버튼·링크 없이 공통 표시 구조를 제공하고 각 호출 영역에서 import할 준비가 완료됨

---

## 3단계: 사용자 스토리 1 - 요약본 목록의 빈 상태 확인 (우선순위: P1) 🎯 MVP

**목표**: 전체 요약본, 나의 요약본과 북마크 목록의 정상 결과가 비었을 때 목록 문맥에 맞는 정확한 EmptyState 문구를 표시한다.

**독립 검증**: `src/components/Allsummary.jsx`에 빈 결과를 제공해 `view="all"`, `view="mine"`에서는 `요약 노트가 아직 생성되지 않았습니다.`, `view="bookmarks"`에서는 `북마크한 요약 노트가 없습니다.`가 표시되고, 항목이 있으면 기존 카드만 표시되는지 확인한다.

### 사용자 스토리 1 구현

- [x] T006 [US1] `src/components/Allsummary.jsx`에서 기존 필터·정렬·카드 props를 유지한 채 `summaryCards.length`로 항목 목록과 `EmptyState`를 상호 배타적으로 렌더링하고 `view`별 정확한 문구를 전달한다.
- [x] T007 [US1] `specs/008-empty-state/quickstart.md`의 전체·나의·북마크 빈 컬렉션 및 항목 존재 시나리오를 `src/components/Allsummary.jsx`에 대해 실행하고 검증용 임시 데이터 변경이 최종 diff에 남지 않았는지 확인한다.

**확인 지점**: 사용자 스토리 1만으로 세 요약본 목록의 빈 상태와 기존 카드 목록을 독립적으로 검증할 수 있음

---

## 4단계: 사용자 스토리 2 - 요약 상세의 학습노트 빈 상태 확인 (우선순위: P2)

**목표**: 요약 상세의 학습노트가 없는 기존 상태를 공통 EmptyState로 표시하고 페이지 전용 중복 마크업·스타일을 제거한다.

**독립 검증**: `src/app/(site)/summary/[summaryId]/page.js`를 렌더링해 학습노트 목록 영역에 `현재 리스트가 없습니다.`가 표시되고, 이미지와 문구 배치가 기존 화면과 동일하며 버튼·제목 영역은 변하지 않았는지 확인한다.

### 사용자 스토리 2 구현

- [x] T008 [P] [US2] `src/app/(site)/summary/[summaryId]/page.js`에서 직접 작성된 `next/image` 빈 상태 마크업을 `EmptyState`와 `현재 리스트가 없습니다.` 메시지로 교체하고 불필요해진 `next/image` import만 제거한다.
- [x] T009 [P] [US2] `src/app/(site)/summary/[summaryId]/page.module.scss`에서 `EmptyState.module.scss`로 이동된 `.empty-state`, `.empty-image` 규칙만 제거하고 버튼·제목·목록 외 레이아웃 스타일과 상대 SCSS import는 유지한다.
- [x] T010 [US2] `specs/008-empty-state/quickstart.md`의 요약 상세 빈 학습노트 시나리오를 실행해 `src/app/(site)/summary/[summaryId]/page.js`의 문구, 장식 이미지, 접근성 상태와 기존 화면 영역 보존을 확인한다.

**확인 지점**: 사용자 스토리 2를 사용자 스토리 1·3의 페이지 데이터와 독립적으로 실행하고 검증할 수 있음

---

## 5단계: 사용자 스토리 3 - 마이페이지 북마크 빈 상태 확인 (우선순위: P3)

**목표**: 마이페이지 북마크 섹션을 내 요약 노트의 정적 컬렉션과 분리하고 북마크가 없을 때 정확한 EmptyState를 표시한다.

**독립 검증**: `src/app/(site)/mypage/page.js`의 북마크 컬렉션을 빈 상태와 항목 존재 상태로 각각 렌더링해 `북마크한 요약 노트가 없습니다.`와 기존 카드 목록이 상호 배타적으로 표시되며 다른 마이페이지 섹션은 유지되는지 확인한다.

### 사용자 스토리 3 구현

- [x] T011 [US3] `src/app/(site)/mypage/page.js`에서 내 요약 노트와 북마크가 공유하는 정적 placeholder 컬렉션을 분리하고, 실제 데이터 연결 전 범위를 설명하는 임시 주석과 함께 빈 북마크 컬렉션에는 `EmptyState` 및 `북마크한 요약 노트가 없습니다.`를 표시한다.
- [x] T012 [US3] `specs/008-empty-state/quickstart.md`의 마이페이지 북마크 빈 상태·항목 존재 시나리오를 `src/app/(site)/mypage/page.js`에서 실행해 프로필·학습노트·내 요약 노트 섹션에 회귀 변경이 없는지 확인한다.

**확인 지점**: 사용자 스토리 3을 다른 목록 페이지와 독립적으로 실행하고 검증할 수 있음

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 다섯 적용 대상의 시각적 일관성, 접근성, 상태 상호 배제와 빌드 품질을 확인한다.

- [x] T013 `specs/008-empty-state/quickstart.md`의 전체 수동 시나리오를 실행해 `src/components/EmptyState.jsx`가 다섯 적용 대상에서 동일한 구조·이미지·간격·타이포그래피를 사용하고 정확한 세 문구만 표시하는지 확인한다.
- [x] T014 `src/components/EmptyState.jsx`, `src/components/Allsummary.jsx`, `src/app/(site)/summary/[summaryId]/page.js`, `src/app/(site)/mypage/page.js`를 대상으로 `npm run lint`를 실행하고 오류를 해결한다.
- [x] T015 `src/components/EmptyState.module.scss`, `src/app/(site)/summary/[summaryId]/page.module.scss`를 포함한 제품 경로에 대해 `npm run build`를 실행해 SCSS import와 production build가 성공하는지 확인한다.
- [x] T016 `specs/008-empty-state/quickstart.md`의 범위 확인 항목에 따라 `git diff --check`와 최종 diff를 검토해 새 패키지·앱 경로·자산·데이터 통신·인증·검색·경로 대소문자 변경이 포함되지 않았는지 확인한다.

---

## 의존성과 실행 순서

### 단계 의존성

- **1단계 준비**: 즉시 시작할 수 있다.
- **2단계 공통 선행 작업**: 1단계 완료 후 시작하며 모든 사용자 스토리를 차단한다.
- **3단계 US1**, **4단계 US2**, **5단계 US3**: T004와 T005 완료 후 서로 독립적으로 시작할 수 있다.
- **최종 단계**: 구현한 사용자 스토리가 모두 완료된 뒤 실행한다.

### 사용자 스토리 의존성

- **US1(P1)**: T004, T005에만 의존하며 요약본 목록 세 종류를 제공하는 MVP다.
- **US2(P2)**: T004, T005에만 의존하며 US1의 데이터·페이지 변경 없이 검증할 수 있다.
- **US3(P3)**: T004, T005에만 의존하며 US1·US2의 데이터와 독립적으로 검증할 수 있다.
- 세 사용자 스토리는 공통 EmptyState 계약을 공유하지만 서로의 구현 완료에는 의존하지 않는다.

### 태스크 의존성 그래프

```text
T001 → T002 → T003
                 ├─ T004 ─┬─ T006 → T007 ─┐
                 └─ T005 ─┼─ T008 ─┐      │
                          │  T009 ─┴→ T010 ├─ T013 → T014 → T015 → T016
                          └─ T011 → T012 ──┘
```

## 병렬 실행 예시

### 공통 선행 작업

```text
동시에 실행 가능:
- T004: src/components/EmptyState.jsx
- T005: src/components/EmptyState.module.scss
```

### 사용자 스토리 1

```text
T006과 T007은 같은 구현 결과를 순서대로 다루므로 스토리 내부 병렬 실행 없음.
T006은 T008·T009 또는 T011과 서로 다른 파일이므로 스토리 간 병렬 실행 가능.
```

### 사용자 스토리 2

```text
동시에 실행 가능:
- T008: src/app/(site)/summary/[summaryId]/page.js
- T009: src/app/(site)/summary/[summaryId]/page.module.scss

T010은 T008과 T009가 모두 끝난 뒤 실행.
```

### 사용자 스토리 3

```text
T011과 T012는 같은 페이지의 구현과 검증이므로 스토리 내부 병렬 실행 없음.
T011은 T006 또는 T008·T009와 서로 다른 파일이므로 스토리 간 병렬 실행 가능.
```

## 구현 전략

### MVP 우선

1. T001–T003으로 명세·경로·기존 스타일을 확인한다.
2. T004–T005로 공통 EmptyState 계약을 완성한다.
3. T006–T007로 US1의 전체·나의·북마크 요약본 목록을 구현하고 독립 검증한다.
4. 이 시점에 공통 컴포넌트와 가장 넓은 목록 적용 범위를 제공하는 MVP가 완성된다.

### 점진적 제공

1. **MVP**: 공통 기반 + US1 요약본 목록
2. **증분 2**: US2 요약 상세 학습노트 빈 상태와 중복 스타일 제거
3. **증분 3**: US3 마이페이지 북마크 독립 상태
4. **마무리**: 다섯 적용 대상 수동 검증, lint, build, diff 점검

### 구현 시 범위 보호

- `EmptyState`에 목록·로딩·오류·페이지 문맥 판단을 추가하지 않는다.
- `src/components/Allsummary.jsx`의 파일명과 호출 페이지 import를 변경하지 않는다.
- 기존 `src/app/(site)/summary/[summaryId]/page.module.scss`의 상대 SCSS import를 development 버전으로 되돌리지 않는다.
- 사용자 스토리 검증을 위한 임시 데이터 변경은 최종 diff에 남기지 않는다.
- 실제 API, Supabase, 인증, 검색, 북마크 변경과 학습노트 조회를 구현하지 않는다.

## 참고

- 총 16개 태스크이며 자동 테스트 파일 생성 태스크는 없다.
- 모든 태스크는 `- [ ] T### [P?] [US#?] 설명` 형식과 실제 파일 경로를 사용한다.
- `[P]`는 서로 다른 파일을 수정하고 공통 선행 작업 이후 독립적으로 수행할 수 있는 T004, T005, T008, T009에만 표시했다.
- 각 사용자 스토리는 해당 단계의 독립 검증을 통과한 뒤 완료로 판단한다.
