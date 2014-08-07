require('./tt_util.js')()

// sometime eventually:
// expand reset_before to make ping_seq faster to start up
// instead of ignoring non-parsed beeminder graph pings, maybe zero the datapoints and annotate the comment? like, 28 1 "foo" → 28 0 "foo [was 1; zeroed by tagtime syncing]"
// concurrency oh god

// roadmapy:
// we want to deploy to windows, osx, linux, webapp, android, and ios

// todo back:
// have read_graph cache its results
// ‽ implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
//     so, when i took five minutes to consider "what would be a *good* interface for tagging?", i thought of "what about a field of 2-dimensional tag-cells, with size proportional to frequency, that can be persistently dragged around?"
// ?? maybe allow multidirectional sync with beeminder graphs ??
// "Tiny improvement to TagTime for Android: pings sent to Beeminder include the time in the datapoint comment"
// consider reenabling seed: 666, // for pings not in sync with other peoples' pings, change this
// "an installer for node-webkit" https://github.com/shama/nodewebkit
// maybe prepare the gui beforehand so that we can make it come up on exactly the right instant?
// maybe separate the processes *again* to get rid of that blur bug
// tray menu! https://gist.github.com/halida/9634676
// email tagtime? for ios, until we properly deploy to ios?
// if we make a web request and it doesn't work, we need to not crash
// it's too easy to let a ping window get lost
// // ! comments
// do make sure the tag functions don't chew up (comments)

// todo:
//! ??sortedness of ping files??
//! bah, fuck, i ate the timezone information again. fix?
//! fix the cause of # NB: restart the daemon (tagtimed.pl) if you change this file. // you need to listen for changes to the settings file
//! maybe do add the off autotag too
//! btw, we should have a logfile
//! danny's rc.beeminder dsl is observed to only contain tag, (& tags), (| tags), and (! tag)
//! it's actually finally clear how to separate this into different files
//! people who don't use tagtime all the time want "only run during certain hours" and "don't bother logging afk/canceled pings" modes
//! handle being pinged while you're typing
//! "(@alice, in case this is an easy fix: i drag the tagtime prompt to secondary screen and leave it there. on next ping it jumps to the corresponding place on primary screen. better if it didn't move on you)"
//! oh dear, it looks like it isn't pinging me for previous pings overnight until the next ping? uh.

// most urgent todo:
//! improve the autoupdater: make it more robust, more convenient, and check for updates more frequently than just every time it runs. and check for local updates.
//!     whoops, it doesn't run npm install
//! automatically run on startup

//===-------------------===// get args and settings //===------------------===//

//! so we should refactor this to make command-line args and rc file more synonymous and stuff.

var args = minimist(argv._,{alias:{dry:'d',settings:'s'}, default:{settings:'~/.tagtime.json'}})

if (!fs(args.settings).exists()) {
	fs(args.settings).$ = (fs('settings.js').$+'').replace(/‹([^›]+)›/g,function(_,v){var t; return is(t=eval(v))?t:''})
	print("hey, I've put a settings file at",args.settings,"for you. Go fill it in!")
	exec("open -a TextEdit '"+fs(args.settings).realpath()+"'") }

try {var rc = JSON.parse((fs(args.settings).$+'').replace(/\/\/.*/g,''))}
catch (e) {print('ERROR: bad rc file:',e); process.exit(1)}

rc.p = rc.ping_file
if (!fs(rc.p).exists()) fs(rc.p).$ = ''

rc.ping_sound = rc.ping_sound || 'loud-ding.wav'

//===------------------===// ... auxiliary modules ? //===-----------------===//

