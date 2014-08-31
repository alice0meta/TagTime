require('./ζtt.js')
require('./aux.js')
var sync = require('./sync.js')

var open_broke_t //! gui.Window.open sometimes quietly fails D:
global.prompt_open_success = function(){clearTimeout(open_broke_t)}
var prompt = function(cb){gui.Window.open('prompt.html',{frame:false, show:false, 'always-on-top':true}).init_cb = cb; open_broke_t = prompt.in(5,cb)}

var schedule_pings = function(){var t
	var n; clog('BEGIN last ping was',moment(t=ping_seq.le(n=now()).time),'(',format_dur(n-t),'ago )')
	ping_seq.le(((t=ping_file(rc.ping_file).$[-1])&&t.time) || now()); ping_seq.next()
	;(function λ(){var t; var ps = ping_seq
		var already = []; while (ps[0].time <= now()) {already.push(ps[0]); ps.next()}
		if (already.length===0) {clog('WAITING till',ps[0].time); λ.at(ps[0].time)}
		else {
			clog('PROMPT for',already.map(function(v){return moment(v.time)}))
			prompt(function(e,gui){
				clog('SENDING PINGS',already._.pluck('time'))
				var pfl = ping_file(rc.ping_file).$.slice(-200); gui.ping_before(function(time,cb){if (pfl[-1]&&pfl[-1].time < time) cb(pfl.pop()); else cb()})
				already.map(gui.ping)
				var λt; ;(function λ(){λt = (function(){if (gui.ping(ps[0])) {already.push(ps[0]); ps.next(); λ()}}).at(ps[0].time)})()
				gui.show(function(e,pings){
					λt.clear()
					if (pings.length !== already.length) {print('eep! I think you scrolled up!'); pings = pings.slice(pings.length - already.length)} //!
					pings.forEach(function(v){ping_file(rc.ping_file).append(v)})
					clog('GOT PINGS',pings._.pluck('time'))
					sync()
					λ()
				})
			})} })() }

var schedule_update_checks = function λ(cb){cmp_versions(function(e,v){if (v) {clog('UPDATE tagtime',v); update(function(){clog('UPDATED to',JSON.parse(fs('package.json').$).version)})} else {if (cb) {cb(); cb = null}; λ.at(now()+3600)}})}

poll(function(){return global.window},function(e,v){
	global.gui = window.nwDispatcher.requireNwGui()
	global.win = gui.Window.get(window)
	var argv = gui.App.argv.slice(1)
	if (argv[-1]==='-d') {win.showDevTools(); argv=argv.slice(0,-1)}
	switch (argv[0]) {
		case 'daemon': schedule_update_checks(schedule_pings); break
		case 'prompt':
			var t = isNaN(i(argv[1])); var time = t? now() : i(argv[1]); var prev = argv.slice(t?1:2).join(' ')
			prompt(function(e,gui){
				gui.ping_before(function(time,cb){cb({time:time-2000,tags:prev}); prev = time+''})
				gui.ping({time:time, period:45})
				gui.show(function(e,pings){print(pings._.pluck('tags').join('\n')); if (!e) process.exit()})
			})
			break
		}
})