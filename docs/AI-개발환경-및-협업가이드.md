# AI 개발환경 및 협업 가이드

## Supabase 개발 환경

Supabase 패키지 설치, 환경변수, CLI 연결과 공통 인증 코드 사용 방법은 [Supabase 개발 환경 안내](../supabase/README.md)를 확인하세요.

## AI 개발 환경 설정

제품 코드와 AI 설정 파일은 다음과 같이 분리하여 관리합니다.

- `development`: 웹사이트 코드, 페이지 명세, Spec Kit으로 생성한 명세 등 제품 영역
- `tooling/ai-config`: Codex, Claude, Copilot, Spec Kit 설정
- `AGENTS.md`, `CLAUDE.md`: 프로젝트 공통 규칙이므로 `development`에서 관리

`tooling/ai-config`는 AI 설정 관리용 브랜치입니다. 직접 수정하거나 `development`에 병합하지 마세요. 수정이 필요한 경우 AI 설정 담당자에게 알려주세요.

### 제품 코드 업데이트

프로젝트 루트에서 최신 `development`를 받습니다.

```powershell
git switch development
git pull origin development
```

AI 설정 분리 이후 처음 업데이트하는 경우 `.agents`, `.claude`, `.specify` 등의 폴더가 사라질 수 있습니다. 정상적인 동작이며, 아래 과정으로 다시 받을 수 있습니다.

### AI 설정 설치 및 업데이트

먼저 최신 Tooling 브랜치 정보를 받습니다.

```powershell
git fetch origin tooling/ai-config
```

AI 설정만 현재 프로젝트 폴더에 복원합니다.

```powershell
git restore --source=origin/tooling/ai-config --worktree -- .agents .claude .specify .github/agents .github/prompts .vscode/settings.json
```

설치 여부는 다음 명령으로 확인할 수 있습니다.

```powershell
".agents",".claude",".specify",".github/agents",".github/prompts",".vscode/settings.json" | ForEach-Object { "$_ : $(Test-Path $_)" }
```

모든 항목이 `True`로 나오면 정상입니다.

AI 설정 파일은 `.gitignore`에 등록되어 있으므로 로컬에는 존재하지만 제품 브랜치의 커밋과 Pull Request에는 포함되지 않습니다. AI 설정이 업데이트됐다는 안내를 받은 경우에도 동일하게 `fetch`와 `restore` 명령을 다시 실행하면 됩니다.

> 제품 브랜치에서 `git pull origin tooling/ai-config`를 실행하거나 Tooling 브랜치를 `development`에 병합하지 마세요. AI 설정은 반드시 `fetch + restore` 방식으로 적용합니다.

### 일반 기능 개발

기능 개발은 `development`에서 기능 브랜치를 생성하여 진행합니다.

```powershell
git switch development
git pull origin development
git switch -c feature/기능명
```

작업 완료 후 기능 브랜치를 푸시하고 `development`를 대상으로 Pull Request를 생성합니다.

```powershell
git add .
git commit -m "feat: 작업 내용"
git push -u origin feature/기능명
```
