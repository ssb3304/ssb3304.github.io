# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

개인 학술 홈페이지 — 박사과정 유학 어플라이용. GitHub Pages로 호스팅하며, 순수 HTML/CSS/JS로 구성 (빌드 도구 없음).

## Architecture

```
site/           ← GitHub Pages 배포 대상 (루트)
  index.html    ← 메인 페이지
  css/          ← 스타일시트
  js/           ← 스크립트
  images/       ← 웹에서 사용하는 이미지 (최적화된 버전)
  documents/    ← 다운로드용 파일 (CV PDF 등)
content/        ← 원본 콘텐츠 소스 (배포 안 됨)
  profile/      ← 프로필 사진, 자기소개 원문
  research/     ← 연구 관련 자료, 논문 정보
  personal/     ← 취미, 활동 사진, 개인 에세이
```

## Deployment

- **호스팅**: GitHub Pages (`username.github.io`)
- **배포 폴더**: `site/` 디렉토리를 GitHub Pages source로 설정
- **배포 방법**: `site/` 내용을 GitHub repo에 push하면 자동 배포

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
cd site && python -m http.server 8000

# 이미지 최적화 후 site/images/로 복사하는 것은 수동으로 진행
```

## Key Conventions

- 모든 배포 파일은 `site/` 안에 위치
- `content/`는 원본 자료 보관용, 직접 배포되지 않음
- 이미지 파일명은 영문 소문자, 하이픈 구분 (e.g., `profile-photo.jpg`)
- CSS는 커스텀 작성 (프레임워크 미사용, 필요시 추가 가능)
- 한국어/영어 이중 언어 지원 가능성 고려
