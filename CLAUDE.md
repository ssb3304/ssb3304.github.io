# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

개인 학술 홈페이지 — 박사과정 유학 어플라이용. GitHub Pages로 호스팅하며, 순수 HTML/CSS/JS로 구성 (빌드 도구 없음).

## Architecture

```
docs/           ← GitHub Pages 배포 대상 (main branch /docs folder)
  index.html    ← 메인 페이지
  css/          ← 스타일시트
  js/           ← 스크립트
  images/       ← 웹에서 사용하는 이미지 (최적화된 버전)
  documents/    ← 다운로드용 파일 (CV PDF 등)
content/        ← 원본 콘텐츠 소스 (배포 안 됨, .gitignore됨)
  profile/      ← 프로필 사진, 자기소개 원문
  research/     ← 연구 관련 자료, 논문 정보
  personal/     ← 취미, 활동 사진, 개인 에세이
```

## Deployment

- **호스팅**: GitHub Pages — https://ssb3304.github.io
- **저장소**: https://github.com/ssb3304/ssb3304.github.io
- **배포 설정**: GitHub Pages source = main branch, `/docs` folder
- **배포 방법**: 커밋 후 `git push` → 1~2분 후 라이브 반영
- **버전 관리**: 모든 수정사항은 commit으로 기록하여 rollback 가능

## Design Principles

- 학술적이면서도 인간적인 인상을 줘야 함 (PI가 보는 용도)
- 반응형 디자인 (모바일/태블릿/데스크톱)
- 깔끔하고 읽기 쉬운 타이포그래피
- 빠른 로딩 (이미지 최적화 필수)

## Content Sections (planned)

1. **Hero/About** — 첫인상, 간단한 자기소개
2. **Research** — 연구 관심사, 진행/완료된 프로젝트
3. **Publications** — 논문 목록
4. **Experience** — 학력, 경력 (CV 기반)
5. **Personal** — 취미, 관심사, 사진 (인간적 면모)
6. **Contact** — 이메일, 학술 SNS 링크

## Commands

```bash
# 로컬 미리보기 (Python 내장 서버)
cd docs && python -m http.server 8000

# 변경사항 배포
git add docs/
git commit -m "..."
git push
```

## Key Conventions

- 모든 배포 파일은 `docs/` 안에 위치
- `content/`는 원본 자료 보관용, .gitignore되어 푸시 안 됨
- 이미지 파일명은 영문 소문자, 하이픈 구분 (e.g., `profile-photo.jpg`)
- CSS는 커스텀 작성 (프레임워크 미사용, 필요시 추가 가능)
- 한국어/영어 이중 언어 지원 가능성 고려
