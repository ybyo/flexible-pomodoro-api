#!/bin/sh

set -e
certs_path="$PWD/shared/certs"
auto_agree="false"

if [ "$1" = "-y" ]; then
  auto_agree="true"
fi

REQUIRED_PKG="libnss3-tools"

check_mkcert_installation() {
  if ! command -v mkcert &> /dev/null; then
    if is_mac || is_linux; then
      install_mkcert
      if [ $? -ne 0 ]; then
        echo "mkcert 설치 중 오류가 발생했습니다."
        exit 1
      fi
    elif is_windows; then
      if ! command -v choco &> /dev/null; then
        install_choco
        if [ $? -ne 0 ]; then
          echo "choco 설치 중 오류가 발생했습니다."
          exit 1
        fi
      fi
      install_mkcert
      if [ $? -ne 0 ]; then
        echo "mkcert 설치 중 오류가 발생했습니다."
        exit 1
      fi
    else
      echo "mkcert가 설치되지 않았습니다."
      exit 1
    fi
  fi
}

is_windows() {
  [ -n "$WINDIR" ]
}

is_mac() {
  [ "$(uname -s)" = "Darwin" ]
}

is_linux() {
  [ "$(uname -s)" = "Linux" ]
}

install_choco() {
  if ! command -v choco &> /dev/null; then
     if [ "$auto_agree" = "true" ]; then
       answer="y"
     else
       echo "mkcert를 설치하려면 choco가 필요합니다. choco 설치를 진행하시겠습니까? (y/N)"
       read -r answer
     fi
     if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
       exit 0
     fi
     powershell.exe -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
     echo ""
     echo "choco 설치 완료됨..."
  fi
}

install_mkcert_mac() {
  if [ "$auto_agree" = "true" ]; then
    answer="y"
  else
    echo "mkcert를 설치합니다."
    echo "계속 하시려면 Enter 키를 눌러주세요."
    read -r answer
  fi
  brew install mkcert
}

install_mkcert_linux() {
  if ! dpkg-query -W -f='${Status}' $REQUIRED_PKG  | grep "ok installed"; then
   if [ "$auto_agree" = "true" ]; then
     answer="y"
   else
     echo "인증서 생성을 위해 libnss3-tools를 설치합니다. 계속 하시겠습니까? (y/N)"
     read -r answer
   fi

   if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
     exit 0
   fi

   sudo apt -y install libnss3-tools
   curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
   chmod +x mkcert-v*-linux-amd64
   sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
  fi
}

install_mkcert_windows() {
  if [ "$auto_agree" = "true" ]; then
    answer="y"
  else
    echo "mkcert를 설치합니다."
    echo "계속 하시려면 Enter 키를 눌러주세요."
    read -r answer
  fi
  choco install mkcert
}

install_mkcert() {
  if is_mac; then
    install_mkcert_mac
  elif is_linux; then
    install_mkcert_linux
  elif is_windows; then
    install_mkcert_windows
  fi
}

check_mkcert_executed() {
  if [ "$auto_agree" = "true" ]; then
    answer="y"
  else
    echo "mkcert로 생성할 인증서를 원활하게 이용하기 위해선 위해 루트 CA를 설치가 필요합니다. 설치하시겠습니까? (y/N)"
    read -r answer
    if [ "$answer" != "y" ] && [ "$answer" != "Y" ]; then
      exit 0
    fi
  fi
  mkcert --install
}

generate_certs() {
  if [ "$auto_agree" = "true" ]; then
    answer="y"
  else
    echo "'localhost', '127.0.0.1' 주소로 인증서를 생성하시겠습니까? (y/N)"
    read -r answer
  fi
  if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    mkdir -p "$certs_path"
    mkcert -key-file "$certs_path"/localhost.key -cert-file "$certs_path"/localhost.pem localhost 127.0.0.1 ::1
    echo "인증서 생성이 완료되었습니다."
  else
    exit 0
  fi
}

copy_certs() {
  if [ "$auto_agree" = "true" ]; then
    answer="y"
  else
    echo "인증서를 복사하시겠습니까? (y/N)"
    read -r answer
  fi
  if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
    cp -r "$certs_path" "$PWD"/backend
    cp -r "$certs_path" "$PWD"/frontend
    echo "인증서를 backend/certs와 frontend/certs에 복사했습니다."
  else
    exit 0
  fi
}

check_mkcert_installation
check_mkcert_executed
generate_certs
copy_certs
