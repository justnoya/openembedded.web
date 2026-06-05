#!/bin/bash

echo "Clearing stale port bindings..."
fuser -k 3001/tcp 2>/dev/null || true
fuser -k 5000/tcp 2>/dev/null || true
sleep 1

echo "Installing dependencies..."
node .yarn/releases/yarn.cjs install

echo "Building database package..."
node .yarn/releases/yarn.cjs workspace database build

echo "Starting bot server..."
node .yarn/releases/yarn.cjs workspace backend start &
BOT_PID=$!

sleep 2

echo "Starting dev server..."
node .yarn/releases/yarn.cjs workspace frontend dev

kill $BOT_PID 2>/dev/null || true
