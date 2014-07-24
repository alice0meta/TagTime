#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")

rm bin.nw &>/dev/null
zip -r bin.nw * &>/dev/null
node-webkit bin.nw "$@"