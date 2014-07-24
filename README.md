TagTime
=======

* install (homebrew)[http://brew.sh/]: `ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"`
* install (node-webkit)[https://github.com/rogerwang/node-webkit] to `/Applications` and add it to `/usr/local/bin`

		# adds node-webkit to /usr/local/bin
		mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }
		mk /usr/local/bin/node-webkit <<'EOL'
		#!/usr/bin/env bash
		/Applications/node-webkit.app/Contents/MacOS/node-webkit $@
		EOL

* run with `./run.sh`
* end the daemon with `./stop.sh`