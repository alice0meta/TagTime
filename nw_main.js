require('./ζtt.js')
require('./aux.js')
var sync = require('./sync.js')



console.log('hey')








// <!DOCTYPE html>
// <html><head><meta charset="utf-8"></head><body></body></html><script>

// require('./tt_util.js')(window)
// var gui = require('nw.gui')
// var win = gui.Window.get()
// var tagtime = require('./tagtime.js')

// var argv = gui.App.argv
// if (argv[0]==='-d') {win.showDevTools(); argv=argv.slice(1)}

// tagtime.main({argv:argv
// </script>






// module.exports.main = function(args){
// 	prompt.impl = args.prompt
// 	var argv = args.argv
// 	switch (argv[0]) {
// 		case 'daemon': start_pings(); schedule_pings(); break
// 		case 'prompt':
// 			var t = isNaN(i(argv[1])); var time = t? now() : i(argv[1]); var prev = argv.slice(t?1:2).join(' ')
// 			prompt(function(time,cb){cb({time:time-2000,tags:prev}); if (prev) prev = prev.slice(0,-1)+String.fromCharCode(prev[-1].charCodeAt(0)+1)},function(e,gui){
// 				gui.ping({time:time, period:45})
// 				// gui.ping({time:time, period:45})
// 				gui.show(function(e,pings){print(_.pluck(pings,'tags').join('\n')); if (!e) process.exit()})
// 			})
// 			break
// 	} }






// var start_pings = function(){var t
// 	var n; clog("BEGIN last pingtime was",format_dur((n=now())-(t=ping_seq.le(n).time)),'ago, at',moment(t).format('HH:mm:ss'))
// 	ping_seq.le(((t=ping_file(rc.ping_file).$[-1])&&t.time) || now()); ping_seq.next() }
// var schedule_pings = function λ(){var t; var ps = ping_seq
// 	var already = []; while (ps[0].time <= now()) {already.push(ps[0]); ps.next()}
// 	if (already.length===0) {clog('WAITING till',moment(ps[0].time-123456),'+',123456); λ.at(ps[0].time)}
// 	else {
// 		clog('PROMPT for',already.map(function(v){return moment(v.time)}))
// 		prompt((function(pfl){return function(time,cb){var t; if (pfl.some(function(v){t=v; return v.time < time})) cb(t); else cb()}})(ping_file(rc.ping_file).$.reverse().slice(0,200)),
// 		function(e,gui){
// 			already.map(gui.ping)
// 			var λt; ;(function λ(){λt = (function(){if (gui.ping(ps[0])) {already.push(ps[0]); ps.next(); λ()}}).at(ps[0].time)})()
// 			gui.show(function(e,pings){
// 				clearTimeout(λt)
// 				if (pings.length !== already.length) {print('eep! I think you scrolled up!'); pings = pings.slice(pings.length - already.length)} //!
// 				pings.forEach(function(v){ping_file(rc.ping_file).append(v)})
// 				sync()
// 				λ()
// 			})
// 		})} }

// check for updates periodically and at start
// update command is:
// eval "$(curl -fsSL https://raw.github.com/alice0meta/TagTime/master/install.sh)"

