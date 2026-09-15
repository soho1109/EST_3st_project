# 빠른 시작: 공통 빈 상태 안내 검증

## 사전 조건

- `feature/empty-state` 브랜치에서 구현한다.
- Node.js와 프로젝트 의존성이 설치되어 있다.
- [기능 명세](./spec.md), [UI 상태 모델](./data-model.md), [EmptyState UI 계약](./contracts/EmptyState.md)을 확인한다.
- 새 테스트 패키지나 데이터 요청 코드를 추가하지 않는다.

## 예상 구현 파일

```text
생성
src/components/EmptyState.jsx
src/components/EmptyState.module.scss

수정
src/components/Allsummary.jsx
src/app/(site)/Summary/[summaryId]/page.js
src/app/(site)/Summary/[summaryId]/page.module.scss
src/app/(site)/Mypage/page.js
```

기존 `public/images/clear.webp`는 그대로 재사용한다. `Allsummary.jsx`를 포함한 기존 파일과 폴더 이름은 변경하지 않는다.

## 실행

```bash
npm run dev
```

다음 화면을 브라우저에서 확인한다.

```text
http://localhost:3000/Summary
http://localhost:3000/Mypage/Mysummaries
http://localhost:3000/Mypage/Bookmarks
http://localhost:3000/Mypage
http://localhost:3000/Summary/{summaryId}
```

실제 라우팅의 대소문자는 현재 앱 경로를 기준으로 한다. 빈 목록이 없는 목 데이터 화면은 검증 중 호출 영역에 빈 컬렉션을 제공해 확인하고, 검증이 끝나면 임시 데이터 변경을 최종 변경에서 제외한다.

## 수동 검증 시나리오

1. 전체 요약본 결과를 빈 컬렉션으로 제공했을 때 `요약 노트가 아직 생성되지 않았습니다.`가 표시되는지 확인한다.
2. 나의 요약본 결과를 빈 컬렉션으로 제공했을 때 같은 문구가 표시되는지 확인한다.
3. 북마크 목록 결과를 빈 컬렉션으로 제공했을 때 `북마크한 요약 노트가 없습니다.`가 표시되는지 확인한다.
4. 마이페이지 북마크 정적 컬렉션이 비었을 때 북마크 섹션에 `북마크한 요약 노트가 없습니다.`가 표시되는지 확인한다.
5. 학습노트가 없는 요약 상세에서 `현재 리스트가 없습니다.`가 표시되는지 확인한다.
6. 각 빈 상태의 이미지, 크기, 간격, 색상과 문구 타이포그래피가 동일하고 목록 영역 중앙에 배치되는지 비교한다.
7. 다열 요약 목록과 마이페이지 북마크에서 EmptyState가 카드 한 칸에 갇히지 않고 목록 전체 너비를 차지하는지 확인한다.
8. 이미지가 안내 문구와 중복해 낭독되지 않고, 상태 문구가 보조 기술에 한 번 전달되는지 확인한다.
9. 각 목록에 항목을 하나 이상 제공했을 때 EmptyState가 사라지고 기존 카드 또는 학습노트만 표시되는지 확인한다.
10. 로딩 또는 오류 상태에서 EmptyState가 동시에 표시되지 않는지 확인한다.
11. EmptyState 내부에 버튼, 링크, 닫기, 재시도 또는 자동 이동 동작이 없는지 확인한다.

## 정적 검증

```bash
npm run lint
npm run build
git diff --check
```

세 명령이 오류 없이 종료되어야 한다. lint와 build 결과에는 새 컴포넌트의 import 오류, 접근성 속성 오류, SCSS 참조 오류가 없어야 한다.

## 범위 확인

- 새 패키지, API, 인증, 검색, 데이터 저장 또는 북마크 변경 코드가 없어야 한다.
- 새 앱 경로와 이미지 자산을 만들지 않아야 한다.
- `Allsummary.jsx`의 기존 필터·정렬·카드 전달 값과 페이지 import 경로를 변경하지 않아야 한다.
- 요약 상세의 버튼·제목·목록 외 레이아웃과 마이페이지의 프로필·학습노트·내 요약 노트 동작을 변경하지 않아야 한다.
- 페이지별 빈 상태 마크업과 스타일을 새로 복제하지 않아야 한다.
