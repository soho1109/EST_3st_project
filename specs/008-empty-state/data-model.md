# 데이터 모델: 공통 빈 상태 안내

이 기능은 영속 데이터나 서버 엔티티를 추가하지 않는다. 호출 영역의 목록 표시 상태와 EmptyState 표현 값만 정의한다.

## ListDisplayState

| 항목        | 형식          | 허용 값                                                                        | 소유자    | 의미                                     |
| ----------- | ------------- | ------------------------------------------------------------------------------ | --------- | ---------------------------------------- |
| `status`    | 열거 상태     | `loading`, `error`, `ready`                                                    | 호출 영역 | 목록 조회 진행, 실패 또는 정상 완료 상태 |
| `itemCount` | 0 이상의 정수 | `0..n`                                                                         | 호출 영역 | 정상 완료된 목록의 항목 수               |
| `context`   | 목록 문맥     | `all-summary`, `my-summary`, `bookmarks`, `mypage-bookmarks`, `learning-notes` | 호출 영역 | 표시할 빈 상태 문구를 결정하는 목록 종류 |

### 검증 규칙

- `status`가 `ready`일 때만 `itemCount`를 빈 상태 판정에 사용한다.
- `status=ready`이고 `itemCount=0`이면 EmptyState를 표시한다.
- `status=ready`이고 `itemCount>0`이면 목록 항목을 표시한다.
- `status=loading` 또는 `status=error`이면 EmptyState를 표시하지 않는다.
- 한 목록 영역에서 EmptyState와 목록 항목을 동시에 표시하지 않는다.

## EmptyStatePresentation

| 항목      | 형식           | 필수 | 규칙                                                  |
| --------- | -------------- | ---- | ----------------------------------------------------- |
| `message` | 문자열         | 예   | 호출 문맥에 지정된 정확한 문구를 사용한다.            |
| 이미지    | 기존 정적 자산 | 예   | `/images/clear.webp`를 장식 이미지로 표시한다.        |
| 상호작용  | 없음           | 예   | 버튼, 링크, 닫기, 이동 또는 재시도를 제공하지 않는다. |

### 문맥별 문구 매핑

| `context`          | `message`                               |
| ------------------ | --------------------------------------- |
| `all-summary`      | `요약 노트가 아직 생성되지 않았습니다.` |
| `my-summary`       | `요약 노트가 아직 생성되지 않았습니다.` |
| `bookmarks`        | `북마크한 요약 노트가 없습니다.`        |
| `mypage-bookmarks` | `북마크한 요약 노트가 없습니다.`        |
| `learning-notes`   | `현재 리스트가 없습니다.`               |

## 상태 전이

```text
조회 시작
  → loading
  ├─ 조회 실패 → error → 기존 오류 처리
  └─ 조회 성공 → ready
                  ├─ itemCount = 0 → EmptyState 표시
                  └─ itemCount > 0 → 목록 표시

ready-empty
  └─ 항목 추가·조건 변경 → ready-with-items → EmptyState 제거 후 목록 표시

ready-with-items
  └─ 항목 삭제·조건 변경 → ready-empty → 목록 제거 후 EmptyState 표시
```

EmptyState는 상태 전이를 발생시키지 않으며 현재 상태를 표현하기만 한다.
