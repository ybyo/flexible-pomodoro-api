#!/bin/bash
set -e

sed -i s/^DB_BASE_URL=.*/DB_BASE_URL="${DB_BASE_URL}"/ "${ENV_PATH}"/."${NODE_ENV}".env
sed -i s/^REDIS_BASE_URL=.*/REDIS_BASE_URL="${REDIS_BASE_URL}"/ "${ENV_PATH}"/."${NODE_ENV}".env
sed -i s/^DB_BASE_URL=.*/DB_BASE_URL="${DB_BASE_URL}"/ "${ENV_PATH}"/.staging.env
sed -i s/^REDIS_BASE_URL=.*/REDIS_BASE_URL="${REDIS_BASE_URL}"/ "${ENV_PATH}"/.staging.env
