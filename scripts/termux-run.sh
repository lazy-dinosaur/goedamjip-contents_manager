#!/bin/bash

# Termux에서 Goedamjip Docker 컨테이너 실행 스크립트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
IMAGE_NAME="goedamjip:latest"
CONTAINER_NAME="goedamjip"
HOST_PORT="1337"
CONTAINER_PORT="1337"

echo -e "${BLUE}=== Goedamjip Termux 실행 스크립트 ===${NC}"
echo

# Docker 설치 확인
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker가 설치되지 않았습니다.${NC}"
    echo "Termux에서 Docker 설치 방법:"
    echo "  pkg install docker"
    echo "  또는 proot-distro를 사용하세요."
    exit 1
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ .env 파일이 없습니다.${NC}"
    echo -e "${YELLOW}다음 중 하나를 수행하세요:${NC}"
    echo "1. .env.example을 복사하여 .env 생성:"
    echo "   cp .env.example .env"
    echo "2. 환경변수를 설정하여 .env 파일 생성"
    echo
    exit 1
fi

# 기존 컨테이너 확인 및 정리
if docker ps -a | grep -q "${CONTAINER_NAME}"; then
    echo -e "${YELLOW}⚠️  기존 컨테이너 발견: ${CONTAINER_NAME}${NC}"
    echo "기존 컨테이너를 중지하고 제거하시겠습니까? (y/N)"
    read -r answer
    if [[ $answer =~ ^[Yy]$ ]]; then
        echo "기존 컨테이너 중지 및 제거 중..."
        docker stop "${CONTAINER_NAME}" 2>/dev/null || true
        docker rm "${CONTAINER_NAME}" 2>/dev/null || true
        echo -e "${GREEN}✅ 기존 컨테이너 제거 완료${NC}"
    else
        echo -e "${RED}❌ 실행 중단${NC}"
        exit 1
    fi
fi

# Docker 이미지 확인
if ! docker images | grep -q "goedamjip"; then
    echo -e "${RED}❌ Docker 이미지를 찾을 수 없습니다: ${IMAGE_NAME}${NC}"
    echo
    echo -e "${YELLOW}다음 단계를 수행하세요:${NC}"
    echo "1. PC에서 빌드한 이미지 파일이 있는지 확인"
    echo "2. 이미지 로드:"
    echo "   gunzip -c goedamjip.tar.gz | docker load"
    echo "3. 이미지 확인:"
    echo "   docker images"
    echo
    exit 1
fi

# 업로드 디렉토리 생성
mkdir -p public/uploads
mkdir -p .tmp

echo -e "${YELLOW}🚀 Docker 컨테이너 실행 중...${NC}"
echo "이미지: ${IMAGE_NAME}"
echo "컨테이너명: ${CONTAINER_NAME}"
echo "포트: ${HOST_PORT}:${CONTAINER_PORT}"
echo

# Docker 컨테이너 실행
if docker run -d \
    --name "${CONTAINER_NAME}" \
    --env-file .env \
    -p "${HOST_PORT}:${CONTAINER_PORT}" \
    -v "$(pwd)/public/uploads:/app/public/uploads" \
    -v "$(pwd)/.tmp:/app/.tmp" \
    --restart unless-stopped \
    "${IMAGE_NAME}"; then
    
    echo -e "${GREEN}✅ 컨테이너 실행 완료!${NC}"
else
    echo -e "${RED}❌ 컨테이너 실행 실패${NC}"
    exit 1
fi

echo
echo -e "${BLUE}📊 컨테이너 상태 확인 중...${NC}"
sleep 3

# 컨테이너 상태 확인
if docker ps | grep -q "${CONTAINER_NAME}"; then
    echo -e "${GREEN}✅ 컨테이너가 정상적으로 실행 중입니다!${NC}"
    echo
    echo -e "${BLUE}🌐 접속 정보:${NC}"
    echo "  URL: http://localhost:${HOST_PORT}"
    echo "  Admin: http://localhost:${HOST_PORT}/admin"
    echo
    echo -e "${BLUE}🔧 유용한 명령어:${NC}"
    echo "  로그 확인: docker logs ${CONTAINER_NAME}"
    echo "  컨테이너 중지: docker stop ${CONTAINER_NAME}"
    echo "  컨테이너 재시작: docker restart ${CONTAINER_NAME}"
    echo "  컨테이너 제거: docker rm ${CONTAINER_NAME}"
    echo
    echo -e "${GREEN}🎉 Goedamjip이 성공적으로 실행되었습니다!${NC}"
else
    echo -e "${RED}❌ 컨테이너가 실행되지 않았습니다.${NC}"
    echo
    echo "로그 확인:"
    docker logs "${CONTAINER_NAME}" 2>/dev/null || echo "로그를 가져올 수 없습니다."
    exit 1
fi