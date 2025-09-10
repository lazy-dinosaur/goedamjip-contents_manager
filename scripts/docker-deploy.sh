#!/bin/bash

# Docker 이미지 빌드 및 배포 스크립트
# PC에서 실행하여 Termux로 전송할 이미지 생성

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 설정
IMAGE_NAME="goedamjip"
IMAGE_TAG="latest"
FULL_IMAGE_NAME="${IMAGE_NAME}:${IMAGE_TAG}"
OUTPUT_FILE="${IMAGE_NAME}.tar.gz"

echo -e "${BLUE}=== Goedamjip Docker 배포 스크립트 ===${NC}"
echo

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json을 찾을 수 없습니다. 프로젝트 루트에서 실행해주세요.${NC}"
    exit 1
fi

if [ ! -f "Dockerfile" ]; then
    echo -e "${RED}❌ Dockerfile을 찾을 수 없습니다.${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Docker 이미지 빌드 중...${NC}"
echo "이미지명: ${FULL_IMAGE_NAME}"
echo

# Docker 이미지 빌드
if docker build -t "${FULL_IMAGE_NAME}" .; then
    echo -e "${GREEN}✅ Docker 이미지 빌드 완료${NC}"
else
    echo -e "${RED}❌ Docker 이미지 빌드 실패${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}💾 Docker 이미지를 tar.gz로 저장 중...${NC}"

# 기존 파일이 있으면 삭제
if [ -f "${OUTPUT_FILE}" ]; then
    rm "${OUTPUT_FILE}"
    echo "기존 ${OUTPUT_FILE} 파일 삭제됨"
fi

# Docker 이미지를 tar.gz로 저장
if docker save "${FULL_IMAGE_NAME}" | gzip > "${OUTPUT_FILE}"; then
    echo -e "${GREEN}✅ 이미지 저장 완료: ${OUTPUT_FILE}${NC}"
else
    echo -e "${RED}❌ 이미지 저장 실패${NC}"
    exit 1
fi

# 파일 크기 확인
FILE_SIZE=$(du -h "${OUTPUT_FILE}" | cut -f1)
echo "파일 크기: ${FILE_SIZE}"

echo
echo -e "${GREEN}🎉 배포 준비 완료!${NC}"
echo
echo -e "${BLUE}다음 단계:${NC}"
echo "1. ${OUTPUT_FILE} 파일을 Termux로 전송"
echo "   - USB 전송: adb push ${OUTPUT_FILE} /sdcard/"
echo "   - 클라우드 업로드 후 다운로드"
echo
echo "2. Termux에서 실행:"
echo "   ${YELLOW}cd /sdcard && cp ${OUTPUT_FILE} /data/data/com.termux/files/home/${NC}"
echo "   ${YELLOW}cd && gunzip -c ${OUTPUT_FILE} | docker load${NC}"
echo "   ${YELLOW}docker run -d --name goedamjip --env-file .env -p 1337:1337 ${FULL_IMAGE_NAME}${NC}"
echo
echo -e "${BLUE}💡 팁: termux-run.sh 스크립트를 사용하면 더 쉽게 실행할 수 있습니다.${NC}"