#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Goedamjip Docker 파일 공유 서버
간단한 HTTP 서버로 Docker 이미지와 환경변수 파일을 공유합니다.
"""

import http.server
import socketserver
import os
import sys
import socket
from io import StringIO

# qrcode는 선택적 import
try:
    import qrcode
    HAS_QRCODE = True
except ImportError:
    HAS_QRCODE = False

class ColoredHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """색상과 로그가 포함된 HTTP 요청 핸들러"""
    
    def log_message(self, format, *args):
        """요청 로그를 색상과 함께 출력"""
        print(f"\033[92m[{self.log_date_time_string()}]\033[0m {format % args}")
    
    def end_headers(self):
        """응답 헤더에 CORS 허용 추가"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

def get_local_ip():
    """로컬 IP 주소 가져오기"""
    try:
        # 외부 서버에 연결을 시도하여 로컬 IP 확인
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

def generate_qr_code(url):
    """QR 코드 생성 (ASCII)"""
    if not HAS_QRCODE:
        return "QR 코드 기능 비활성화 (pip install qrcode[pil] 로 설치 가능)"
    
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=1,
            border=1,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # ASCII로 QR 코드 출력
        f = StringIO()
        qr.print_ascii(out=f)
        f.seek(0)
        return f.read()
    except Exception as e:
        return f"QR 코드 생성 실패: {e}"

def create_index_html():
    """다운로드 페이지 HTML 생성"""
    files = []
    
    # Docker 이미지 파일 확인
    if os.path.exists('goedamjip.tar.gz'):
        size = os.path.getsize('goedamjip.tar.gz') / (1024 * 1024)
        files.append(f'<li><a href="goedamjip.tar.gz">📦 goedamjip.tar.gz</a> ({size:.1f}MB)</li>')
    
    # 환경변수 파일들
    env_files = ['.env', '.env.docker.example', '.env.termux']
    for env_file in env_files:
        if os.path.exists(env_file):
            files.append(f'<li><a href="{env_file}">⚙️ {env_file}</a></li>')
    
    # 스크립트 파일들
    script_files = ['scripts/termux-run.sh', 'scripts/docker-deploy.sh']
    for script_file in script_files:
        if os.path.exists(script_file):
            files.append(f'<li><a href="{script_file}">📜 {script_file}</a></li>')
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>🐳 Goedamjip Docker Files</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
            h1 {{ color: #2c3e50; text-align: center; }}
            ul {{ list-style: none; padding: 0; }}
            li {{ margin: 10px 0; padding: 15px; background: #ecf0f1; border-radius: 5px; }}
            a {{ text-decoration: none; color: #3498db; font-weight: bold; }}
            a:hover {{ color: #2980b9; }}
            .instructions {{ background: #e8f5e8; padding: 20px; border-radius: 5px; margin-top: 20px; }}
            .code {{ background: #2c3e50; color: #ecf0f1; padding: 10px; border-radius: 3px; font-family: monospace; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🐳 Goedamjip Docker Files</h1>
            <p>Termux에서 사용할 파일들을 다운로드하세요:</p>
            
            <ul>
                {''.join(files)}
            </ul>
            
            <div class="instructions">
                <h3>📱 Termux에서 실행 방법:</h3>
                <div class="code">
                # 1. 파일 다운로드<br>
                wget http://IP:8000/goedamjip.tar.gz<br>
                wget http://IP:8000/.env<br>
                wget http://IP:8000/scripts/termux-run.sh<br><br>
                
                # 2. Docker 이미지 로드<br>
                gunzip -c goedamjip.tar.gz | docker load<br><br>
                
                # 3. 실행<br>
                chmod +x termux-run.sh<br>
                ./termux-run.sh
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)

def main():
    PORT = 8000
    
    print("\033[94m" + "=" * 50)
    print("🐳 Goedamjip Docker 파일 공유 서버")
    print("=" * 50 + "\033[0m")
    
    # index.html 생성
    create_index_html()
    
    # 서버 시작
    try:
        with socketserver.TCPServer(("", PORT), ColoredHTTPRequestHandler) as httpd:
            local_ip = get_local_ip()
            
            print(f"\n\033[92m✅ 서버가 시작되었습니다!\033[0m")
            print(f"📡 로컬 주소: http://localhost:{PORT}")
            print(f"🌐 네트워크 주소: http://{local_ip}:{PORT}")
            print(f"\n\033[93m📱 Termux에서 접속:\033[0m")
            print(f"   wget http://{local_ip}:{PORT}/goedamjip.tar.gz")
            print(f"   wget http://{local_ip}:{PORT}/.env")
            
            # QR 코드 생성 (선택사항)
            url = f"http://{local_ip}:{PORT}"
            print(f"\n\033[96m📱 QR 코드로 접속:\033[0m")
            qr_code = generate_qr_code(url)
            print(qr_code)
            
            print(f"\n\033[91m정지하려면 Ctrl+C를 누르세요\033[0m")
            print("-" * 50)
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print(f"\n\033[92m✅ 서버가 정상적으로 종료되었습니다.\033[0m")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"\033[91m❌ 포트 {PORT}이 이미 사용 중입니다.\033[0m")
            print(f"다른 포트를 사용하려면: python3 {sys.argv[0]} --port 8001")
        else:
            print(f"\033[91m❌ 서버 시작 실패: {e}\033[0m")

if __name__ == "__main__":
    main()