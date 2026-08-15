#!/usr/bin/env bash
# Baixa o modelo de reconhecimento de voz em português para os assets do app.
#
# O modelo tem 51 MB descompactado e fica fora do git de propósito: é binário
# reinstalável, não código nosso. Rode isto uma vez antes do primeiro build.
set -euo pipefail

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DESTINO="$AQUI/app/src/main/assets/model-pt"
URL="https://alphacephei.com/vosk/models/vosk-model-small-pt-0.3.zip"

if [ -f "$DESTINO/final.mdl" ]; then
  echo "Modelo já está em app/src/main/assets/model-pt. Nada a fazer."
  exit 0
fi

TEMP="$(mktemp -d)"
trap 'rm -rf "$TEMP"' EXIT

echo "Baixando o modelo (~32 MB)…"
curl -fSL -o "$TEMP/modelo.zip" "$URL"

echo "Descompactando…"
unzip -q "$TEMP/modelo.zip" -d "$TEMP"

mkdir -p "$DESTINO"
cp -R "$TEMP"/vosk-model-small-pt-0.3/. "$DESTINO"/

echo "Pronto. $(find "$DESTINO" -type f | wc -l | tr -d ' ') arquivos em app/src/main/assets/model-pt."
