#!/usr/bin/env bash

if [ ! -f installed ]; then
	ruby -e "$(curl -fsSL https://raw.github.com/Homebrew/homebrew/go/install)"
	brew update
	brew install node
	npm install forever -g
	npm install
	cd ping-nw; npm install; cd ..

	mk() { cat >"$1"; chmod -R 755 "$1" &>/dev/null; }
mk /usr/local/bin/node-webkit <<'EOL'
#!/usr/bin/env bash
/Applications/node-webkit.app/Contents/MacOS/node-webkit $@
EOL

	echo "tagtime has been installed" > installed
fi

./stop.sh
forever start -a -l forever.txt -o ~/.forever/tt_out.txt -e ~/.forever/tt_err.txt --minUptime 1000ms --spinSleepTime 20s tagtime.js $@