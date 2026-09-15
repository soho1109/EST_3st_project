# 메인 페이지

**디자인 참조**:

- [비로그인](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=340-4781&t=fRhEDYxVjC4Xw8sH-4)
- [로그인](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=193-2422&t=fRhEDYxVjC4Xw8sH-4)

# 메인 페이지

## 목적

사용자가 요약할 주제를 입력하고 요약 노트를 생성할 수 있는 메인 페이지다.

---

## URL

`/`

---

## 공통 구성

- Header
  - `header.md` 참고

---

## 화면 구성

### Hero 영역

- 마스코트 이미지
- 안내 문구
- 주제 입력 input
- 생성 버튼
  - `arrow_upward` Material Symbol 사용
- 비밀번호 사용 checkbox
- 비밀번호 입력 input

### 배너 영역

- 광고 이미지
- 광고 페이지로 이동하는 링크

### 바로가기 카드 영역

- 전체 요약 노트
- 퀴즈
- 마이페이지

---

## 기본 상태

- 주제 입력값은 비어 있다.
- 비밀번호 사용 checkbox는 체크 해제 상태다.
- 비밀번호 입력 input은 비활성화 상태다.
- `SuggestLoginModal`은 닫혀 있다.
- `PreparingModal`은 닫혀 있다.

---

## 사용자 행동

### 주제 입력

- 사용자가 주제 input에 값을 입력하면 입력값을 표시한다.

### 비밀번호 사용

- checkbox를 체크하면 비밀번호 입력 input을 활성화한다.
- checkbox를 해제하면 비밀번호 입력 input을 비활성화한다.
- checkbox가 체크된 경우 비밀번호를 반드시 입력해야 한다.
- checkbox가 해제된 경우 비밀번호 값은 서버 요청에 사용하지 않는다.

### 생성 버튼

#### 로그인 상태

- 생성 버튼 클릭 시 주제와 비밀번호 관련 값을 서버에 전송한다.
- 생성 성공 시 반환된 `summaryId`를 사용해 `/summary/[summaryId]`로 이동한다.

#### 비로그인 상태

- 서버 요청을 보내지 않는다.
- `SuggestLoginModal`을 표시한다.

### 배너

- 배너 클릭 시 지정된 광고 페이지로 이동한다.
- 실제 이동 URL은 추후 확정한다.

### 바로가기 카드

- 전체 요약 노트 클릭 → `/summary`

- 퀴즈 클릭
  - `PreparingModal` 표시

- 마이페이지 클릭
  - 로그인 상태 → `/mypage`
  - 비로그인 상태 → `SuggestLoginModal` 표시

---

## 로그인 권장 모달

비로그인 상태에서 다음 경우에 표시한다.

- 생성 버튼 클릭
- 마이페이지 카드 클릭

### 사용자 행동

- 로그인 버튼 클릭 → `/login`
- 전체 요약 노트 버튼 클릭 → `/summary`
- 닫기 버튼(`close` Material Symbol) 클릭 → 모달 닫기

---

## 준비 중 모달

퀴즈 카드를 클릭하면 표시한다.

### 사용자 행동

- 닫기 버튼(`close` Material Symbol) 클릭 → 모달 닫기

---

## 서버 요청

### 요청 시점

로그인 상태에서 생성 버튼을 클릭했을 때 요청한다.

### 요청 데이터

- 주제
- 비밀번호 사용 여부
- 비밀번호
  - 비밀번호 사용 여부가 `true`일 때만 포함

### 성공 처리

- 서버가 반환한 `summaryId`로 `/summary/[summaryId]` 이동

### 실패 처리

- 미정

---

## 상태 변화

- 주제 입력값 변경
- 비밀번호 사용 여부 변경
- 비밀번호 입력값 변경
- `SuggestLoginModal` 열림 / 닫힘
- `PreparingModal` 열림 / 닫힘
- 생성 요청 중 상태

---

## 유효성 검사

- 주제 입력은 필수다.
- 비밀번호 사용 checkbox가 체크된 경우 비밀번호 입력은 필수다.
- 구체적인 최소·최대 글자 수는 미정이다.

---

## 미정 사항

- 주제 최대 글자 수
- 비밀번호 입력 조건과 최대 글자 수
- 생성 요청 중 로딩 UI
- 서버 요청 실패 시 메시지와 표시 방식
- 배너 이동 URL
- 마이페이지 카드의 비로그인 사용자 처리 방식
