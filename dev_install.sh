#!/usr/bin/env bash
cdmk() { [ -d "$1" ] || mkdir -p "$1"; cd "$1"; }
find.() { find -E . -maxdepth 1 -mindepth 1 "$@"; }
mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }

if [ ! -d dl ]; then cdmk dl/TagTime; git clone -b dl --single-branch https://github.com/alice0meta/TagTime.git; cd ~-; fi

mkdir -p .git/hooks &>/dev/null
mk .git/hooks/pre-commit <<'EOL'
#!/usr/bin/env bash
[[ $(diff package.json dl/TagTime/package.json) ]] && ( {
	./build.sh dl/TagTime/tagtime-latest-osx.tar.gz &&
	cp package.json dl/TagTime &&
	cd dl/TagTime &&
	git commit -a -m "automated" &&
	git push
	cd ~-
} &)
EOL