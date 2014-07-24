installation:

* install <https://github.com/rogerwang/node-webkit> ≥v0.10.0 to `/Applications` and add it to /usr/local/bin

		mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }
		mk /usr/local/bin/node-webkit <<'EOL'
		#!/usr/bin/env bash
		/Applications/node-webkit.app/Contents/MacOS/node-webkit $@
		EOL