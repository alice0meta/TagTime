var async = require('async')
var m = require('moment')
var minimist = require('minimist')
var _ = require('underscore')
var exec = require('child_process').exec

// sometime eventually:
// expand reset_before to make ping_function faster to start up
// instead of ignoring non-parsed beeminder graph pings, maybe zero the datapoints and annotate the comment? like, 28 1 "foo" → 28 0 "foo [was 1; zeroed by tagtime syncing]"

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

// todo:
// //! comments
// ??sortedness of ping files??
// bah, fuck, i ate the timezone information again. fix?
// fix the cause of # NB: restart the daemon (tagtimed.pl) if you change this file. // you need to listen for changes to the settings file
// maybe do add the off autotag too
// btw, we should have a logfile
// danny's rc.beeminder dsl is observed to only contain tag, (& tags), (| tags), and (! tag)
// it's actually finally clear how to separate this into different files

// most urgent todo:
// [mendoza] [0.2.0] pings_if(): skips past a lot of multiple-pings-handling logic, but that should be entirely reimplemented from a high level (current afk behavior is undesirable in many ways)
//     pings_if(): after logging old datapoints, open the ping file in an editor`
//     okay, so just as is, but if you miss any pings it pops up the editor immediately?
//     oh, current behavior seems like "ignores any missed pings and logs them"
//     notes on danny's tagtime workflow: when entering tags, <enter> with no characters will just go straight to the editor. xterm mechanics is just that tagtime calls xterm with appropriate arguments and then is a running program in xterm. and then can optionally call editors and stuff.
// improve the autoupdater: make it more robust, more convenient, and check for updates more frequently than just every time it runs. and check for local updates.
// automatically run on startup

