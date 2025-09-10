# 🐳 Goedamjip Docker 가이드

Goedamjip을 Docker로 컨테이너화하여 Termux를 포함한 다양한 환경에서 실행할 수 있는 가이드입니다.

## 📋 목차

- [개요](#개요)
- [사전 요구사항](#사전-요구사항)
- [빠른 시작](#빠른-시작)
- [PC에서 이미지 빌드](#pc에서-이미지-빌드)
- [Termux에서 실행](#termux에서-실행)
- [환경 변수 설정](#환경-변수-설정)
- [문제 해결](#문제-해결)

## 🎯 개요

이 Docker 설정은 다음과 같은 특징을 가집니다:

- **보안**: 환경 변수를 이미지에 포함하지 않음
- **최적화**: 멀티스테이지 빌드로 이미지 크기 최소화
- **호환성**: ARM 아키텍처 지원 (Termux/Android)
- **안정성**: 헬스체크 및 자동 재시작 포함

## 📋 사전 요구사항

### PC (이미지 빌드용)
- Docker Desktop 또는 Docker Engine
- Git
- 인터넷 연결

### Termux (실행용)
- Docker 설치: `pkg install docker`
- 또는 proot-distro 사용
- 최소 2GB 여유 공간

## ⚡ 빠른 시작

### 1단계: PC에서 이미지 빌드
```bash
# 프로젝트 클론
git clone <repository-url>
cd goedamjip-contents-manager

# Docker 이미지 빌드 및 저장
./scripts/docker-deploy.sh
```

### 2단계: Termux로 전송
```bash
# PC에서 생성된 goedamjip.tar.gz를 Termux로 전송
# 방법 1: ADB 사용
adb push goedamjip.tar.gz /sdcard/

# 방법 2: 클라우드 스토리지 사용
# Google Drive, Dropbox 등에 업로드 후 Termux에서 다운로드
```

### 3단계: Termux에서 실행
```bash
# Termux에서
cd /sdcard
cp goedamjip.tar.gz /data/data/com.termux/files/home/
cd ~

# 이미지 로드
gunzip -c goedamjip.tar.gz | docker load

# 환경 변수 설정
cp .env.docker.example .env
nano .env  # 실제 값으로 수정

# 컨테이너 실행
./scripts/termux-run.sh
```

## 🏗️ PC에서 이미지 빌드

### 자동 빌드 (권장)
```bash
./scripts/docker-deploy.sh
```

### 수동 빌드
```bash
# Docker 이미지 빌드
docker build -t goedamjip:latest .

# 이미지 저장
docker save goedamjip:latest | gzip > goedamjip.tar.gz
```

### Docker Compose 사용
```bash
# 개발환경 (로컬 PostgreSQL 포함)
docker-compose --profile local-db up -d

# 프로덕션환경 (Supabase 사용)
docker-compose up -d
```

## 📱 Termux에서 실행

### 자동 실행 (권장)
```bash
./scripts/termux-run.sh
```

### 수동 실행
```bash
# 이미지 로드
docker load < goedamjip.tar.gz

# 컨테이너 실행
docker run -d \
  --name goedamjip \
  --env-file .env \
  -p 1337:1337 \
  -v $(pwd)/public/uploads:/app/public/uploads \
  -v $(pwd)/.tmp:/app/.tmp \
  --restart unless-stopped \
  goedamjip:latest
```

## ⚙️ 환경 변수 설정

### 환경 변수 파일 생성
```bash
cp .env.docker.example .env
```

### 필수 설정 항목

#### 1. Strapi 보안 키 (필수 변경!)
```bash
# 랜덤 키 생성
openssl rand -base64 32
```

#### 2. 데이터베이스 설정 (Supabase)
```env
DATABASE_URL=postgresql://username:password@host:5432/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### 3. Termux 최적화 설정
```env
NODE_OPTIONS="--max-old-space-size=1024"
NODE_ENV=production
```

## 🔧 유용한 명령어

### 컨테이너 관리
```bash
# 상태 확인
docker ps

# 로그 확인
docker logs goedamjip

# 컨테이너 재시작
docker restart goedamjip

# 컨테이너 중지
docker stop goedamjip

# 컨테이너 제거
docker rm goedamjip
```

### 이미지 관리
```bash
# 이미지 목록
docker images

# 이미지 제거
docker rmi goedamjip:latest

# 사용하지 않는 이미지 정리
docker image prune
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. Docker가 실행되지 않음 (Termux)
```bash
# Docker 서비스 시작
dockerd &

# 또는 proot-distro 사용
proot-distro install alpine
proot-distro login alpine
```

#### 2. 메모리 부족 오류
```bash
# .env 파일에서 메모리 제한 설정
NODE_OPTIONS="--max-old-space-size=512"
```

#### 3. 포트 충돌
```bash
# 다른 포트 사용
docker run -p 3000:1337 goedamjip:latest
```

#### 4. 환경 변수 오류
```bash
# 환경 변수 확인
docker exec goedamjip env | grep DATABASE
```

### 로그 분석
```bash
# 실시간 로그 확인
docker logs -f goedamjip

# 최근 100줄 로그
docker logs --tail 100 goedamjip
```

### 컨테이너 내부 접근
```bash
# 쉘 접근
docker exec -it goedamjip /bin/sh

# 파일 복사
docker cp goedamjip:/app/package.json ./
```

## 🚀 성능 최적화

### Termux용 최적화 설정
```env
# .env 파일
NODE_OPTIONS="--max-old-space-size=1024"
NODE_ENV=production
LOG_LEVEL=warn
```

### 메모리 사용량 모니터링
```bash
# 메모리 사용량 확인
docker stats goedamjip

# 시스템 리소스 확인
docker system df
```

## 🔐 보안 주의사항

1. **환경 변수 관리**
   - `.env` 파일을 버전 관리에 포함하지 마세요
   - 강력한 랜덤 키를 사용하세요

2. **네트워크 보안**
   - 필요한 포트만 노출하세요
   - 방화벽 설정을 확인하세요

3. **컨테이너 보안**
   - 정기적으로 이미지를 업데이트하세요
   - 불필요한 권한을 부여하지 마세요

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Docker 로그: `docker logs goedamjip`
2. 시스템 리소스: `docker stats`
3. 환경 변수: `.env` 파일 설정
4. 네트워크: 포트 및 방화벽 설정

---

**🎉 Docker로 Goedamjip을 성공적으로 실행하세요!**