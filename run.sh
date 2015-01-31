#!/usr/bin/env bash
cd $(dirname "${BASH_SOURCE[0]}")
D() { [ -d "$1" ] || mkdir -p "$1"; echo "$1"; }
RM() { [ -d "$1" ] || [ -f "$1" ] && rm -r "$1"; echo "$1"; }
exists() { type "$1" &>/dev/null; }
ar_xz() { tar -cf "${2%/}.tar" "$1"; xz -fv "${2%/}.tar"; }
ar_zip() { ditto -ckv --keepParent "$1" "${2%/}.zip"; }
PATH="$PATH:./node_modules/.bin"
shopt -s nullglob

TAGTIME_V=$(jq .version package.json -r)
ATOMSH_V=$(jq .special_dependencies.atom_shell package.json -r)
ATOMSH_ROOT="https://github.com/atom/atom-shell/releases/download/v$ATOMSH_V"

install() {
	exists npm            || { echo "expected npm to be on path"; err=1; }
	exists jq             || { echo "expected jq to be on path"; err=1; }
	exists github-release || { echo "expected github-release to be on path"; err=1; }
	exists xz             || { echo "expected xz to be on path"; err=1; }
	exists ditto          || { echo "expected ditto to be on path"; err=1; }
	[[ $err ]] && return 1

	[ -d node_modules ] || npm install

	pushd $(D bin) >/dev/null
	t="atom-shell-v$ATOMSH_V-darwin-x64.zip"; [ -f "$t" ] || { curl -LO "$ATOMSH_ROOT/$t"; rm -rf Atom.app; }
	[ -d Atom.app ] || { unzip -q "$t" 'Atom.app/*'; }
	t="atom-shell-v$ATOMSH_V-linux-x64.zip";  [ -f "$t" ] || { curl -LO "$ATOMSH_ROOT/$t"; }
	t="atom-shell-v$ATOMSH_V-win32-ia32.zip"; [ -f "$t" ] || { curl -LO "$ATOMSH_ROOT/$t"; }
	popd >/dev/null
	}
build() {
	install || return 1
	cp -r package.json resources node_modules *.html $(D $(RM bin/app))
	ζ₂ -c *.ζ₂ bin/app
	}
run() { bin/Atom.app/Contents/MacOS/Atom bin/app "$@"; }
build_release() {
	rm -rf node_modules; build || return 1

	unzip -q "bin/atom-shell-v$ATOMSH_V-darwin-x64.zip" 'Atom.app/*'
	mv Atom.app TagTime.app
	cp resources/tagtime.icns TagTime.app/Contents/Resources/atom.icns
	cp -r bin/app TagTime.app/Contents/Resources/
	ar_zip TagTime.app bin/TagTime-osx; rm -r TagTime.app

	unzip -q "bin/atom-shell-v$ATOMSH_V-linux-x64.zip" -d TagTime
	mv TagTime/atom TagTime/tagtime
	cp -r bin/app TagTime/resources/
	ar_xz TagTime bin/TagTime-linux; rm -r TagTime

	unzip -q "bin/atom-shell-v$ATOMSH_V-win32-ia32.zip" -d TagTime
	mv TagTime/atom.exe TagTime/tagtime.exe
	cp -r bin/app TagTime/resources/
	ar_zip TagTime bin/TagTime-windows; rm -r TagTime
	}
publish() {
	build_release || return 1
	github-release release -u alice0meta -r TagTime -t "v$TAGTIME_V" -d "ℕ"
	echo "uploading..."; github-release upload -u alice0meta -r TagTime -t "v$TAGTIME_V" -n TagTime-osx.zip -f bin/TagTime-osx.zip
	echo "uploading..."; github-release upload -u alice0meta -r TagTime -t "v$TAGTIME_V" -n TagTime-linux.tar.xz -f bin/TagTime-linux.tar.xz
	echo "uploading..."; github-release upload -u alice0meta -r TagTime -t "v$TAGTIME_V" -n TagTime-windows.zip -f bin/TagTime-windows.zip
	}

case "$1" in
dev_install) install;;
build) build_release;;
publish) publish;;
*) build && run "$@";;
esac

# start() { stop; (tagtime_start daemon &); }
# stop() { t=$(pgrep -f 'webkit.*tagtime'); [[ "$t" ]] && { echo "killing existing tagtime process $t"; kill $t; } }
# case "$1" in
# 	start) start;;
# 	stop) stop;;
# 	status) echo "tagtime is" $(pgrep -fq 'webkit.*tagtime' && echo running || echo not running);;
# 	sync) shift; ensure_node; sync.js "$@";;
# 	prompt) tagtime_start "$@";;
# 	*) if [[ $@ ]]; then echo 'usage: tagtime (| start | stop | status | sync --dry? | prompt <time>? <last tags>?)'; else start; fi;;
# esac