//! separation into different files:
//===----------------------------===// ζ₀ //===----------------------------===//
	global.fs = require('fs')
	global.path = require('path')
	global.moment = require('moment')
	global._ = require('underscore')
	var mkdirp = require('mkdirp')
	String.prototype.repeat = function(v){return new Array(v+1).join(this)}
	global.pad = function(v,s){return v+s.slice(v.length)}
	global.argv = {_:process.argv.slice(4)}
	Function.prototype.def = function(m,get,set){Object.defineProperty(this.prototype,m,{configurable:true, enumerable:false, get:get, set:set}); return this}
	;[Array,String].forEach(function(Class){_.range(0,5).forEach(function(i){Class.def('-'+i,function(){return this.length<i? undefined : this[this.length-i]},function(v){return this.length<i? v : this[this.length-i] = v})})})
	var Path = function Path(path){this._path = path.replace(/^~\//,process.env.HOME+'/')}
		.def('$',function(){return new PathValue(this._path)},
			function(v){
				mkdirp.sync(path.dirname(this._path))
				if (v instanceof PathValue) fs.createReadStream(v._path).pipe(fs.createWriteStream(this._path))
				else fs.writeFileSync(this._path,v,{mode:493})
				})
		.def('path',function(){return this._path.slice(0,(process.env.HOME+'/').length)===process.env.HOME+'/'? '~'+this._path.slice(process.env.HOME.length) : this._path})
	var t = function(path){return new Path(path)}; t.__proto__ = fs; global.fs = t
	function PathValue(path){this._path = path}
	Path.prototype.realpath = function(){return fs.realpathSync(this._path)}
	Path.prototype.exists = function(){return fs.existsSync(this._path)}
	Path.prototype.append = function(v){fs.appendFileSync(this._path,v)}
	PathValue.prototype.toString = function(){return fs.readFileSync(this._path)+''}
	PathValue.prototype.split = function(v){return (this+'').split(v)}
	PathValue.prototype.ζ0_SUB_BYs = function(b){return this.split(b)}
	global.ζ0_SUB_Fs = function(s,f){return s.split(f).slice(1).join(f)}
	global.ζ0_SUB_Ts = function(s,t){return s.split(t)[0]}
	global.ζ0_memb_Emod_obj = function(o,m,f){o[m] = f(o[m]); return o}
	Array.prototype.ζ0_concat = function(){return Array.prototype.concat.apply([],this)}
	global.ζ0_int = function(v){return parseInt(v)}
//===---===// other copypasted (lang-alpha, stopwatch, daemon.html) //===--===//
	var merge_o = function(a,b){var r = {}; Object.keys(a).forEach(function(k){r[k] = a[k]}); Object.keys(b).forEach(function(k){r[k] = b[k]}); return r}
	var seq = function(v){return typeof v === 'string'? v.split('') : v instanceof Array? v : Object.keys(v).map(function(k){return [k,v[k]]})}
	var frequencies = function(v){return v.reduce(function(r,v){r[v] = v in r? r[v]+1 : 1; return r},{})}
	function now(){return Date.now() / 1000}
	String.prototype.repeat = function(v){return v<=0? '' : new Array(v+1).join(this)}
	var pad = function(v,s,l){while (v.length < l) v = s+v; return v}
	var format_dur = function λ(v){
		v = Math.round(v)
		if (v<0) return '-'+λ(-v)
		var d = Math.floor(v/60/60/24), h = Math.floor(v/60/60)%24, m = Math.floor(v/60)%60, s = v%60
		return [d+'d',pad(h+'','0',2)+'h',pad(m+'','0',2)+'m',pad(s+'','0',2)+'s'].slice(d>0?0:h>0?1:m>0?2:3).join('')}
	Array.prototype.m_concat = function(){return Array.prototype.concat.apply([],this)}
	var print = function(){process.stdout.write(Array.prototype.slice.call(arguments).join(' ')+'\n'); return arguments[arguments.length-1]}

//===---------------------------===// util //===---------------------------===//

var i = function(v){return parseInt(v)}
var is = function(v){return v!==undefined}
var err = function(v){print.apply(null,['#err#'].concat(arguments)); throw Error(v)}
var pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}
var divider = function(v){ // 'foo' → '-----foo-----' of length 79
	var left = Math.floor((79 - v.length)/2), right = 79 - left - v.length
	return '-'.repeat(left)+v+'-'.repeat(right)}
// var escape_regex = function(v){return v.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')}
// String.prototype.replace_all = function(find,replace){return this.replace(new RegExp(escape_regex(find),'g'),replace)}
var bit_reverse_i = function(length,v){var r = 0; for (var i=0;i<length;i++){r = (r << 1) | (v & 1); v = v >> 1}; return r}
Function.prototype.in = function(time){var args = Array.prototype.slice.call(arguments).slice(1); return !time || time<=0? (setImmediate||setTimeout).apply(null,[this].concat(args)) : setTimeout.apply(null,[this,time*1000].concat(args))}
Function.prototype.at = function(time){arguments[0] -= now(); return this.in.apply(this,arguments)}
Function.prototype.every = function(time){var args = Array.prototype.slice.call(arguments).slice(1); return setInterval.apply(null,[this,time*1000].concat(args))}

//===---------------------===// tt-specific util //===---------------------===//

var edit = function(fl){exec(((rc&&rc.editor)||'open -a TextEdit')+" '"+fs(fl).realpath()+"'")}

var tags_split = function(v){return v.trim().split(/ +/)}
var tags_union = function(a,b){return _.union(tags_split(a),tags_split(b)).join(' ').trim()}

//===-------------------===// get args and settings //===------------------===//

//! so we should refactor this to make command-line args and rc file more synonymous and stuff.

var args = minimist(argv._,{alias:{dry:'d',settings:'s'}, default:{settings:'~/.tagtime.json'}})

if (!fs(args.settings).exists()) {
	fs(args.settings).$ = (fs('settings.js').$+'').replace(/‹([^›]+)›/g,function(_,v){var t; return is(t=eval(v))?t:''})
	print("hey, I've put a settings file at",args.settings,"for you. Go fill it in!")
	edit(args.settings) }

try {var rc = JSON.parse((fs(args.settings).$+'').replace(/\/\/.*/g,''))}
catch (e) {print('ERROR: bad rc file:',e); process.exit(1)}

rc.seed = 666; //Math.round(Math.random()*2200) + 800
// if (!((1 <= rc.seed && rc.seed < 566) || rc.seed===666 || (766 <= rc.seed && rc.seed < 3000))) {print('ERROR: seeds probably should be positive, not too close to each other, and not too big (seed:',rc.seed+'). How about',(1000 + Math.round(Math.random()*2000))+'?'); process.exit(1)}

rc.p = rc.ping_file
if (!fs(rc.p).exists()) fs(rc.p).$ = ''

rc.ping_sound = rc.ping_sound || 'loud-ding.wav'

// var macro_replace_all = function(pings){
// 	var m = typeof(rc.macros)==='string'? JSON.parse(fs(rc.macros).$) : rc.macros
// 	if (m) pings.forEach(function(v){v.tags = tags_split(v.tags).map(function(v){return m[v]||v}).join(' ')})
// 	return pings}

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

var ping_function = (function(){
	var ping_next = function(ping){
		// see p37 of Simulation by Ross
		ping.seed = Math.pow(7,5)*ping.seed % (Math.pow(2,31)-1) // ran0 from Numerical Recipes
		ping.time += Math.round(Math.max(1,-45*60*Math.log(ping.seed / (Math.pow(2,31)-1))))
		}
	var keep = function(v){return !v.fraction || bit_reverse_i(31,v.seed) / (Math.pow(2,31)-1) <= v.fraction}
	var next_s = function(v){
		var existing = _.pluck(seqs,'time')
		do {ping_next(v)} while (!keep(v))
		while (_.contains(existing,v.time)) v.time += 1
		}

	var t = 45 / rc.period; var seq_count = Math.ceil(t); var seq_fraction = 1-(seq_count-t)
	var seqs
	var reset_before = function(time){
		seqs = _.range(seq_count).map(function(v){return {seed:rc.seed+v, time:1184083200}}); seqs.forEach(next_s) // the birth of timepie/tagtime!
		if (seq_fraction!==1) seqs[-1].fraction = seq_fraction
		}
	var get = function(){var r = _.min(seqs,function(v){return v.time}).time; return r}
	var next = function(){next_s(_.min(seqs,function(v){return v.time}))}
	
	reset_before(now())

	return {
		// time → nearest ping time ≤ time
		le: function(time){
			if (get() > time) reset_before(time)
			while (true) {var prev_seqs = JSON.parse(JSON.stringify(seqs)); next(); if (get() > time) {seqs = prev_seqs; break}}
			return get()},
		// get the next ping
		next: function(){next(); return get()},
	} })()

//===--===// fns loosely corresponding to the original architecture //===--===//

// pings at appropriate times and logs pings to the ping file and syncs with beeminder
var schedule_pings = function(){var t
	var n; print("TagTime is watching you! Last ping would've been",format_dur((n=now())-(t=ping_function.le(n))),'ago, at',m(t*1000).format('HH:mm:ss'))
	ping_function.le(((t=ping_file(rc.p).$[-1])&&t.time) || now())
	;(function λ(){var t=ping_function.next();
		print('looping @',m().toISOString(),'to',m(t*1000).toISOString())
		ping.at(t,t,function(){λ.in()})})()
	}
//  //!
// common cases:
// 	waking up and filling in sleep pings
// 	opening computer monday morning
// 		(do sanity check; you don't want to try to spawn fifty thousand lines)
// 	wanting to refer to tags from a few pings ago
// 	pinged you while you're typing
// 	?

// but really, we want to open a prompt, and then give it times, and then maybe give it more times, and then receive a bunch of pings from it

// do trim and such the output from ping.html

var ping = function(time,cb){
	print('ping! for',m(time*1000).toISOString(),'at',m().toISOString())
	if (time <= now() - 120) {ping_file(rc.p).append({time:time, period:rc.period, tags:'afk'}); cb.in()}
	else prompt(function(time,cb){cb(ping_file(rc.p).$[-1])},function(gui){
		gui.ping({time:time, period:rc.period})
		gui.show(function(e,pings){
			if (pings.length>1) window.alert("we can't handle this!")
			print(_.pluck(pings,'tags').join('\n')); process.exit()
			ping_file(rc.p).append(pings[0])
			// if (args.tags==='') edit(rc.p)
			// if (args.canceled)
			tt_sync()
			cb()
		}) }) }

var prompt = function(ping_before,cb){prompt.impl({sound:rc.ping_sound, ping_before:ping_before, macros:rc.macros},cb)}

var tt_sync = function(cb){
	print(divider(' synchonizing beeminder graphs with local logfile '))
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
		f_pings.map(function(v){v.group_time = Math.round(v.time/86400 - 2/3)*86400 + 86400*2/3})
		b_pings.map(function(v){v.group_time = Math.round(v.time/86400 - 2/3)*86400 + 86400*2/3})
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
				//! v = v.concat(t.slice(1).m_concat().map(function(v){v.kill = true; return {add:true, group_time:v.group_time, period:v.period, tags:v.tags}}))
				v = v.concat(t.slice(1).m_concat().map(function(v){v.kill = true; return {add:true, tags:v.tags}}))
				var set = v.filter(function(v){return !v.kill})
				var kill = v.filter(function(v){return v.kill})
				var id = t.length===0? kill[0].id : t[0][0].id
				return [['UPDATE',id,{timestamp:v[0].group_time, value:set.length*v[0].period/60, comment:pluralize(set.length,'ping')+': '+_.pluck(set,'tags').join(', ')},set.length-kill.length]].concat(kill.filter(function(v){return v.id!==id}).map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]}))
			} }).filter(function(v){return v}).m_concat()
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
				].m_concat(),
			cmds: [
				[[user_slug+'.datapoints ~=',CREATE]],
				_.sortBy(UPDATE,3).map(function(v){return [user_slug+'.datapoints['+v[1]+'] =',v[2]]}),
				DELETE.map(function(v){return [user_slug+'.datapoints['+v.id+'] =']}),
				].m_concat(),
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
			_.pluck(action_sets,'msgs').m_concat().map(function(v){print(v.slice(0,80))})
			if (!args.dry) async.parallelLimit(_.pluck(action_sets,'cmds').m_concat().map(function(v){return function(cb){beeminder.apply(null,v.concat([cb]))}}),10,cb)
			else cb&&cb.in()
		})
	}

var merge = function(fl){print('merging',fl,'into',rc.p); if (!args.dry) ping_file(rc.p).$ = _.sortBy(ping_file(rc.p).$.concat(ping_file(fl).$),'time')}

module.exports.main = function(args){
	prompt.impl = args.prompt
	var argv = args.argv
	switch (argv[0]) {
		case undefined: schedule_pings(); break
		case 'sync': tt_sync(); break
		case 'merge': merge(argv[1]); break
		case 'prompt':
			var t = isNaN(i(argv[1])); var time = t? now() : i(argv[1]); var prev = argv.slice(t?1:2).join(' ')
			prompt(prev&&function(time,cb){cb({time:time-2000,tags:prev})},function(e,gui){
				gui.ping({time:time, period:45})
				gui.show(function(e,pings){print(_.pluck(pings,'tags').join('\n')); if (!e) process.exit()})
			})
			break
		default: print('usage: ./run.sh (| prompt <time>? <last_doing>? | sync --dry? | merge --dry? <file>) (--settings <file>)?'); break
	} }