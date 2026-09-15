# 빠른 시작: 공통 모달 검증

## 사전 조건

- Node.js와 프로젝트 의존성이 설치되어 있다.
- 구현 단계에서 아래 세 파일만 생성한다.
  - `src/components/CommonModal.jsx`
  - `src/components/CommonModal.module.scss`
  - `src/app/(dev)/dev/commonmodal/page.js`
- 기존 `src/app/(dev)/dev/page.js`는 수정하지 않는다.

## 실행

```powershell
npm run dev
```

브라우저에서 `http://localhost:3000/dev/commonmodal`로 접근한다.

## 개발 확인 페이지 구성

- 여섯 `mode`를 각각 선택해 하나의 `CommonModal` 인스턴스를 열 수 있어야 한다.
- `error` 모드에서는 `401`, `403`, `404`, `429`, `500`, `502`, `503`, `504`, `network`, 미지원 상태를 선택할 수 있어야 한다.
- `confirmDelete`의 `onConfirm` 결과는 개발 페이지의 임시 상태 문구로만 확인하고 실제 삭제는 수행하지 않는다.
- 실제 API, 인증, 데이터베이스, 세션과 제품 페이지 이동 검증용 모의 요청을 만들지 않는다.

## 수동 검증 시나리오

1. `preparing`을 열고 닫아 현재 개발 페이지가 유지되는지 확인한다.
2. `confirmDelete`에서 취소와 닫기가 승인 결과를 만들지 않는지, 삭제가 승인 결과를 한 번만 만드는지 확인한다.
3. `suggestLogin`의 두 버튼 목적지가 각각 `/login`, `/summary`인지 확인하고 닫기는 현재 페이지를 유지하는지 확인한다.
4. `requireLogin`이 3초 후 `/login`으로 한 번 이동하는지 확인한다.
5. `alreadyLoggedIn`은 3초 후 `/`, `error`는 401이면 `/login`, 나머지 상태면 `/`로 한 번 이동하는지 확인한다.
6. 자동 이동 전에 닫기를 눌러 즉시 같은 목적지로 이동하고 3초 뒤 중복 이동이 없는지 확인한다.
7. 모든 오류 선택에서 [`contracts/CommonModal.md`](./contracts/CommonModal.md)의 고정 문구와 상태별 이동 안내가 표시되는지 확인한다.
8. 배경막 클릭과 Escape 입력으로 모달이 닫히지 않고 뒤쪽 컨트롤도 작동하지 않는지 확인한다.
9. 같은 개발 페이지에서 공통 모달이 두 개 이상 겹치지 않는지 확인한다.
10. 프비 이미지, 닫기 아이콘, 흰색 둥근 컨테이너, 회색 배경막, 중앙 정렬과 버튼 구성이 제공 디자인과 일치하는지 확인한다.

자동 이동은 현재 히스토리를 교체하므로 검증 후에는 브라우저 주소창에서
`http://localhost:3000/dev/commonmodal`에 다시 접근해 다음 모드를 확인한다.

## 정적 검증

```powershell
npm run lint
npm run build
```

두 명령 모두 오류 없이 종료되어야 한다.

## 범위 확인

- API, Supabase, 실제 삭제, 인증·세션 판정 코드가 없어야 한다.
- 새로운 패키지와 상태 관리 라이브러리가 추가되지 않아야 한다.
- `src/app/(dev)/dev/page.js`와 제품 페이지에 변경이 없어야 한다.
