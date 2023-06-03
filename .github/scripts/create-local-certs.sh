#!/bin/bash

set -e
certs_path="$PWD/shared/certs"
auto_agree="false"

if [[ "$1" == "-y" ]]; then
  auto_agree="true"
fi

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
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "mkcert를 설치하려면 choco가 필요합니다. choco 설치를 진행하시겠습니까? (y/N)"
    read -r answer
  fi
  if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
    exit 0
  fi
  powershell.exe -Command "Set-ExecutionPolicy Bypass -Scope Process -Force; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))"
}

install_mkcert_mac() {
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "mkcert를 설치합니다."
    echo "Enter key 입력을 통해 설치를 진행하세요."
    read -r answer
  fi
  brew install mkcert
}

install_mkcert_linux() {
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "mkcert를 설치합니다."
    echo "Enter key 입력을 통해 설치를 진행하세요."
    read -r answer
  fi
  sudo apt install libnss3-tools
  curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
  chmod +x mkcert-v*-linux-amd64
  sudo cp mkcert-v*-linux-amd64 /usr/local/bin/mkcert
}

install_mkcert_windows() {
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "mkcert를 설치합니다."
    echo "Enter key 입력을 통해 설치를 진행하세요."
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
  if mkcert -install &> /dev/null; then
    if [[ "$auto_agree" == "true" ]]; then
      answer="y"
    else
      echo "mkcert가 이미 실행된 기록이 있습니다. 계속 진행하시겠습니까? (y/N)"
      read -r answer
    fi
    if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
      exit 0
    fi
  fi
}

generate_certs() {
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "인증서를 생성하시겠습니까? (y/N)"
    read -r answer
  fi
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    mkcert -key-file $certs_path/dev-key.pem -cert-file $certs_path/dev-cert.pem localhost 127.0.0.1 ::1
    echo "인증서 생성이 완료되었습니다."
  fi
}

copy_certs() {
  if [[ "$auto_agree" == "true" ]]; then
    answer="y"
  else
    echo "인증서를 복사하시겠습니까? (y/N)"
    read -r answer
  fi
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    cp -r $certs_path "$PWD"/backend
    cp -r $certs_path "$PWD"/frontend
    echo "인증서를 backend/certs와 frontend/certs에 복사했습니다."
  fi
}

check_mkcert_installation
check_mkcert_executed
generate_certs
copy_certs
