# Front Digest Ai Development guide

## 프로젝트 개요

이 프로젝트는 Next.js 기반 팀 프로젝트다.

AI는 이 문서와 `docs/specs`에 작성된 명세를 기준으로 코드를 작성한다.
명세와 기존 코드에서 확인되지 않은 내용은 임의로 결정하지 않는다.

---

## 기술 스택

- Next.js App Router를 사용한다.
- JavaScript를 사용한다.
- 스타일은 SCSS를 사용한다.
- 인증과 데이터베이스는 Supabase를 사용할 예정이다.
- import alias로 `@/*`를 사용한다.

Supabase 인증, 데이터베이스 및 서버 통신의 구체적인 구조가 명세에 정의되지 않았다면 임의로 구현하지 않는다.

---

## 스타일 규칙

- 전역 스타일은 `.scss` 파일을 사용한다.
- 컴포넌트, 페이지, 레이아웃 전용 스타일은 SCSS Module을 사용한다.
- SCSS Module 파일명은 대상 파일명과 대응되도록 작성한다.

예:

```text
Header.jsx
Header.module.scss

page.js
page.module.scss
```

- SCSS Module 파일은 대상 JavaScript 파일에서 상대 경로로 import한다.

```js
import styles from "./page.module.scss";
```

- SCSS 내부에서 `src/styles`의 공통 파일을 불러올 때는 `styles/` 기준 경로를 사용한다.

```scss
@use "styles/abstracts/colors" as color;
@use "styles/abstracts/variables" as var;
@use "styles/abstracts/typography" as typography;
@use "styles/abstracts/mixins" as mixin;
```

- 공통 SCSS 파일을 불러올 때 `@/styles/...` 또는 긴 상대 경로를 혼용하지 않는다.

- 전역 스타일은 `src/app/globals.scss`에서 관리한다.
- 공통 색상, 변수, 믹스인, 타이포그래피는 `src/styles/abstracts`에서 관리한다.
- CSS Reset은 `src/styles/base/_reset.scss`에서 관리한다.
- 기존 스타일 구조를 임의로 변경하지 않는다.

---

## 프로젝트 구조

다음 프로젝트 구조를 유지한다.

```text
.
├── .github/
│
├── docs/
│   └── specs/
│
├── public/
│   └── images/
│
├── specs/
│
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.scss
│   │   ├── layout.js
│   │   │
│   │   ├── (dev)/
│   │   │   └── dev/
│   │   │       ├── layout.js
│   │   │       └── page.js
│   │   │
│   │   └── (site)/
│   │       ├── layout.js
│   │       ├── page.js
│   │       │
│   │       ├── login/
│   │       │   └── page.js
│   │       │
│   │       ├── signup/
│   │       │   ├── page.js
│   │       │   └── complete/
│   │       │       └── page.js
│   │       │
│   │       ├── summary/
│   │       │   ├── page.js
│   │       │   └── [summaryId]/
│   │       │       ├── layout.js
│   │       │       ├── page.js
│   │       │       └── notes/
│   │       │           ├── new/
│   │       │           │   └── page.js
│   │       │           └── [noteId]/
│   │       │               ├── page.js
│   │       │               └── edit/
│   │       │                   └── page.js
│   │       │
│   │       ├── allnote/
│   │       │   └── page.js
│   │       │
│   │       └── mypage/
│   │           ├── page.js
│   │           ├── summaries/
│   │           │   └── page.js
│   │           └── bookmarks/
│   │               └── page.js
│   │
│   ├── components/
│   │   ├── Header.jsx
│   │   ├── Banner.jsx
│   │   ├── CommonModal.jsx
│   │   ├── NotePwModal.jsx
│   │   ├── QuizModal.jsx
│   │   ├── NoteItem.jsx
│   │   ├── SummaryItemCard.jsx
│   │   ├── AllSummary.jsx
│   │   └── QuickLinkCard.jsx
│   │
│   └── styles/
│       ├── abstracts/
│       │   ├── _colors.scss
│       │   ├── _variables.scss
│       │   ├── _mixins.scss
│       │   └── _typography.scss
│       │
│       └── base/
│           └── _reset.scss
│
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── eslint.config.mjs
├── jsconfig.json
├── next.config.mjs
├── package.json
└── package-lock.json
```

- 기존 폴더와 파일 위치를 임의로 변경하지 않는다.
- 명세에 없는 폴더를 임의로 추가하지 않는다.
- 컴포넌트는 별도의 하위 폴더로 묶지 않고 `src/components`에 파일 단위로 작성한다.
- 새로운 구조가 필요하면 구현 전에 사용자에게 확인한다.

---

## 네이밍 규칙

### 컴포넌트

컴포넌트 이름과 컴포넌트 파일명은 PascalCase를 사용한다.

```text
Header.jsx
SummaryItemCard.jsx
PreparingModal.jsx
```

### JavaScript

변수명과 함수명은 camelCase를 사용한다.

```js
const summaryId = "";
const isModalOpen = false;

function handleSubmit() {}
function handleModalClose() {}
```

- 이벤트 처리 함수에는 `handle` 접두사를 사용한다.
- Boolean 값에는 가능한 경우 `is`, `has`, `can`, `should` 등의 접두사를 사용한다.

### CSS 클래스

CSS 클래스 이름은 kebab-case를 사용한다.

```scss
.summary-item-card {
}
.login-button {
}
.modal-content {
}
```

