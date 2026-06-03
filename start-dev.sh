#!/bin/bash

YARN4="/tmp/yarn4.js"
YARN4_URL="https://repo.yarnpkg.com/4.10.3/packages/yarnpkg-cli/bin/yarn.js"

if [ ! -f "$YARN4" ]; then
  echo "Downloading Yarn 4..."
  curl -fsSL "$YARN4_URL" -o "$YARN4"
fi

echo "Installing dependencies..."
node "$YARN4" install

echo "Starting bot server..."
node "$YARN4" workspace backend start &
BOT_PID=$!

# Give the backend a moment to bind its port
sleep 1

echo "Starting dev server..."
node "$YARN4" workspace frontend dev

# Clean up backend when frontend exits
kill $BOT_PID 2>/dev/null || true
