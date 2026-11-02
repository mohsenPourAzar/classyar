#!/usr/bin/env sh
set -eu
cd "$(dirname "$0")"
[ -d node_modules/mongodb ] || npm install
node server.mjs