SCSS Module에서 kebab-case 클래스에 접근할 때는 대괄호 표기법을 사용한다.

```jsx
<div className={styles["summary-item-card"]} />
```

---

## 주석 규칙

- 코드만 읽어도 동작과 의미를 명확하게 알 수 있는 주석은 작성하지 않는다.
- 코드가 무엇을 하는지 그대로 반복하는 주석은 작성하지 않는다.
- 구현 이유, 상태의 책임, 예외 처리, 접근성 속성, cleanup과 같이 코드만으로 의도를 파악하기 어려운 내용에 주석을 작성한다.
- `role`, `aria-*`, `tabIndex`, `inert`와 포커스·키보드 제어처럼 접근성과 관련된 속성이나 로직에는 목적과 사용자 영향을 설명하는 주석을 반드시 작성한다.
- 임시 구현에는 이후 변경될 내용과 범위를 주석으로 명확히 표시한다.
- 임시 코드가 제거되거나 최종 구현으로 변경되면 관련 주석도 함께 제거하거나 수정한다.
- 주석은 현재 코드와 일치하도록 유지하며, 동작과 맞지 않는 오래된 주석을 남기지 않는다.

---

## Next.js 규칙

- App Router를 기준으로 구현한다.
- 페이지는 `app` 내부의 `page.js`로 작성한다.
- 공통 레이아웃은 필요한 경로의 `layout.js`로 작성한다.
- 정적으로 목적지가 정해진 이동은 `next/link`의 `Link`를 우선 사용한다.
- 서버 응답이나 조건에 따라 이동해야 할 때만 `next/navigation`의 `useRouter`를 사용한다.
- `useNavigate`와 React Router는 사용하지 않는다.
- 상태, 이벤트, 브라우저 API가 필요한 컴포넌트에만 `"use client"`를 작성한다.
- 필요하지 않은 파일을 Client Component로 변경하지 않는다.

---

## 컴포넌트 규칙

- 기존 공통 컴포넌트가 있으면 우선 재사용한다.
- 같은 역할의 컴포넌트를 중복 생성하지 않는다.
- 명세에 없는 공통화나 추상화를 임의로 진행하지 않는다.
- 페이지에서만 사용하는 간단한 요소는 무조건 공통 컴포넌트로 분리하지 않는다.
- 기존 컴포넌트의 props와 동작을 임의로 변경하지 않는다.
- 공통 컴포넌트 수정이 다른 페이지에 영향을 줄 수 있다면 구현 전에 영향 범위를 알린다.

---

## 명세 확인 규칙

- 구현 전 `docs/specs`에서 해당 기능 또는 페이지의 명세를 확인한다.
- `AGENTS.md`는 프로젝트 공통 규칙으로 사용한다.
- `docs/specs`의 문서는 페이지와 기능별 요구사항으로 사용한다.
- 명세에 없는 기능은 임의로 구현하지 않는다.
- 디자인만으로 알 수 없는 동작은 추측하지 않는다.
- 명세와 기존 코드가 충돌하면 바로 수정하지 말고 사용자에게 알린다.

---

## AI 작업 규칙

1. 구현 전 `AGENTS.md`와 관련 `docs/specs` 문서를 먼저 확인한다.
2. 명세에 없는 기능은 구현하지 않는다.
3. 요청하지 않은 라이브러리나 패키지를 설치하지 않는다.
4. 기존 폴더 구조와 네이밍 규칙을 임의로 변경하지 않는다.
5. 기존 공통 컴포넌트가 있으면 우선 재사용한다.
6. 구현 전에 수정하거나 생성할 파일과 구현 계획을 먼저 제시한다.
7. 사용자의 승인 없이 코드를 수정하지 않는다.
8. 요청하지 않은 리팩토링, 구조 변경, 최적화를 하지 않는다.
9. 요구사항이 불명확하면 임의로 추측하지 말고 사용자에게 확인한다.
10. 한 번에 하나의 기능만 구현한다.
11. 작업 범위와 관계없는 파일은 수정하지 않는다.
12. 기존 코드 삭제가 필요하면 삭제 이유와 영향 범위를 먼저 설명한다.

---

## Git 작업 규칙

- `main` 브랜치에 직접 push하지 않는다.
- 모든 작업은 `feature/*` 브랜치에서 진행한다.
- 기능 단위로 브랜치를 생성한다.

예:

```text
feature/main-page
feature/login
feature/signup
feature/summary-detail
feature/common-components
```

- 작업 완료 후 Pull Request를 생성한다.
- 팀원의 리뷰를 받은 후 `main`에 병합한다.
- 병합 후에는 로컬 `main` 브랜치를 최신 상태로 갱신하고 다음 작업을 시작한다.
- 하나의 브랜치에 관련 없는 여러 기능을 함께 작업하지 않는다.

---

## 금지 사항

다음 작업은 사용자의 명시적인 요청 없이 수행하지 않는다.

- TypeScript 전환
- Tailwind CSS 도입
- React Router 설치 또는 사용
- 상태 관리 라이브러리 도입
- 데이터 요청 라이브러리 도입
- 폴더 구조 변경
- 파일명 변경
- 공통 컴포넌트 구조 변경
- 요청 범위 밖의 리팩토링
- 명세에 없는 기능, 애니메이션 또는 UI 추가
- Supabase 인증 및 통신 구조 임의 결정
