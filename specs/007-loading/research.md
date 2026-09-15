# 조사 결과: 공통 전체 화면 로딩

## 사용자 이벤트 요청 제어

**결정**: 로그인·저장·삭제·제출처럼 이벤트가 시작하는 Promise는 호출 측 Client Component의 Boolean `isLoading`으로 제어한다. 요청 시작 전에 `true`, 종료 시 `finally`에서 `false`로 복구하고 요청 중 재진입 컨트롤을 비활성화한다.

**근거**: React Suspense는 Effect 또는 이벤트 핸들러 안에서 시작한 데이터 요청을 자동으로 감지하지 않는다. 명시적 상태가 성공·실패 양쪽의 표시 종료와 중복 요청 차단을 가장 직접적으로 표현한다.

**대안**: React Transition의 pending 상태는 비긴급 UI 전환에 적합하지만 이번 명세의 전체 화면 차단 요청과 의미가 다르고 `isLoading` 정책이 확정되어 제외한다.

**참고**: [React Suspense](https://react.dev/reference/react/Suspense), [React useState](https://react.dev/reference/react/useState)

## Suspense 경계 배치

**결정**: 실제로 렌더 중 suspend하는 비동기 콘텐츠에만 수동 Suspense를 사용한다. 전체 화면 Loading을 사용할 콘텐츠는 하나의 상위 경계로 묶고 형제·중첩 경계마다 같은 전체 화면 fallback을 두지 않는다.

**근거**: 가장 가까운 Suspense 경계가 fallback을 표시하며 중첩 경계는 독립된 공개 순서를 만든다. 전체 화면 fallback을 여러 경계에 두면 오버레이가 겹칠 수 있다.

**대안**: 카드·목록별 skeleton은 점진 표시에는 유리하지만 별도 부분 로딩 명세가 없으므로 이번 공통 Loading 범위에서는 제외한다.

**참고**: [React Suspense](https://react.dev/reference/react/Suspense), [Next.js 데이터 가져오기와 Suspense](https://nextjs.org/docs/app/getting-started/fetching-data)

## `loading.js` 미사용

**결정**: 경로 단위 `loading.js`를 만들지 않고 필요한 코드 위치에 명시적인 Suspense 경계를 둔다.

**근거**: `loading.js`는 페이지와 하위 경로를 자동 Suspense 경계로 감싸는 편의 규약이다. 수동 경계도 지원되며 이번 프로젝트에서는 표시 소유 위치와 중복 여부를 코드에서 명확히 확인하는 정책을 선택했다.

**대안**: `loading.js`는 즉시 탐색 피드백과 부분 prefetch에 유리하지만 예상하지 못한 자동 적용과 수동 로딩 중복을 피하려는 사용자 요구에 따라 제외한다.

## 전체 화면 상호작용과 접근성

**결정**: viewport 고정 오버레이로 포인터 입력을 차단하고, 호출 측은 요청 중 뒤쪽 컨트롤을 비활성화한다. 로딩 영역에는 상태 역할과 live 안내를 제공하며 이미지는 장식으로 처리한다. 키보드로 뒤쪽 컨트롤을 실행할 수 없는지 개발 확인에 포함한다.

**근거**: 시각적 오버레이만으로는 키보드와 보조기술의 배경 접근까지 자동 차단되지 않으므로 호출 측의 disabled 처리와 상태 의미 제공이 함께 필요하다.

**대안**: 전역 Provider, native dialog 또는 전역 inert 관리는 단순 표시 컴포넌트보다 책임과 구조를 크게 확장하므로 제외한다.

**참고**: [ARIA live regions](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Guides/Live_regions), [HTML inert](https://developer.mozilla.org/docs/Web/HTML/Reference/Global_attributes/inert)

## 모션 감소

**결정**: 기본 상태에서는 원형으로 배치한 12개 막대의 투명도가 순서대로 바뀌고, 모션 감소 설정에서는 변화 주기를 현저히 늘린다. 두 줄 문구는 모션과 무관하게 처리 중 상태를 전달한다.

**근거**: 사용자 모션 환경설정을 존중하면서도 명세의 반복적 진행 표시를 유지할 수 있다.

**대안**: 링 전체 회전은 같은 모양의 막대가 반복되어 움직임과 속도 차이가 명확하지 않으므로 순차 투명도 방식을 선택한다.

**참고**: [prefers-reduced-motion](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion)

## 중복 방지

**결정**: 한 비동기 작업당 이벤트 `isLoading` 또는 렌더 Suspense 중 하나만 소유자로 선택한다. Loading은 전역 상태, 카운터, Promise 탐지 또는 자체 중복 조정을 하지 않는다.

**근거**: 호출부가 작업의 시작과 종료를 알고 있으므로 가장 작은 책임으로 중복을 방지할 수 있다.

**대안**: 전역 로딩 Provider와 참조 카운터는 여러 요청 조정에 사용할 수 있지만 새 상태 구조와 과도한 공통화를 만들므로 제외한다.