// less hacky hacky partial beeminder api
var beeminder = (function(){
	var http = require('http')
	var https = require('https')
	var request = function(method,path,query,headers,cb){
		var t = path.match(/^(https?):\/\/(.*)$/); var http_ = t[1] === 'http'? http : https; path = t[2]
		var t = path.match(/^(.*?)(\/.*)$/); var host = t[1]; path = t[2]
		query = seq(query).map(function(v){return encodeURIComponent(v[0])+'='+encodeURIComponent(v[1])}).join('&')
		path = path+(query===''?'':'?'+query)
		clog('request:',method,host+path)
		http_.request({host:host,path:path,headers:headers,method:method},function(resp){
			var t = []; resp.on('data', function(chunk){t.push(chunk)}); resp.on('end', function(){
				t = t.join('')
				var err=null; var json; try {json = JSON.parse(t)} catch (e) {err = e}
				cb(err,{json:json,string:t,response:resp}) }) }).end() }
	return function(v){var a = arguments; var cb = a[a.length-1]; var arg = a.length > 2? a[1] : undefined
		var base = 'https://www.beeminder.com/api/v1/'
		var auth = {auth_token:rc.beeminder.auth}
		var t0 = cb; cb = function(e,v){if (!e && (v.error || (v.errors && v.errors.length > 0))) t0(v.error||v.errors,v); else t0(e,v)}
		var t1 = cb; cb = function(e,v){t1(e, e? v : v.json)}
		var ug = v.match(/^(.+)\/(.+)$/)
		var ugd = v.match(/^(.+)\/(.+)\.datapoints$/)
		var ugdc = v.match(/^(.+)\/(.+)\.datapoints ~=$/)
		var ugdu = v.match(/^(.+)\/(.+)\.datapoints\[(.+)\] =$/)
		if (!ug) request('GET',base+'users/'+v+'.json',auth,{},cb)
		else if (ugd) request('GET',base+'users/'+ugd[1]+'/goals/'+ugd[2]+'/datapoints.json',auth,{},cb)
		else if (ugdc) request('POST',base+'users/'+ugdc[1]+'/goals/'+ugdc[2]+'/datapoints/create_all.json',merge_o(auth,{datapoints:JSON.stringify(arg)}),{},cb)
		else if (ugdu && arg) request('PUT',base+'users/'+ugdu[1]+'/goals/'+ugdu[2]+'/datapoints/'+ugdu[3]+'.json',merge_o(auth,arg),{},cb)
		else if (ugdu && !arg) request('DELETE',base+'users/'+ugdu[1]+'/goals/'+ugdu[2]+'/datapoints/'+ugdu[3]+'.json',auth,{},cb)
		else request('GET',base+'users/'+ug[1]+'/goals/'+ug[2]+'.json',auth,{},cb)
		} })()

