#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

rm bin.nw
zip -r bin.nw *
node-webkit bin.nw "$@"