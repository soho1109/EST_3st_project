---

description: "요약 및 학습노트 상세 기능 구현 작업 목록"
---

# 작업 목록: 요약 및 학습노트 상세

**입력**: `/specs/002-summary-detail/`의 설계 문서

**필수 문서**: `plan.md`, `spec.md`

**사용 문서**: `research.md`, `data-model.md`, `contracts/summary-detail-contract.md`, `quickstart.md`

**테스트**: 자동 테스트 또는 TDD가 요청되지 않았으므로 테스트 파일 생성 작업은 추가하지 않는다. 각 사용자 스토리는 `quickstart.md`의 수동 인수 시나리오와 기존 lint·build로 검증한다.

**구성**: 다섯 사용자 스토리를 독립적으로 구현·검증할 수 있게 묶는다. 사용자 승인에 따라 실제 인증·데이터 서비스 관문은 서비스 연결 작업만 차단하며, 하드코딩 제품 데이터 없이 정적 UI 작업을 먼저 수행한다.

> **범위 변경 (2026-08-18)**: 사용자의 요청에 따라 `src/app/(site)/summary/[summaryId]/layout.js`는 이번 작업에서 제외한다. 기존 Client Component와 mock 기반 공통 레이아웃은 변경하지 않으며, 해당 파일을 직접 대상으로 하는 작업은 범위 제외로 처리한다. 요약본 삭제는 이번 증분에 포함하고, 요약본 생성·수정·잠금·퀴즈는 계속 제외한다.

## 형식: `[ID] [P?] [스토리?] 설명과 파일 경로`

