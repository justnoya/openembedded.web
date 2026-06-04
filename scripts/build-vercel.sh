#!/usr/bin/env bash
# Vercel build script — uses the committed Yarn 4 binary via yarnPath.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
YARN="node ${REPO_ROOT}/.yarn/releases/yarn.cjs"

echo "▶ Yarn version: $(${YARN} --version)"
echo "▶ Building components-sdk..."
${YARN} workspace components-sdk build

echo "▶ Building frontend..."
${YARN} workspace frontend build

echo "✓ Vercel build complete — output at frontend/dist"
