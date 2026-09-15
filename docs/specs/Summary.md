# 헤더 명세

**디자인 참조**:

- [요약노트 상세페이지 리스트 on]
  (https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=169-2177&t=kNn3PY8d8g5nG1hI-4)
- [요약노트 상세페이지/리스트 off]
  (https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=222-2221&t=kNn3PY8d8g5nG1hI-4)
- [학습노트 작성 및 수정페이지]
  (https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=169-2309&t=kNn3PY8d8g5nG1hI-4)
- [학습노트 상세 페이지]
  (https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=221-2172&t=kNn3PY8d8g5nG1hI-4)

# 요약 노트 상세

## 목적

AI가 생성한 요약본을 확인하고, 학습 노트를 생성·조회·수정·삭제하는 페이지이다.

---

## URL

- `/Summary/[summaryId]`
- `/Summary/[summaryId]/notes/new`
- `/Summary/[summaryId]/notes/[noteId]`
- `/Summary/[summaryId]/notes/[noteId]/edit`

---

## 접근 조건

- 게시글이 비밀번호로 잠겨 있는 경우 `NotePasswordModal`을 표시한다.
- 비밀번호 인증이 완료되면 페이지를 표시한다.

---

## 공통 구성

- Header (`header.md` 참고)

### 공통 Layout

`summary/[summaryId]/layout.js`

공통으로 표시되는 영역

- 생성 주제
- AI 요약본
- 하위 페이지({children})

---

# 1. 요약 노트 페이지

## URL

`/Summary/[summaryId]`

## 화면 구성

- 생성 주제
- AI 요약본
- 학습노트 생성 버튼
- 삭제 버튼
- 학습노트 리스트

## 기본 상태

### 학습노트가 없는 경우

- `EmptyState` 컴포넌트를 표시한다.

### 학습노트가 있는 경우

- `NoteItem` 컴포넌트를 `map()`을 이용하여 목록으로 표시한다.

## 사용자 행동

### 학습노트 생성

- 로그인한 사용자에게만 버튼을 표시한다.
- 버튼 클릭 → `/Summary/[summaryId]/notes/new`

### 삭제

- 요약 노트 작성자에게만 버튼을 표시한다.
- 버튼 클릭 시 공통 Modal(`mode="delete"`)을 표시한다.
- 삭제 확인 시 `/allnote`로 이동한다.

---

# 2. 학습노트 작성

## URL

`/Summary/[summaryId]/notes/new`

## 화면 구성

- 제목 입력(input)
- 내용 입력(input)
- 생성 버튼

## 기본 상태

- 제목 입력값은 비어 있다.
- 내용 입력값은 비어 있다.

## 사용자 행동

### 생성

- 생성 버튼 클릭
- 서버에 저장 요청
- 저장 성공 시 생성된 학습노트 상세 페이지로 이동한다.

---

# 3. 학습노트 상세

## URL

`/Summary/[summaryId]/notes/[noteId]`

## 화면 구성

- 제목
- 내용
- 퀴즈 버튼
- 수정 버튼
- 삭제 버튼

## 사용자 행동

### 퀴즈

#### 로그인 상태

- 퀴즈 버튼 클릭 시 `QuizModal`을 표시한다.

#### 비로그인 상태

- 퀴즈 버튼 클릭 시 공통 Modal(`mode="suggestLogin"`)을 표시한다.

### 수정

- 작성자에게만 버튼을 표시한다.
- 버튼 클릭 → `/Summary/[summaryId]/notes/[noteId]/edit`

### 삭제

- 작성자에게만 버튼을 표시한다.
- 버튼 클릭 시 공통 Modal(`mode="delete"`)을 표시한다.
- 삭제 확인 시 `/allnote`로 이동한다.

---

# 4. 학습노트 수정

## URL

`/Summary/[summaryId]/notes/[noteId]/edit`

## 화면 구성

- 제목 입력(input)
- 내용 입력(input)
- 수정 완료 버튼

## 기본 상태

- 기존 제목을 input value로 표시한다.
- 기존 내용을 input value로 표시한다.

## 사용자 행동

### 수정 완료

- 수정 완료 버튼 클릭
- 서버에 수정 요청
- 수정 성공 시 학습노트 상세 페이지로 이동한다.

---

## 상태 변화

- 학습노트 목록 변경
- 학습노트 생성
- 학습노트 수정
- 학습노트 삭제
- 공통 Modal 표시 및 닫기
- QuizModal 표시 및 닫기
- NotePasswordModal 표시 및 닫기

---

## 서버 요청

### 요약 노트 조회

- 요약 노트 정보 조회

### 학습노트 목록 조회

- 학습노트 목록 조회

### 학습노트 생성

요청 데이터

- 제목
- 내용

### 학습노트 수정

요청 데이터

- 제목
- 내용

### 학습노트 삭제

- 선택한 학습노트 삭제

---

## 성공 처리

- 생성 성공 → 생성된 학습노트 상세 페이지로 이동
- 수정 성공 → 학습노트 상세 페이지로 이동
- 삭제 성공 → `/allnote`로 이동

---

## 실패 처리

- 서버 오류 메시지를 표시한다.
- 구체적인 오류 문구는 미정이다.

---

## 유효성 검사

### 제목

- 필수 입력

### 내용

- 필수 입력

---

## 미정 사항

- 제목 최대 글자 수
- 내용 최대 글자 수
- 서버 오류 메시지
- 생성·수정 요청 중 로딩 UI
