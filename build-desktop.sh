#!/bin/bash
set -e

echo "══════════════════════════════════════════"
echo "  OpenEmbedded — Desktop Build"
echo "══════════════════════════════════════════"

echo ""
echo "1/4  Building components SDK..."
node .yarn/releases/yarn.cjs workspace components-sdk build

echo ""
echo "2/4  Building React frontend..."
node .yarn/releases/yarn.cjs workspace frontend build

echo ""
echo "3/4  Installing Electron dependencies..."
node .yarn/releases/yarn.cjs workspace openembedded-desktop install

echo ""
echo "4/4  Packaging desktop app..."
cd electron
node_modules/.bin/electron-builder --linux
cd ..

echo ""
echo "✓ Build complete! Installer is in: electron/dist/"
echo ""
ls -lh electron/dist/*.AppImage 2>/dev/null || true
ls -lh electron/dist/*.exe 2>/dev/null || true
ls -lh electron/dist/*.dmg 2>/dev/null || true
