#!/usr/bin/env bash
set -e

# ==============================================================================
# Script de Deploy PWA: AWS S3 + Amazon CloudFront
# ==============================================================================

# Carrega arquivo .env se existir
if [ -f .env ]; then
  echo "📄 Carregando variáveis do arquivo .env..."
  set -a
  source .env
  set +a
fi

# Validação de variáveis obrigatórias
if [ -z "$AWS_S3_BUCKET" ]; then
  echo "❌ ERRO: A variável AWS_S3_BUCKET não foi definida."
  echo "Por favor, defina AWS_S3_BUCKET no arquivo .env ou no terminal."
  exit 1
fi

AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_S3_PREFIX="${AWS_S3_PREFIX:-}"
# Garante barra no final do prefixo se não estiver vazio
if [ -n "$AWS_S3_PREFIX" ] && [[ "$AWS_S3_PREFIX" != */ ]]; then
  AWS_S3_PREFIX="${AWS_S3_PREFIX}/"
fi

TARGET_S3_URI="s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX}"

# Função para executar comandos AWS (usando aws cli nativo ou container Docker)
run_aws() {
  if command -v aws >/dev/null 2>&1; then
    aws "$@"
  elif command -v docker >/dev/null 2>&1; then
    docker run --rm \
      -e AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
      -e AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
      -e AWS_SESSION_TOKEN="$AWS_SESSION_TOKEN" \
      -e AWS_DEFAULT_REGION="$AWS_REGION" \
      -v "$HOME/.aws:/root/.aws:ro" \
      -v "$(pwd):/project" \
      -w /project \
      amazon/aws-cli --region "$AWS_REGION" "$@"
  else
    echo "❌ Nem 'aws' CLI nem 'docker' foram encontrados no sistema."
    echo "Instale o AWS CLI (ex: sudo apt install awscli ou pip install awscli)."
    exit 1
  fi
}

echo "=========================================================="
echo "🚀 Iniciando Build e Deploy do Relatório PWA"
echo "Destino: ${TARGET_S3_URI}"
echo "Região:  ${AWS_REGION}"
if [ -n "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "CDN:     CloudFront ID ${AWS_CLOUDFRONT_DISTRIBUTION_ID}"
fi
echo "=========================================================="

# 1. Compilação de Produção
echo "📦 Compilando aplicação PWA (npm run build)..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Falha no build: diretório dist/ não foi gerado."
  exit 1
fi

# 2. Upload de Assets Estáticos com Cache Longo (1 ano)
echo "📤 Enviando assets estáticos com cache imutável (max-age=31536000)..."
run_aws s3 sync dist/ "${TARGET_S3_URI}" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "sw.js" \
  --exclude "*.webmanifest" \
  --exclude "workbox-*.js"

# 3. Upload de Arquivos de Ciclo de Vida do PWA (No-Cache)
echo "📤 Enviando index.html, sw.js e manifest com cache-control no-cache..."

run_aws s3 cp dist/index.html "${TARGET_S3_URI}index.html" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "text/html"

# Garante funcionamento tanto sem barra quanto com barra no final (/relatorio-servicos e /relatorio-servicos/)
if [ -n "$AWS_S3_PREFIX" ]; then
  CLEAN_PREFIX="${AWS_S3_PREFIX%/}"
  run_aws s3 cp dist/index.html "s3://${AWS_S3_BUCKET}/${CLEAN_PREFIX}" \
    --cache-control "no-cache, no-store, must-revalidate" \
    --content-type "text/html"

  run_aws s3api put-object \
    --bucket "$AWS_S3_BUCKET" \
    --key "${CLEAN_PREFIX}/" \
    --body dist/index.html \
    --content-type "text/html" \
    --cache-control "no-cache, no-store, must-revalidate"
fi

run_aws s3 cp dist/sw.js "${TARGET_S3_URI}sw.js" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/javascript"

run_aws s3 cp dist/manifest.webmanifest "${TARGET_S3_URI}manifest.webmanifest" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --content-type "application/manifest+json"

for f in dist/workbox-*.js; do
  if [ -f "$f" ]; then
    fname=$(basename "$f")
    run_aws s3 cp "$f" "${TARGET_S3_URI}${fname}" \
      --cache-control "no-cache, no-store, must-revalidate" \
      --content-type "application/javascript"
  fi
done

# 4. Invalidação de Cache no CloudFront
if [ -n "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
  INVALIDATION_PATH="/*"
  if [ -n "$AWS_S3_PREFIX" ]; then
    INVALIDATION_PATH="/${AWS_S3_PREFIX}*"
  fi

  echo "🔄 Solicitando invalidação de cache no CloudFront (${INVALIDATION_PATH})..."
  run_aws cloudfront create-invalidation \
    --distribution-id "$AWS_CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "$INVALIDATION_PATH"
  echo "✅ Invalidação solicitada com sucesso!"
fi

echo "=========================================================="
echo "🎉 Deploy concluído com sucesso no AWS S3 & CloudFront!"
echo "=========================================================="
