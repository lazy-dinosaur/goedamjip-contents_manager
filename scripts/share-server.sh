#!/bin/bash

# 간단한 Python HTTP 서버 시작 스크립트

echo "🐳 Goedamjip 파일 공유 서버 시작"
echo

# Python 버전 확인
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
else
    echo "❌ Python이 설치되지 않았습니다."
    exit 1
fi

# 필요한 파일들 확인
echo "📁 공유할 파일들 확인 중..."

files_to_check=("goedamjip.tar.gz" ".env" "scripts/termux-run.sh")
missing_files=()

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "  ✅ $file ($size)"
    else
        echo "  ❌ $file (없음)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo
    echo "⚠️  일부 파일이 누락되었습니다. 계속 진행하시겠습니까? (y/N)"
    read -r answer
    if [[ ! $answer =~ ^[Yy]$ ]]; then
        echo "중단됨"
        exit 1
    fi
fi

echo
echo "🚀 HTTP 서버 시작 중..."

# 고급 서버 (share-files.py) 먼저 시도
if [ -f "scripts/share-files.py" ]; then
    $PYTHON_CMD scripts/share-files.py
else
    # 기본 Python HTTP 서버 사용
    echo "📡 기본 Python HTTP 서버 사용"
    PORT=8000
    
    # 로컬 IP 확인
    if command -v ip &> /dev/null; then
        LOCAL_IP=$(ip route get 1 | awk '{print $7; exit}' 2>/dev/null)
    elif command -v ifconfig &> /dev/null; then
        LOCAL_IP=$(ifconfig | grep -Eo 'inet (addr:)?([0-9]*\.){3}[0-9]*' | grep -v '127.0.0.1' | head -1 | awk '{print $2}' | cut -d: -f2)
    else
        LOCAL_IP="localhost"
    fi
    
    echo "📡 서버 주소: http://$LOCAL_IP:$PORT"
    echo "📱 Termux에서 접속:"
    echo "   wget http://$LOCAL_IP:$PORT/goedamjip.tar.gz"
    echo "   wget http://$LOCAL_IP:$PORT/.env"
    echo
    echo "정지하려면 Ctrl+C를 누르세요"
    echo
    
    # Python 버전에 따라 다른 명령어 사용
    if [[ $($PYTHON_CMD -c "import sys; print(sys.version_info[0])") == "3" ]]; then
        $PYTHON_CMD -m http.server $PORT
    else
        $PYTHON_CMD -m SimpleHTTPServer $PORT
    fi
fi