#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")
PATH="/usr/local/bin:$PATH:.:./node_modules/.bin"

mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }

stop() { t=$(pgrep -f 'webkit.*tagtime'); if [ "$t" ]; then echo "killing existing tagtime process $t"; kill "$t"; fi; }

gen_tt_nw() { zip -FSrq bin/tagtime.nw $(for v in *; do if [ -f "$v" ]; then echo $v; fi; done) node_modules; }

main() {
	if [ -f "./node_modules/.bin/cmp-version" ]; then
		ver="$(cmp-version)"
		if [ "$ver" != "" ]; then
			echo "updating: $ver"
			git pull -q
			if [ -f "update.sh" ]; then update.sh; exit 0; fi
			gen_tt_nw
		fi
	fi

	mkdir bin &>/dev/null

	if [ ! -d bin/node-webkit.app ]; then
		nw_root="http://dl.node-webkit.org/v0.10.0/"
		nw_name="node-webkit-v0.10.0-osx-ia32"
		curl --compressed -O "$nw_root$nw_name.zip"
		unzip -q "$nw_name.zip"
		mv "$nw_name/node-webkit.app/" bin
		rm "$nw_name.zip"
		rm -r "$nw_name"
	fi

	if [ ! -f bin/tagtime.nw ]; then
		if [ ! -d node_modules ]; then
			type node &>/dev/null || {
				type brew &>/dev/null || { ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"; }
				brew install node
			}
			npm install >/dev/null
		fi
		gen_tt_nw
	fi

	stop
	(bin/node-webkit.app/Contents/MacOS/node-webkit bin/tagtime.nw "$@" &)
}

case "$1" in
	-r) rm bin/tagtime.nw; main "${@:2}";;
	stop) stop;;
	*) main "$@";;
esac