#!/bin/bash
# Install dependencies using a local npm cache when working offline.

CACHE_DIR="./npm-cache"

if [ ! -d "$CACHE_DIR" ]; then
  echo "Cache directory $CACHE_DIR not found."
  echo "Create it by running 'npm install --cache $CACHE_DIR' on a machine with internet access."
  exit 1
fi

npm install --cache "$CACHE_DIR" --prefer-offline --no-audit --progress=false
