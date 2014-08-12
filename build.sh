#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")
find.() { find -E . -maxdepth 1 -mindepth 1 "$@"; }

npm install &&
zip -FSrq tagtime.nw $(find. -type f) node_modules &&
tar -czf "$1" tagtime.nw &&
rm tagtime.nw