// parser and stringifier
var ping_file = (function(){
	// log format is: 2014-03-26/19:51:56-07:00‹p22.5›? a b c (a: comment)
	var dt_fmt = 'YYYY-MM-DD/HH:mm:ssZ'
	var parse = function(v){
		if (v.match(/^....-/)) {var t = v.match(/^([^\sp]+)(p\S+)? (.*)$/); return {time:m.utc(t[1],dt_fmt)/1000, period:t[2]? parseFloat(t[2]) : 45, tags:t[3].trim()}}
		else {var t = v.match(/^(\d+)([^\[]+)/); if (!t) err('bad log file'); return {time:i(t[1]), period:rc.period, tags:t[2].trim()}}
		}
	var stringify = function(v){return m(v.time*1000).format(dt_fmt)+(v.period===45?'':'p'+v.period)+' '+v.tags}
	var read_nonblank_lines = function(fl){return fs(fl).$.split('\n').filter(function(v){return v!==''})}
	var r = function(fl){this.fl = fl}
		.def('$',function(){return read_nonblank_lines(this.fl).map(parse)},
			function(v){fs(this.fl).$ = v.map(stringify).join('\n')+'\n'; return this})
	r.prototype.append = function(v){fs(this.fl).append(stringify(v)+'\n'); return this}
	return function(fl){return new r(fl)}})()

var ping_seq = (function(period){
	var epoch = {seed:666, time:1184083200} // the birth of timepie/tagtime!
	var ping_next = function(ping){ // see p37 of Simulation by Ross
		ping.seed = pow(7,5)*ping.seed % (pow(2,31)-1) // ran0 from Numerical Recipes
		ping.time += round(max(1,-45*60*log(ping.seed / (pow(2,31)-1)))) }
	var keep = function(v){return !v.fraction || bit_reverse_i(31,v.seed) / (pow(2,31)-1) <= v.fraction}
	var next_s = function(v){var existing = _.pluck(seqs,'time'); do {ping_next(v)} while (!keep(v)); while (_.contains(existing,v.time)) v.time += 1; return v}
	
	var seqs
	var reset_before = function(time){if (!seqs || time < getv()) {
		var n = 45 / period
		seqs = _.range(ceil(n)).map(function(v){var t = _.clone(epoch); t.seed += v; return t}).map(next_s)
		if (ceil(n)-n !== 0) seqs[-1].fraction = 1-(ceil(n)-n)
		}}
	var getv = function(){var r = _.min(seqs,function(v){return v.time}).time; return r}
	var get = function(){return {time:getv(), period:period}}
	var next = function(){next_s(_.min(seqs,function(v){return v.time}))}
	
	reset_before(now())
	return ζ0_def({
		le: function(time){reset_before(time); while (true) {var t = _.jclone(seqs); next(); if (getv() > time) {seqs = t; break}}; return get()},
		next: function(){next(); return get()},
		}, '0', function(){return get()}
	) })(rc.period)

//===--===// fns loosely corresponding to the original architecture //===--===//

var start_pings = function(){var t
	var n; clog("TagTime is watching you! Last ping would've been",format_dur((n=now())-(t=ping_seq.le(n).time)),'ago, at',m(t*1000).format('HH:mm:ss'))
	ping_seq.le(((t=ping_file(rc.p).$[-1])&&t.time) || now()); ping_seq.next() }
var schedule_pings = function λ(){var t; var ps = ping_seq
	print('starting again')
	var already = []; while (ps[0].time <= now()) {already.push(ps[0]); ps.next()}
	if (already.length===0) λ.at(ps[0].time)
	else {
		clog('creating prompt! for',already.map(function(v){return m(v.time*1000).toISOString()}),'at',m().toISOString())
		prompt((function(pfl){return function(time,cb){var t; if (pfl.some(function(v){t=v; return v.time < time})) cb(t); else cb()}})(ping_file(rc.p).$.reverse().slice(0,200)),
		function(e,gui){
			already.map(gui.ping)
			var λt; ;(function λ(){λt = (function(){if (gui.ping(ps[0])) {already.push(ps[0]); ps.next(); λ()}}).at(ps[0].time)})()
			gui.show(function(e,pings){
				clearTimeout(λt)
				if (pings.length !== already.length) {print('eep! I think you scrolled up!'); pings = pings.slice(pings.length - already.length)} //!
				pings.forEach(function(v){ping_file(rc.p).append(v)})
				tt_sync()
				λ()
			})
		})} }

var prompt = function(ping_before,cb){prompt.impl({sound:rc.ping_sound, ping_before:ping_before, macros:rc.macros},cb)}

var tt_sync = function(cb){
	clog('### synchonizing beeminder graphs with local logfile ###')
	sync_bee(cb)
	}
var sync_bee = function(cb){
	// the log file → [{time: period: tags:}]
	var logfile_pings = function(){return ping_file(rc.p).$}
	// beeminder api datapoints → [{time: period: tags: id: group:}]
	var beeminder_pings = function(datapoints){
		return _.flatten(datapoints.filter(function(v){return v.value!==0 && v.comment.match(/pings?:/)}).map(function(v){
			var pings = v.comment.match(/pings?:(.*)/)[1].trim().replace(/ \[..:..:..\]$/,'').split(', ')
			var r = pings.map(function(t){return {time:v.timestamp, period:v.value*60/pings.length, tags:t, id:v.id}})
			r.map(function(v){v.group = r})
			return r}),true) }

	var tagdsl_eval = function(f,tags){
		f = f.split(' ')
		var check = function(v){return tags.replace(/\(.*?\)/g,' ').trim().split(/ +/).some(function(t){return t===v})}
		var first_next = function(f){return f[0]==='¬'||f[0]==='!'? [!check(f[1]),f.slice(2)] : [check(f[0]), f.slice(1)]}
		var v = first_next(f); while (true) {
			if (v[1].length===0) return v[0]
			else if (v[1][0].toLowerCase()==='&') {var t = first_next(v[1].slice(1)); v = [v[0]&&t[0],t[1]]}
			else if (v[1][0].toLowerCase()==='|') {var t = first_next(v[1].slice(1)); v = [v[0]||t[0],t[1]]}
			else {print('oh no, bad tag dsl!',f); throw 'BAD_TAG_DSL'}
			} }

	var generate_actions = function(user_slug,f_pings,b_pings){var t
		f_pings = _.sortBy(f_pings,'time') //! maybe don't need to sort these two?
		b_pings = _.sortBy(b_pings,'time')
		f_pings.map(function(v){v.group_time = round(v.time/86400 - 2/3)*86400 + 86400*2/3})
		b_pings.map(function(v){v.group_time = round(v.time/86400 - 2/3)*86400 + 86400*2/3})
		if (b_pings.some(function(v){return v.group_time!==v.time})) {print('ERROR: so confused'); throw '‽'}

		var do_group = typeof(t=rc.beeminder.grouping)==='string'? _.contains(t.split(' '),user_slug) : t
		if (!do_group) {print('ERROR: oh sorry, non-grouped upload isn\'t implemented yet'); throw 'IMPL_IS_LAME'}

		//! horrifyingly inefficient
		f_pings.map(function(fp){
			var bp = b_pings.filter(function(bp){return !bp.matched && bp.group_time===fp.group_time && bp.tags===fp.tags && bp.period===fp.period})[0]
			if (bp) {fp.matched = true; bp.matched = true} })
		var add_pings = f_pings.filter(function(v){return !v.matched})
		var kill_pings = b_pings.filter(function(v){return !v.matched})

		add_pings.map(function(v){v.add = true})
		kill_pings.map(function(v){v.kill = true})

		var actions = _.values(_.groupBy(add_pings.concat(b_pings),function(v){return v.group_time+' '+v.period})).map(function(v){
			if (!v.some(function(v){return v.add || v.kill})) // no change
				return undefined
			else if (v.every(function(v){return v.add})) // log and ¬bee: CREATE
				return [['CREATE',{timestamp:v[0].group_time, value:v.length*v[0].period/60, comment:pluralize(v.length,'ping')+': '+_.pluck(v,'tags').join(', ')}]]
			else if (v.every(function(v){return v.kill})) // ¬log and bee: DELETE
				return v.map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]})
			else { // log and bee: UPDATE?
				var t = _.values(_.groupBy(v.filter(function(v){return !(v.add || v.kill)}),'id'))
				v = v.concat(t.slice(1).ζ0_concat().map(function(v){v.kill = true; return {add:true, group_time:v.group_time, period:v.period, tags:v.tags}}))
				var set = v.filter(function(v){return !v.kill})
				var kill = v.filter(function(v){return v.kill})
				var id = t.length===0? kill[0].id : t[0][0].id
				return [['UPDATE',id,{timestamp:v[0].group_time, value:set.length*v[0].period/60, comment:pluralize(set.length,'ping')+': '+_.pluck(set,'tags').join(', ')},set.length-kill.length]].concat(kill.filter(function(v){return v.id!==id}).map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]}))
			} }).filter(function(v){return v}).ζ0_concat()
		actions = _.groupBy(actions,function(v){return v[0]})
		var CREATE = (actions.CREATE||[]).map(function(v){return v[1]})
		var UPDATE = (actions.UPDATE||[])
		var DELETE = _.uniq((actions.DELETE||[]).map(function(v){return v[1]}),function(v){return v.id})
		var ymd = function(v){return m.utc(v.timestamp*1000).format('YYYY-MM-DD')}
		return {
			msgs: [
				CREATE.map(function(v){return '+ '+user_slug+' '+ymd(v)+' '+v.comment}),
				UPDATE.map(function(v){return '= '+user_slug+' '+ymd(v[2])+' '+v[2].comment}),
				DELETE.map(function(v){return '- '+user_slug+' '+ymd(v)+' '+v.id}),
				].ζ0_concat(),
			cmds: [
				[[user_slug+'.datapoints ~=',CREATE]],
				_.sortBy(UPDATE,3).map(function(v){return [user_slug+'.datapoints['+v[1]+'] =',v[2]]}),
				DELETE.map(function(v){return [user_slug+'.datapoints['+v.id+'] =']}),
				].ζ0_concat(),
			} }

	async.parallelLimit(Object.keys(rc.beeminder).filter(function(v){return v.indexOf('/')!==-1}).map(function(user_slug){return function(cb){
		beeminder(user_slug+'.datapoints',function(e,v){if (e) cb(e,v); else {
			cb(null,generate_actions(
				user_slug,
				logfile_pings().filter(function(v){return tagdsl_eval(rc.beeminder[user_slug],v.tags)}),
				beeminder_pings(v)))
				}}) }}),
		10,
		function(e,action_sets){
			_.pluck(action_sets,'msgs').ζ0_concat().map(function(v){clog(v)})
			if (!args.dry) async.parallelLimit(_.pluck(action_sets,'cmds').ζ0_concat().map(function(v){return function(cb){beeminder.apply(null,v.concat([cb]))}}),10,cb)
			else cb&&cb.in()
		})
	}

var merge = function(fl){print('merging',fl,'into',rc.p); if (!args.dry) ping_file(rc.p).$ = _.sortBy(ping_file(rc.p).$.concat(ping_file(fl).$),'time')}

module.exports.main = function(args){
	prompt.impl = args.prompt
	var argv = args.argv
	switch (argv[0]) {
		case undefined: start_pings(); schedule_pings(); break
		case 'sync': tt_sync(); break
		case 'merge': merge(argv[1]); break
		case 'prompt':
			var t = isNaN(i(argv[1])); var time = t? now() : i(argv[1]); var prev = argv.slice(t?1:2).join(' ')
			prompt(prev!=='' && function(time,cb){cb({time:time-2000,tags:prev})},function(e,gui){
				gui.ping({time:time, period:45})
				// gui.ping({time:time, period:45})
				gui.show(function(e,pings){print(_.pluck(pings,'tags').join('\n')); if (!e) process.exit()})
			})
			break
		default: print('usage: ./run.sh (| prompt <time>? <last_doing>? | sync --dry? | merge --dry? <file>) (--settings <file>)?'); break
	} }