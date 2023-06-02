#!/bin/bash

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
  [[ -n "$WINDIR" ]]
}

is_mac() {
  [[ "$(uname -s)" == "Darwin" ]]
}

is_linux() {
  [[ "$(uname -s)" == "Linux" ]]
}

install_choco() {
  echo "mkcert를 설치하려면 choco가 필요합니다. choco 설치를 진행하시겠습니까? (y/N)"
  read -r answer
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    exit 0
  fi
  powershell.exe -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
}

install_mkcert_mac() {
  echo "mkcert를 설치합니다."
  brew install mkcert
}

install_mkcert_linux() {
  echo "mkcert를 설치합니다."
  sudo apt install libnss3-tools
  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
  chmod +x mkcert-v*-linux-amd64
  sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
}

install_mkcert_windows() {
  echo "mkcert를 설치합니다."
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
  if mkcert -install &> /dev/null; then
    echo "mkcert가 이미 실행된 기록이 있습니다. 계속 진행하시겠습니까? (y/N)"
    read -r answer
    if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
      exit 0
    fi
  fi
}

generate_certs() {
  mkcert -key-file ../certs/dev-key.pem -cert-file ../certs/dev-cert.pem localhost 127.0.0.1 ::1
  echo "인증서 생성이 완료되었습니다."
}

copy_certs() {
  cp -r ../certs ../../backend
  cp -r ../certs ../../frontend
  echo "인증서를 backend/certs와 frontend/certs에 복사했습니다."
}

check_mkcert_installation
check_mkcert_executed
generate_certs
copy_certs