- **ID**: 실행 순서에 따른 `T001`, `T002` 형식의 번호
- **[P]**: 선행 작업 완료 후 다른 파일에서 병렬 수행 가능한 작업
- **[US#]**: 사용자 스토리 단계의 작업
- 모든 작업은 대상 파일 또는 검증 근거 파일의 정확한 경로를 포함한다.

## 1단계: 준비

**목적**: 구현 범위, 기존 공통 컴포넌트, 외부 서비스 전제조건과 현재 기준 상태를 확정한다.

- [X] T001 `specs/002-summary-detail/spec.md`, `specs/002-summary-detail/plan.md`, `specs/002-summary-detail/research.md`, `specs/002-summary-detail/data-model.md`, `specs/002-summary-detail/contracts/summary-detail-contract.md`를 대조해 네 경로·다섯 사용자 스토리·범위 제외 항목을 확인한다.
- [X] T002 `src/components/Header.jsx`, `src/components/CommonModal.jsx`, `src/components/NotePwModal.jsx`, `src/components/Loading.jsx`를 각각의 기존 계약과 비교하고 공개 props를 변경하지 않고 재사용할 수 있는지 확인한다.
- [X] T003 `specs/002-summary-detail/contracts/summary-detail-contract.md`의 조회·CRUD·북마크·퀴즈·잠금 인증 연산을 제공하는 실제 서비스 위치와 호출 경계를 확인해 계약 문서에 연결 정보를 기록하며, 서비스가 없으면 임의 Supabase 구조나 제품 경로 데모 데이터 없이 구현을 중단한다.
- [X] T004 `package.json`의 기존 스크립트로 `npm run lint`와 `npm run build`를 실행해 구현 전 기준 오류를 기록하고 새 패키지가 필요하지 않음을 확인한다.

---

## 2단계: 공통 선행 작업

**목적**: 모든 사용자 스토리가 공유하는 요약 영역의 정적 UI를 먼저 구성하고, 실제 조회·404 경계는 서비스 제공 후 연결한다.

**필수 조건**: 정적 UI는 서비스 없이 진행할 수 있다. 조회·404 처리는 T003의 실제 서비스 연결 지점이 확인되어야 한다.

- [X] T005 `src/app/(site)/summary/[summaryId]/layout.js`에 Next.js 16 비동기 `params`, 기존 `(site)` Header 아래 생성 주제·AI 요약 표시 영역과 `children` 공통 정적 배치를 구현하고 서비스 의존 버튼을 비활성화한다. (사용자 요청으로 기존 구현 유지)
- [X] T006 `src/app/(site)/summary/[summaryId]/layout.module.scss`에 제공된 데스크톱 디자인의 공통 상세 배치와 기존 색상·타이포그래피 토큰을 적용한다.
- [X] T007 `src/app/(site)/summary/[summaryId]/layout.js`에 계약 기반 요약본 조회와 존재하지 않는 `summaryId`의 `notFound()`를 연결하고 `specs/002-summary-detail/quickstart.md`의 공통 레이아웃·404 조건을 검증한다. (사용자 요청으로 범위 제외, 기존 mock 레이아웃 유지)

**확인 지점**: 공개 요약본의 모든 하위 경로가 같은 생성 주제·AI 요약 영역을 공유하고 잘못된 요약본 식별자가 404로 처리된다.

---

## 3단계: 사용자 스토리 1 - 요약본과 학습노트 목록 확인 (우선순위: P1) 🎯 MVP

**목표**: 방문자가 생성 주제·AI 요약과 최신 작성순 학습노트 목록 또는 빈 상태를 확인하고 학습노트 상세와 전체 노트로 이동한다.

**독립 검증**: 학습노트가 있는 공개 요약본과 없는 공개 요약본을 각각 열어 목록 정보·정렬·빈 상태·상세 이동·더보기 이동을 확인한다.

### 사용자 스토리 1 구현

- [X] T008 [P] [US1] `src/components/NoteItem.jsx`에 `summaryId`, `noteId`, 작성자, 주제, 작성일, 퀴즈 상태 props와 `/summary/[summaryId]/notes/[noteId]` 정적 링크 계약을 구현하고 백분율은 표시하지 않는다.
- [X] T009 [P] [US1] `src/components/NoteItem.module.scss`에 퀴즈 전·후 상태, 작성자·주제·작성일 행 배치, 긴 텍스트가 열 구조를 깨뜨리지 않는 데스크톱 스타일을 구현한다.
- [X] T010 [US1] `src/app/(site)/summary/[summaryId]/page.js`에 서비스 데이터 없이 학습노트 목록 제목, 디자인의 빈 목록 안내와 변경 동작 비활성 상태를 구현한다.
- [X] T011 [US1] `src/app/(site)/summary/[summaryId]/page.module.scss`에 목록 헤더, 빈 목록 상태와 버튼 영역의 데스크톱 디자인을 구현한다.
- [ ] T012 [US1] `src/app/(site)/summary/[summaryId]/page.js`에 계약 기반 최신 작성순 목록과 `NoteItem`, `/allnote` 더보기, 조회 진행·실패 상태를 연결하고 기존 `Loading`과 `CommonModal error`로 현재 페이지 상태를 보존한다.
- [ ] T013 [US1] `specs/002-summary-detail/quickstart.md`의 시나리오 1·2를 실행해 3초 이내 주요 내용 표시, 최신순, 필수 행 정보, 빈 상태, 상세 및 `/allnote` 이동을 독립 검증한다.

**확인 지점**: 사용자 스토리 1만으로 공개 요약본의 읽기 전용 상세와 학습노트 탐색이 동작한다.

---

## 4단계: 사용자 스토리 2 - 학습노트 작성 및 수정 (우선순위: P1)

**목표**: 로그인 사용자가 학습노트를 생성하고 상세에서 확인한 뒤 작성한 노트를 수정할 수 있다.

**독립 검증**: 제목만 또는 선택 본문을 포함해 생성하고, 생성된 상세에서 기존 값을 불러와 수정한 뒤 같은 상세 경로로 돌아오는 흐름을 확인한다.

### 사용자 스토리 2 구현

- [X] T014 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/new/page.js`에 제목·오늘 배운 내용 요약·오늘의 회고·참고자료 입력, 제목 50자와 선택 본문 1,000자 제한 및 서비스 연결 전 제출 비활성 상태를 구현한다.
- [X] T015 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/new/page.module.scss`에 네 입력 필드와 생성 버튼의 데스크톱 디자인을 구현한다.
- [X] T016 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에 서비스 데이터 없이 제목·세 본문 표시 영역과 퀴즈·수정·삭제 비활성 상태를 구현한다.
- [X] T017 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.module.scss`에 학습노트 제목·본문 영역과 후속 동작 영역의 데스크톱 디자인을 구현한다.
- [X] T018 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.js`에 네 입력 필드, 길이 제한과 기존 값 조회 전 수정 제출 비활성 상태를 구현한다.
- [X] T019 [P] [US2] `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.module.scss`에 네 입력 필드와 수정 완료 버튼의 데스크톱 디자인을 구현한다.
- [X] T020 [US2] `src/app/(site)/summary/[summaryId]/actions.js`, `src/app/(site)/summary/[summaryId]/notes/StudyNoteForm.jsx`, `src/app/(site)/summary/[summaryId]/notes/new/page.js`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.js`에 실제 `learning_notes` 컬럼 조회·생성·수정·삭제 서비스, 상위 식별자·404·소유권 검증, 실제 컬럼명 정규화, trim·blur·제출 검증, 성공 이동, `Loading`, 오류 보존과 중복 요청 차단을 연결한다.
- [ ] T021 [US2] `specs/002-summary-detail/quickstart.md`의 시나리오 4를 실행해 유효·무효 입력, 생성·수정 성공 이동, 2분 이내 완료, 로딩·오류 보존과 중복 요청 차단을 독립 검증한다.

**확인 지점**: 사용자 스토리 2만으로 로그인 사용자의 학습노트 생성·상세·수정 수명 주기가 동작한다.

---

## 5단계: 사용자 스토리 3 - 접근 권한과 잠긴 요약본 처리 (우선순위: P1)

**목표**: 잠긴 요약본과 모든 하위 경로가 인증 전 보호되고 작성·수정 동작이 로그인 및 소유권 규칙을 따른다.

**독립 검증**: 잠긴 요약본의 네 경로, 비로그인 작성 URL, 비작성자 수정 URL을 각각 직접 열어 비밀번호·세션·이동·버튼 노출 결과를 확인한다.

### 사용자 스토리 3 구현

- [X] T022 [US3] `src/app/(site)/summary/[summaryId]/layout.js`에 계약의 `isLocked`·`isSummaryVerified` 선행 판정과 기존 `NotePwModal`을 연결해 인증 전 보호 콘텐츠 비노출, 불일치 인라인 오류, 검증 중 중복 제출 차단과 성공 후 하위 경로 공유를 구현한다. (사용자 요청으로 범위 제외)
- [X] T023 [P] [US3] `src/app/(site)/summary/[summaryId]/notes/new/page.js`에 비로그인 직접 접근 시 `/login`으로 이동하는 권한 분기를 실제 Supabase 세션 경계로 구현한다.
- [X] T024 [P] [US3] `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.js`에 비작성자 직접 접근 시 현재 요약 상세 `/summary/[summaryId]`로 이동하는 소유권 분기를 실제 서비스 경계로 구현한다.
- [X] T025 [US3] `src/app/(site)/summary/[summaryId]/page.js`와 `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에서 학습노트 생성·수정·삭제 버튼을 로그인 및 작성자 권한에 따라 조건부 렌더링하고 활성화한다.
- [X] T026 [US3] `src/app/(site)/summary/[summaryId]/layout.js`에 비밀번호 모달 닫기 시 이전 페이지 이동, 시스템 오류 시 비밀번호 모달 종료 후 `CommonModal error`, 원문 비밀번호 미보관을 구현하고 외부 서비스의 브라우저 세션 인증 상태만 소비한다. (사용자 요청으로 범위 제외)
- [ ] T027 [US3] `specs/002-summary-detail/quickstart.md`의 시나리오 3·5를 실행해 네 경로 보호, 불일치 재입력, 같은 세션 재인증 생략, 새 세션 재인증, 비로그인·비작성자 차단과 권한별 버튼 노출을 독립 검증한다.

**확인 지점**: 인증 전 보호 콘텐츠 노출이 0건이고 모든 작성·수정 접근이 로그인 및 소유권 조건을 따른다.

---

## 6단계: 사용자 스토리 4 - 요약본과 학습노트 삭제 (우선순위: P2)

**목표**: 작성자가 확인 절차 후 자신의 요약본 또는 학습노트를 삭제하고 취소하면 현재 상태를 유지한다.

**독립 검증**: 작성자·비작성자의 버튼 노출, 요약본·학습노트 삭제 모달의 취소·승인, 연관 데이터 제거와 `/allnote` 이동을 확인한다.

### 사용자 스토리 4 구현

- [X] T028 [P] [US4] `src/app/(site)/summary/[summaryId]/page.js`, `src/app/(site)/summary/[summaryId]/SummaryDeleteButton.jsx`, `src/app/(site)/summary/[summaryId]/actions.js`에 학습노트가 없는 요약본의 작성자 전용 삭제 버튼, `CommonModal confirmDelete`, 요약본 삭제 연산과 성공 후 `/allnote` 이동을 구현한다.
- [X] T029 [P] [US4] `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에 학습노트 작성자 전용 삭제 버튼, `CommonModal confirmDelete`, 대상 학습노트 삭제 연산과 성공 후 `/summary/[summaryId]` 이동을 구현한다.
- [X] T030 [US4] `src/app/(site)/summary/[summaryId]/page.js`와 `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에서 취소 시 무변경·현재 페이지 유지, 승인 요청 중 중복 삭제 차단, 실패 시 현재 상태 보존과 `CommonModal error`를 구현한다.
- [ ] T031 [US4] `specs/002-summary-detail/quickstart.md`의 시나리오 6을 실행해 취소·승인, 소유권, 연관 삭제 범위, 중복 차단과 3초 이내 `/allnote` 이동을 독립 검증한다.

**확인 지점**: 삭제 취소는 데이터를 바꾸지 않고 작성자가 승인한 삭제만 정확한 범위로 한 번 실행된다.

---

## 7단계: 사용자 스토리 5 - 북마크와 퀴즈 이용 (우선순위: P3)

**목표**: 로그인 사용자가 요약본 북마크를 전환하고 저장된 학습노트 퀴즈를 풀어 채점 결과를 확인한다.

**독립 검증**: 로그인 여부별 북마크·퀴즈 동작, 저장 퀴즈 있음·없음·조회 실패, 답안 선택·제출·결과·닫기를 확인한다.

### 사용자 스토리 5 구현

- [X] T032 [P] [US5] `src/components/QuizModal.jsx`에 `isOpen`, `quiz`, `isUnavailable`, `onClose` 계약, 단일 답안 선택·제출, 정답·오답 결과, 이용 불가 상태와 닫기 시 내부 상태 초기화를 구현한다.
- [X] T033 [P] [US5] `src/components/QuizModal.module.scss`에 배경막, 문제·답안 선택 상태, 제출·닫기, 정답·오답·이용 불가 상태의 데스크톱 디자인과 접근 가능한 포커스 스타일을 구현한다.
- [X] T034 [P] [US5] `src/app/(site)/summary/[summaryId]/layout.js`에 로그인 사용자 전용 북마크 버튼, `aria-pressed`, 계약 기반 상태 전환, 요청 중 중복 차단, 실패 시 기존 상태 보존과 `CommonModal error`를 구현한다. (사용자 요청으로 범위 제외; 기존 레이아웃 유지)
- [ ] T035 [US5] `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에 로그인 사용자의 저장 퀴즈 조회와 `QuizModal`, 비로그인 사용자의 `CommonModal suggestLogin`, 저장 퀴즈 없음·조회 실패의 이용 불가 상태를 연결한다.
- [ ] T036 [US5] `specs/002-summary-detail/quickstart.md`의 시나리오 7을 실행해 북마크 성공·실패, 퀴즈 선택·제출·채점·닫기, 이용 불가와 비로그인 로그인 제안을 독립 검증한다.

**확인 지점**: 북마크는 서버 확정 상태를 표시하고 퀴즈는 하나의 모달 흐름에서 완료되며 비로그인 사용자는 보호된다.

---

## 최종 단계: 마무리 및 공통 검증

**목적**: 다섯 사용자 스토리의 통합 상태와 프로젝트 규칙 준수를 확인한다.

- [ ] T037 `src/app/(site)/summary/[summaryId]/page.js`, `src/app/(site)/summary/[summaryId]/notes/new/page.js`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.js`에서 404·권한·오류 모달·로딩 소유권과 중복 요청 차단이 충돌하거나 중복되지 않는지 점검한다. (공통 `layout.js` 제외)
- [ ] T038 `src/app/(site)/summary/[summaryId]/layout.module.scss`, `src/app/(site)/summary/[summaryId]/page.module.scss`, `src/app/(site)/summary/[summaryId]/notes/new/page.module.scss`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.module.scss`, `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.module.scss`, `src/components/NoteItem.module.scss`, `src/components/QuizModal.module.scss`의 데스크톱 디자인, 토큰 재사용, kebab-case와 JSX 대괄호 접근을 최종 점검한다.
- [X] T039 `package.json`의 `npm run lint`를 실행하고 이 기능에서 발생한 모든 lint 오류를 승인된 구현 파일 안에서 해결한다.
- [ ] T040 `package.json`의 `npm run build`를 실행해 동적 App Router 경로, Server/Client 경계와 대소문자 import가 production build에서 통과하는지 확인한다.
- [ ] T041 `specs/002-summary-detail/quickstart.md`의 시나리오 1~8을 순서대로 실행하고 다섯 사용자 스토리의 성공 기준과 범위 제외 조건을 최종 확인한다.

---

## 의존성과 실행 순서

### 단계 의존성

- **1단계 준비**: 즉시 시작할 수 있다. T003에서 실제 서비스 경계를 확인하지 못하면 이후 제품 코드 작업을 시작하지 않는다.
- **2단계 공통 선행 작업**: 준비 완료 후 실행하며 모든 사용자 스토리를 차단한다.
- **US1과 US2**: 공통 선행 작업 후 서로 독립적으로 시작할 수 있다.
- **US3**: 네 경로에 접근 제어를 통합하므로 US1과 US2의 대상 페이지 파일이 준비된 후 실행한다.
- **US4**: 요약 상세와 학습노트 상세의 소유권·버튼 영역이 필요하므로 US1, US2, US3 후 실행한다.
- **US5**: 요약 상세와 학습노트 상세가 필요하므로 US1, US2, US3 후 실행하며 US4와는 독립적으로 진행할 수 있다.
- **최종 단계**: 구현 대상으로 선택한 모든 사용자 스토리 완료 후 실행한다.

### 사용자 스토리 의존성 그래프

```text
준비 → 공통 선행 ┬→ US1 ─┬→ US3 ─┬→ US4 ─┐
                  └→ US2 ─┘       └→ US5 ─┤
                                           └→ 최종 검증
```

### 스토리별 독립 완료 기준

- **US1**: 공개 요약본의 목록·빈 상태·상세 및 전체 노트 이동을 다른 쓰기 기능 없이 검증할 수 있다.
- **US2**: 로그인 사용자의 생성·상세·수정을 삭제·북마크·퀴즈 없이 검증할 수 있다.
- **US3**: 잠긴 네 경로와 로그인·소유권 분기를 삭제 실행이나 퀴즈 없이 검증할 수 있다.
- **US4**: 작성자 삭제·취소·실패 흐름을 북마크·퀴즈 없이 검증할 수 있다.
- **US5**: 북마크와 퀴즈를 삭제 기능 없이 검증할 수 있다.

## 병렬 실행 예시

### 사용자 스토리 1

- T008 `NoteItem.jsx`와 T009 `NoteItem.module.scss`는 계약을 기준으로 서로 다른 파일에서 병렬 진행할 수 있다.

### 사용자 스토리 2

- T014·T015 작성 페이지, T016·T017 상세 페이지, T018·T019 수정 페이지는 서로 다른 경로에서 병렬 진행할 수 있다.
- T020 통합 로딩·오류 작업은 해당 페이지 작업 완료 후 실행한다.

### 사용자 스토리 3

- T022 공통 잠금 경계 완료 후 T023 작성 접근과 T024 수정 접근을 서로 다른 파일에서 병렬 진행할 수 있다.

### 사용자 스토리 4

- T028 요약본 삭제와 T029 학습노트 삭제는 서로 다른 페이지에서 병렬 진행할 수 있다.
- T030은 두 삭제 흐름을 통합 점검하므로 T028·T029 후 실행한다.

### 사용자 스토리 5

- T032 `QuizModal.jsx`, T033 `QuizModal.module.scss`, T034 북마크 페이지 작업은 서로 다른 파일에서 병렬 진행할 수 있다.
- T035 학습노트 상세 연결은 T032 완료 후 실행한다.

## 구현 전략

### MVP 우선

1. T001~T007로 서비스 관문과 공통 레이아웃을 완료한다.
2. T008~T013의 US1만 구현해 공개 요약본 읽기·목록 탐색 MVP를 완성한다.
3. `quickstart.md` 시나리오 1·2와 lint·build로 MVP를 검증한다.

### 점진적 제공

1. **MVP**: US1 요약본·목록 조회
2. **두 번째 증가분**: US2 학습노트 생성·상세·수정
3. **보호 증가분**: US3 잠금·로그인·소유권
4. **수명 주기 증가분**: US4 삭제
5. **학습 증가분**: US5 북마크·퀴즈
6. 각 증가분마다 해당 독립 검증을 완료한 뒤 다음 스토리로 이동한다.

## 참고

- T003 서비스 관문을 통과하지 못하면 Supabase, Route Handler, Server Action, 별도 데이터 폴더 또는 하드코딩 제품 데이터를 임의 생성하지 않는다. 사용자 승인에 따라 정적 UI와 비활성 상태만 선행할 수 있다.
- 실제 `src/components/Header.jsx`와 `src/app/(site)/summary` 경로를 유지하며 이름을 변경하지 않는다. `summary/[summaryId]/layout.js`는 사용자 요청으로 수정하지 않는다.
- 공통 `src/app/(site)/layout.js`의 Header·페이지 가로 정렬은 사용자 결정에 따라 이번 작업 범위에서 제외한다.
- 기존 `CommonModal`, `NotePwModal`, `Loading`의 공개 props를 변경하지 않는다.
- 같은 파일을 수정하는 작업은 동시에 실행하지 않으며 `[P]` 표시는 선행 의존성이 해소된 경우에만 적용한다.
- 실제 구현 전에 해당 단계의 수정 파일과 영향 범위를 사용자에게 다시 알리고 승인을 받는다.

## Phase 8: Convergence

- [X] T042 `src/mocks/summary-detail.js`에 기존 `summaries.json`, `learning-notes.json`, `users.json`, `bookmarks.json`을 변경하지 않고 `getMockSummary`, `getMockSummaryNotes`, `getMockStudyNote`, `getMockBookmarkState`, `MOCK_CURRENT_USER_ID`와 `YYYY.MM.DD` 날짜·본문·퀴즈 상태·작성자 fallback 정규화를 구현한다. per plan: mock 어댑터 (missing)
- [X] T043 `src/app/(site)/summary/[summaryId]/layout.js`에서 공통 mock 어댑터로 `summaryId` 단건을 조회해 주제와 AI 요약을 표시하고, 결과가 없으면 모든 하위 경로에서 `notFound()`가 실행되도록 연결한다. (사용자 요청으로 범위 제외, 기존 layout.js 유지)
- [X] T044 `src/app/(site)/summary/[summaryId]/page.js`에서 실제 `summaries`·`learning_notes`·`profiles`를 조회해 현재 `summaryId`의 학습노트만 최신 작성순으로 받아 작성자 닉네임·주제·`YYYY.MM.DD` 작성일·`completed`/`notStarted` 상태를 기존 `NoteItem`에 전달하고, 빈 배열에만 기존 `EmptyState`를 표시한다. per FR-043, FR-044, FR-045, FR-050
- [X] T045 `src/app/(site)/summary/[summaryId]/notes/[noteId]/page.js`에서 실제 `summaryId`와 `noteId`가 모두 일치하는 `learning_notes`를 조회해 제목과 세 본문 영역을 표시하고, 없거나 상위 관계가 다르면 `notFound()`로 처리한다. per FR-046, FR-047
- [X] T046 `src/app/(site)/summary/[summaryId]/layout.js`에서 `user-001`의 mock 북마크 상태를 읽기 전용으로 표시하고 로컬 북마크 토글, 제외 범위인 퀴즈·pathname 상태와 불필요한 Client Component 경계를 제거하되 기존 접근성 상태 설명은 현재 동작과 일치시킨다. (사용자 요청으로 범위 제외, 기존 layout.js 유지)
- [X] T047 `src/app/(site)/summary/[summaryId]/notes/[noteId]/edit/page.js`에서 실제 `learning_notes`의 제목·학습 내용·회고·참고자료를 기존 값으로 초기화하고, 없거나 상위 관계가 다르면 `notFound()`로 처리하며 실제 수정 Action과 검증·로딩·오류 상태를 연결한다. per FR-046, FR-047, FR-048
- [ ] T048 `specs/002-summary-detail/quickstart.md`의 실제 UUID 요약본·빈 목록·잘못된 UUID·학습노트 관계 일치/불일치·수정 초기값 시나리오를 실행하고 변경 파일 lint, build, `git diff --check` 및 기존 mock JSON 무변경을 검증한다. `summary/[summaryId]/layout.js`는 검증 범위에서 제외한다.

> **실제 MCP 확인 (2026-08-14)**: 현재 원격 DB의 실제 컬럼과 행을 기준으로 구현했지만 `public.summary_contents`에는 publishable key의 SELECT 권한이 없고 `public.learning_notes`에는 조회·변경 RLS 정책이 없다. 따라서 원격 정책 적용 전까지 요약 본문은 `summaries.excerpt` fallback을 사용하고 학습노트 CRUD의 최종 시나리오 검증은 보류한다. 이번 작업에서는 정책 변경이나 마이그레이션을 적용하지 않는다.
