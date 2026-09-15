# 데이터 모델: 로그인 페이지

이번 UI 우선 범위에서는 영속 데이터나 실제 세션을 생성하지 않는다. 로그인 화면에서 관리할 입력·검증·표시 상태와 추후 인증 연동 경계만 정의한다.

## LoginFormState

| 필드 | 형식 | 초기값 | 규칙 |
|---|---|---|---|
| `email` | String | 빈 문자열 | 필수이며 이메일 형식이어야 한다. 로그인 실패 후에도 유지한다. |
| `password` | String | 빈 문자열 | 필수이며 항상 마스킹한다. 자격 정보 실패 후 초기화한다. |
| `isLoading` | Boolean | `false` | 실제 요청 시작부터 종료까지 공통 Loading 표시와 인증 컨트롤 비활성화를 제어한다. |

## LoginValidationState

| 필드 | 형식 | 의미 |
|---|---|---|
| `isEmailTouched` | Boolean | 이메일 입력란을 벗어나 오류 공개 조건이 충족됐는지 나타낸다. |
| `isPasswordTouched` | Boolean | 비밀번호 입력란을 벗어나 오류 공개 조건이 충족됐는지 나타낸다. |
| `emailError` | String 또는 빈 값 | 필수 또는 이메일 형식 오류 문구다. |
| `passwordError` | String 또는 빈 값 | 비밀번호 필수 오류 문구다. |
| `validationMessage` | String 또는 빈 값 | 입력란 이탈 후 이메일 빈 값, 이메일 형식, 비밀번호 빈 값 순서로 선택한 단일 표시 문구다. |
| `formError` | String 또는 빈 값 | 이메일 또는 비밀번호 불일치 등 폼 전체 자격 정보 오류다. |
| `isFormValid` | Boolean 파생값 | 이메일과 비밀번호의 기본 검증이 모두 통과했는지 나타낸다. |

오류는 입력란 이탈 후 로그인 영역 하단의 고정된 단일 오류 공간에 표시한다. 사용자가 값을 수정하면 우선순위를 다시 계산하고 모든 값이 유효하면 문구를 제거한다. 로그인 버튼은 `isFormValid && !isLoading`일 때만 활성화할 수 있다.

## LoginModalState

| 필드 | 형식 | 의미 |
|---|---|---|
| `isModalOpen` | Boolean | 공통 모달 표시 여부다. |
| `modalMode` | `alreadyLoggedIn` 또는 `error` | 로그인 사용자 접근 안내 또는 시스템 장애 안내를 선택한다. |
| `errorStatus` | Number 또는 `network` | `error` 모드에서 CommonModal의 고정 문구와 이동 규칙을 선택한다. |

입력 검증과 자격 정보 불일치는 이 상태를 사용하지 않는다.

## SocialLoginProvider

| 제공자 | 아이콘 | 이번 단계 동작 |
|---|---|---|
| Kakao | `/images/kakao-icon.svg` | 버튼 UI만 제공하고 OAuth 요청은 연결하지 않는다. |
| Google | `/images/google-icon.svg` | 버튼 UI만 제공하고 OAuth 요청은 연결하지 않는다. |

## ResponsivePresentation

| 기준 화면 | 프레임 | 로그인 영역 | 입력 영역 | 로그인 버튼 | 소셜 버튼 |
|---|---:|---:|---:|---:|---:|
| 데스크톱 | `1320px` | `644px` | `534px` | `87px` | `56px × 56px` |
| 태블릿 | `1024px` | `534px` | `423px` | `87px` | `48px × 48px` |
| 모바일 | `480px` | `440px` | `325px` | `98px` | `48px × 48px` |

화면별 상태나 기능은 달라지지 않는다. 모든 화면에서 이메일 입력과 기본 세션 유지 안내를 제공하며 배경, Input 그림자와 placeholder 스타일은 데스크톱 기준을 사용한다.

## 상태 전이

```text
초기 상태
  ├─ 입력 변경 → 값 갱신 → 유효하면 해당 오류 제거
  ├─ 입력란 이탈 → 검증 → 필요한 입력 오류 표시
  └─ 유효한 폼 → 로그인 버튼 활성화

실제 인증 연동 이후
  로그인 제출
    → isLoading=true
    → 입력과 인증 버튼 비활성화 + 공통 Loading 표시
    ├─ 자격 정보 실패 → 이메일 유지 + 비밀번호 초기화 + 폼 오류
    ├─ 시스템 장애 → CommonModal error
    └─ 실제 성공 → 사용자 상태 갱신 + 확정된 세션 처리 + 메인 이동
    → 성공·실패와 관계없이 isLoading=false

로그인 사용자 접근
  → CommonModal alreadyLoggedIn
  → 3초 후 또는 닫기 선택 시 메인 이동
```

UI 우선 구현에서는 실제 인증 연동 이후의 요청·성공·실패 전이를 가짜로 실행하지 않는다.
