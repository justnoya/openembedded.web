#!/bin/bash

echo "Installing dependencies..."
node .yarn/releases/yarn.cjs install

echo "Building database package..."
node .yarn/releases/yarn.cjs workspace database build

echo "Starting bot server..."
node .yarn/releases/yarn.cjs workspace backend start &
BOT_PID=$!

sleep 1

echo "Starting dev server..."
node .yarn/releases/yarn.cjs workspace frontend dev

kill $BOT_PID 2>/dev/null || true
