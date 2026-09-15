# 헤더 명세

**디자인 참조**:

- [비로그인 상태 헤더 접기](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=169-2145&t=3iCHQeW6XXOrpTpw-4)
- [비로그인 상태 헤더 펼치기](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=340-5069&t=3iCHQeW6XXOrpTpw-4)
- [로그인 상태 헤더 접기](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=230-3009&t=3iCHQeW6XXOrpTpw-4)
- [로그인 상태 헤더 펼치기](https://www.figma.com/design/hMYcO7OqUssWszYBKqTiml/%EB%94%94%EC%9E%90%EC%9D%B8-%EC%8B%9C%EC%97%B0%EC%9A%A9?node-id=340-5257&t=3iCHQeW6XXOrpTpw-4)

## 요구사항

Header
목적
공통 Layout 컴포넌트로 사용한다.
모든 페이지에서 공통으로 사용하는 사이드 헤더 컴포넌트이다.
적용 페이지
기본적으로 모든 페이지에서 사용한다.
기본 상태
기본값은 펼쳐진 상태이다.
아래 페이지는 예외적으로 접힌 상태로 시작한다.
/login
/signup
/signup/complete
화면 구성
펼쳐진 상태
상단
일반 로고 이미지
접기 버튼 (close Material Symbol)
사용자 영역 (가변)
비로그인 상태
로그인 버튼
회원가입 버튼
로그인 상태
프로필 이미지
닉네임
프로필 수정 버튼
로그아웃 버튼
사이트 메뉴
요약본 생성 (assignment_add)
전체 요약본 (book_4)
퀴즈 (quiz)
마이페이지 (person)
하단 메뉴
이용약관
개인정보처리방침
고객센터
접힌 상태
상단
미니 로고 이미지
사용자 영역 (가변)
비로그인 상태
회색 꿀벌 이미지
로그인 상태
꿀벌 이미지
사이트 메뉴
아이콘만 표시한다.
assignment_add
book_4
quiz
person
사용자 행동
펼쳐진 상태
상단
left_panel_close 클릭 시 Header를 접는다.
일반 로고 클릭 시 /로 이동한다.
비로그인
로그인 버튼 클릭 → /login
회원가입 버튼 클릭 → /signup
로그인
프로필 수정 버튼 클릭 → /mypage
로그아웃 버튼 클릭 → 로그아웃 처리 후 비로그인 Header로 변경, 메인페이지(/)로 이동
사이트 메뉴
요약본 생성 클릭 → /
전체 요약본 클릭 → /summary
퀴즈 클릭 → PreparingModal 표시
마이페이지 클릭 → /mypage
하단 메뉴
현재는 이동 링크만 제공한다.
이용약관
개인정보처리방침
고객센터
(실제 페이지는 추후 구현)
접힌 상태
미니 로고에 마우스를 올리면 left_panel_open 아이콘을 표시한다.
미니 로고 클릭 시 Header를 펼친다.
사이트 메뉴는 아이콘만 표시한다.
각 아이콘의 동작은 펼쳐진 상태와 동일하다.
상태 변화
Header
펼침 → 접힘
접힘 → 펼침
사용자 상태
비로그인
로그인
미정 사항
로그인한 사용자의 프로필, 닉네임 클릭 시 동작 여부
현재 활성 메뉴 표시 방식
모바일 화면에서의 Header 동작
