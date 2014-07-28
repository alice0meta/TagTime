var async = require('async')
var m = require('moment')
var minimist = require('minimist')
var _ = require('underscore')
var exec = require('child_process').exec

// roadmapy:
// we want to deploy to windows, osx, linux, webapp, android, and ios

// todo back:
// have read_graph cache its results
// ‽ implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
//     so, when i took five minutes to consider "what would be a *good* interface for tagging?", i thought of "what about a field of 2-dimensional tag-blobs, with size proportional to frequency, that can be persistently dragged around?"
// make the ping algorithm not slow to start up
// ?? maybe allow multidirectional sync with beeminder graphs ??
// "Tiny improvement to TagTime for Android: pings sent to Beeminder include the time in the datapoint comment"
// consider reenabling seed: 666, // for pings not in sync with other peoples' pings, change this
// improve the autoupdater: make it more robust, more convenient, and check for updates more frequently than just every time it runs. and check for local updates.
// "an installer for node-webkit" https://github.com/shama/nodewebkit
// maybe prepare the gui beforehand so that we can make it come up on exactly the right instant?
// maybe separate the processes *again* to get rid of that blur bug
// tray menu! https://gist.github.com/halida/9634676

// todo:
// //! comments
// pings_if(): after logging old datapoints, open the log file in an editor
// ??sortedness of log files??
// notes on danny's tagtime workflow: when entering tags, <enter> with no characters will just go straight to the editor. xterm mechanics is just that tagtime calls xterm with appropriate arguments and then is a running program in xterm. and then can optionally call editors and stuff.
// bah, fuck, i ate the timezone information again. fix?
// pings_if(): skips past a lot of multiple-pings-handling logic, but that should be entirely reimplemented from a high level (current afk behavior is undesirable in many ways)
//     okay, so just as is, but if you miss any pings it pops up the editor immediately?
//     oh, current behavior seems like "ignores any missed pings and logs them"
// fix the cause of # NB: restart the daemon (tagtimed.pl) if you change this file. // you need to listen for changes to the settings file
// maybe do add the off autotag too
// btw, the tagtime daemon's output should be logged somewhere.
// danny's rc.beeminder dsl is observed to only contain tag, (& tags), (| tags), and (! tag)
// it's actually finally clear how to separate this into different files

//===----------------------------===// ζ₀ //===----------------------------===//!
	global.fs = require('fs')
	global.path = require('path')
	global.moment = require('moment')
	global._ = require('underscore')
	var mkdirp = require('mkdirp')
	String.prototype.repeat = function(v){return new Array(v+1).join(this)}
	global.pad = function(v,s){return v+s.slice(v.length)}
	global.argv = {_:process.argv.slice(4)}
	function Path(path){this._path = path.replace(/^~\//,process.env.HOME+'/')}; var t = function(path){return new Path(path)}; t.__proto__ = fs; global.fs = t
	function PathValue(path){this._path = path}
	Object.defineProperty(Path.prototype,'$',{
		get:function(){return new PathValue(this._path)},
		set:function(v){
			mkdirp.sync(path.dirname(this._path))
			if (v instanceof PathValue) fs.createReadStream(v._path).pipe(fs.createWriteStream(this._path))
			else fs.writeFileSync(this._path,v,{mode:493})
			} })
	Object.defineProperty(Path.prototype,'path',{get:function(){return this._path.slice(0,(process.env.HOME+'/').length)===process.env.HOME+'/'? '~'+this._path.slice(process.env.HOME.length) : this._path}})
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
//===---===// other copypasted (lang-alpha, stopwatch, daemon.html) //===--===//!
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

//===---------------------===// tt-specific util //===---------------------===//

var edit = function(fl){exec(((rc&&rc.editor)||'open -a TextEdit')+" '"+fs(fl).realpath()+"'")}

//===-------------------===// get args and settings //===------------------===//

//! so we should refactor this to make command-line args and rc file more synonymous and stuff.

//! actually respect --dry everywhere!
var args = minimist(argv._,{alias:{dry_run:['d','dry','dry-run'],settings:'s'}, default:{settings:'~/.tagtime.json'}})

if (!fs(args.settings).exists()) {
	fs(args.settings).$ = (fs('settings.js').$+'').replace(/‹([^›]+)›/g,function(_,v){var t; return is(t=eval(v))?t:''})
	print("hey, I've put a settings file at",args.settings,"for you. Go fill it in!")
	edit(args.settings) }

try {var rc = JSON.parse((fs(args.settings).$+'').replace(/\/\/.*/g,''))}
catch (e) {print('ERROR: bad rc file:',e); process.exit(1)}

if (rc.period < 45) {print('ERROR: periods under 45min are not yet properly implemented! it will very occasionally skip pings! (period:',rc.period+')'); process.exit(1)} //!

rc.seed = 666; //Math.round(Math.random()*2200) + 800
// if (!((1 <= rc.seed && rc.seed < 566) || rc.seed===666 || (766 <= rc.seed && rc.seed < 3000))) {print('ERROR: seeds probably should be positive, not too close to each other, and not too big (seed:',rc.seed+'). How about',(1000 + Math.round(Math.random()*2000))+'?'); process.exit(1)}

rc.p = rc.ping_file
if (!fs(rc.p).exists()) fs(rc.p).$ = ''

//===----------===// less hacky hacky partial beeminder api //===----------===//

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
var beeminder = function(v){var a = arguments; var cb = a[a.length-1]; var arg = a.length > 2? a[1] : undefined
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
	}

//===-------------===// ping file parser and stringifier //===-------------===//

var ping_file = function(fl){
	// log format is: 2014-03-26/19:51:56-07:00‹p22.5›? a b c (a: comment)
	var dt_fmt = 'YYYY-MM-DD/HH:mm:ssZ'
	var parse = function(v){
		if (v.match(/^....-/)) {var t = v.match(/^([^\sp]+)(p\S+)? (.*)$/); return {time:m.utc(t[1],dt_fmt)/1000, period:t[2]? parseFloat(t[2]) : 45, tags:t[3].trim()}}
		else {var t = v.match(/^(\d+)([^\[]+)/); if (!t) err('bad log file'); return {time:i(t[1]), period:rc.period, tags:t[2].trim()}}
		}
	var stringify = function(v){return m(v.time*1000).format(dt_fmt)+(v.period===45?'':'p'+v.period)+' '+v.tags}
	var read_nonblank_lines = function(fl){return fs(fl).$.split('\n').filter(function(v){return v!==''})}
	return {
		last: function(){var t; return (t=read_nonblank_lines(fl).slice(-1)[0])? parse(t) : undefined},
		append: function(v){fs(fl).append(stringify(v)+'\n')},
		write: function(v){fs(fl).$ = v.map(stringify).join('\n')+'\n'},
		all: function(){return read_nonblank_lines(fl).map(parse)},
	} }

//===----------------------===// ping algorithm //===----------------------===//

var pings_old = (function(){
	// utils
	var bit_reverse = function(length,v){var r = 0; for (var i=0;i<length;i++){r = (r << 1) | (v & 1); v = v >> 1}; return r}
	var pow_mod = function(v,e,m){ // vᵉ % m
		var i32_mul_mod = function(a,b,m) { // a*b % m
			// probably breaks if 2³²%m > 2²⁰ or so
			var ah = (a >> 16) & 0xffff, al = a & 0xffff
			var bh = (b >> 16) & 0xffff, bl = b & 0xffff
			return (al*bl + ((ah*bl + al*bh) * Math.pow(2,16)) + ah*bh * (Math.pow(2,32) % m)) % m}
		var r = 1; while (e > 0) {if (e % 2 === 1) r = i32_mul_mod(r,v,m); v = i32_mul_mod(v,v,m); e = e >> 1}; return r}
	var range = function(l){var r = []; for (var i=0;i<l;i++) r.push(i); return r}
	Array.prototype.min_by = function(f){
		if (this.length <= 1) return this[0]
		var r = this[0]; var fr = f(r)
		this.slice(1).map(function(v){var t; if ((t=f(v)) < fr) {r = v; fr = t}})
		return r}
	Array.prototype.max_by = function(f){
		if (this.length <= 1) return this[0]
		var r = this[0]; var fr = f(r)
		this.slice(1).map(function(v){var t; if ((t=f(v)) > fr) {r = v; fr = t}})
		return r}
	
	// see p37 of Simulation by Ross
	//var ran0 = function(seed){return Math.pow(7,5)*seed % (Math.pow(2,31)-1)} // ran0 from Numerical Recipes
	var ran0_closed = function(seed,i){return seed*pow_mod(Math.pow(7,5),i+1,(Math.pow(2,31)-1)) % (Math.pow(2,31)-1)}
	var interval = function(seed,i){return Math.max(1,Math.round(-45*60*Math.log(ran0_closed(seed,i) / (Math.pow(2,31)-1))))}

	var seq_count = 45 / rc.period
	var seq_fraction = seq_count+1 - Math.ceil(seq_count)
	var seqs

	var again = seq_fraction===1? function(v){return false} : function(v){return v===seqs.slice(-1)[0] && !(bit_reverse(31,ran0_closed(v.seed,v.i)) / (Math.pow(2,31)-1) <= seq_fraction)}
	var next_s = function λ(v){var t = again(v); v.ping += interval(v.seed,v.i); v.i+=1; return t? λ(v) : v}
	var prev_s = function λ(v){v.i-=1; v.ping -= interval(v.seed,v.i); return again(v)? λ(v) : v}
	var get = function(){return seqs.min_by(function(v){return v.ping}).ping}
	var next = function(){next_s(seqs.min_by(function(v){return v.ping}))}
	var prev = function(){prev_s(seqs.max_by(function(v){return v.ping - interval(v.seed,v.i-1)}))}

	if (Math.ceil(seq_count)===1 && rc.seed===666) {seqs = [{seed:rc.seed, i:78922, ping:1397086515}]; prev()} // optimization: a recent seqs
	else {seqs = range(Math.ceil(seq_count)).map(function(v){return {seed:rc.seed+v, i:0, ping:1184083200}}); seqs = seqs.map(next_s)} // the birth of timepie/tagtime!

	return {
		// time → nearest ping time ≤ time
		le:   function(time){while (get() <= time) next(); while (get() >  time) prev(); return get()},
		// time → nearest ping time > time
		next: function(time){while (get() >  time) prev(); while (get() <= time) next(); return get()},
	} })()

//! okay. so we can't find a closed form. so our ping algorithm is probably ridiculously overcomplicated, geez. decomplicate it!
// maybe refactor ping algorithm *again* to avoid maintaining state

var ping_function = (function(){
	// utils
	var bit_reverse = function(length,v){var r = 0; for (var i=0;i<length;i++){r = (r << 1) | (v & 1); v = v >> 1}; return r}
	var range = function(l){var r = []; for (var i=0;i<l;i++) r.push(i); return r}
	var min_by = function(v,f){
		var r = [v[0],0]
		if (v.length <= 1) return r
		var fr = f(r[0])
		v.slice(1).map(function(v,i){var t; if ((t=f(v)) < fr) {r = [v,i]; fr = t}})
		return r}
	var max_by = function(v,f){
		var r = [v[0],0]
		if (v.length <= 1) return r
		var fr = f(r[0])
		v.slice(1).map(function(v,i){var t; if ((t=f(v)) > fr) {r = [v,i]; fr = t}})
		return r}
	
	// see p37 of Simulation by Ross
	var ran0 = function(seed){return Math.pow(7,5)*seed % (Math.pow(2,31)-1)} // ran0 from Numerical Recipes
	var ping_next = function(ping){var t = ran0(ping.seed); return {seed:t, time:ping.time+Math.max(1,Math.round(-45*60*Math.log(t / (Math.pow(2,31)-1))))}}

	var seq_count = 45 / rc.period
	var seq_fraction = seq_count+1 - Math.ceil(seq_count)
	var seqs

	// if (Math.ceil(seq_count)===1 && rc.seed===666) {seqs = [{seed:?, time:1401267914}]; prev()} // optimization: a recent seqs
	// else {seqs = range(Math.ceil(seq_count)).map(function(v){return {seed:rc.seed+v, time:1184083200}}); seqs = seqs.map(next_s)} // the birth of timepie/tagtime!

	//! eep. i'm not sure if v.seed or maybe ran0(v.seed) is the right thing to bit_reverse (originally we had ran0_closed(v.seed_0,v.i))
	var again = seq_fraction===1? function(v,i){return false} : function(v,i){return i===seqs.length-1 && !(bit_reverse(31,v.seed) / (Math.pow(2,31)-1) <= seq_fraction)}
	var next_s = function λ(v,i){var t = again(v,i); var r = ping_next(v); if (t) r = λ(r,i); r.prev = {seed:v.seed, time:v.time}; return r}

	var reset_before = function(time){
		seqs = range(Math.ceil(seq_count)).map(function(v){return {seed:rc.seed+v, time:1184083200}}); seqs = seqs.map(next_s)
	}
	var get = function(){var r = min_by(seqs,function(v){return v.time})[0].time; return r}
	var next = function(){var t = min_by(seqs,function(v){return v.time}); seqs[t[1]] = next_s(t[0],t[1])}
	var prev = function(){var t = max_by(seqs,function(v){return v.prev.time}); seqs[t[1]] = t[0].prev}

	reset_before(now())

	return {
		// time → nearest ping time ≤ time
		le: function(time){while (get() > time) reset_before(time); while (get() <= time) next(); prev(); if (get()!==pings_old.le(time)) err('oh dear ≤.',time,pings_old.le(time),get()); /*print('≤',seqs);*/ return get()},
		gt: function(time) {var r = ping_function.le(time); while ((r=ping_function.next(r)) <= time) {}; return r},
		//??
		next: function(time){next(); if (get()!==pings_old.next(time)) err('oh dear >.',time,pings_old.next(time),get()); /*print('>',seqs);*/ return get()},
		prev: function(){prev(); return get()},
	} })()

//===--===// fns loosely corresponding to the original architecture //===--===//

// runs the ping script at appropriate times and sends afk datapoints to the ping file
var run_pings = function(){var t
	var n; var t; print("TagTime is watching you! Last ping would've been",format_dur((n=now())-(t=ping_function.le(n))),'ago, at',m(t*1000).format('HH:mm:ss'))

	var first
	var count = 0
	;(function λ(time){
		//! bah, this local structure is ridiculous. refactor it!
		if (!time) {time = ping_function.gt(((t=ping_file(rc.p).last())&&t.time) || now()); time = ping_function.prev()}
		first = first || time
		var last = time; time = ping_function.next(time)
		if (!(time <= now())) {setTimeout(λ,500); return}

		print((++count)+': PING!',m(time*1000).format('YYYY-MM-DD/HH:mm:ss'),'gap',pad(format_dur(time-last),' ',9),'avg',format_dur((time-first)/count),'tot',format_dur(time-first))

		if (time < now() - 60) {
			ping_file(rc.p).append({time:time, period:rc.period, tags:'afk RETRO'})
			setTimeout(λ,0,time)
		} else {
			prompt({time:time,last_doing:(t=ping_file(rc.p).last())&&t.tags},function(e,args){
				ping_file(rc.p).append({time:time, period:rc.period, tags:args.tags})
				if (args.tags==='') edit(rc.p)
				// if (args.canceled) //! do something?
				tt_sync()
				setTimeout(λ,0,time)
			})
		}
		})() }

var prompt_fn // defined in main
var prompt = function(v,cb){
	v.ping_sound = rc.ping_sound || 'loud-ding.wav'
	prompt_fn(v,function(e,args){
		if (rc.macros) {var m = typeof(rc.macros)==='string'? JSON.parse(fs(rc.macros).$) : rc.macros; args.tags = args.tags.split(' ').map(function(v){return m[v]||v}).join(' ');} cb(e,args)})}

var tt_sync = function(){
	print(divider(' synchonizing beeminder graphs with local logfile '))
	sync_bee()
	}
var sync_bee = function(){
	// the log file → [{time: period: tags:}]
	var logfile_pings = function(){return ping_file(rc.p).all()}
	// beeminder api datapoints → [{time: period: tags: id: group:}]
	var beeminder_pings = function(datapoints){
		return _.flatten(datapoints.filter(function(v){return v.value!==0}).filter(function(v){return v.comment!=='fake'}).map(function(v){
			var pings = v.comment.match(/pings?:(.*)/)[1].trim().split(', ')
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
				v = v.concat(t.slice(1).m_concat().map(function(v){v.kill = true; return {add:true, /*group_time:v.group_time, period:v.period,*/ tags:v.tags}}))
				var set = v.filter(function(v){return !v.kill})
				var kill = v.filter(function(v){return v.kill})
				var id = t.length===0? kill[0].id : t[0][0].id
				return [['UPDATE',id,{timestamp:v[0].group_time, value:set.length*v[0].period/60, comment:pluralize(set.length,'ping')+': '+_.pluck(set,'tags').join(', ')}]].concat(kill.filter(function(v){return v.id!==id}).map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]}))
			} }).filter(function(v){return v}).m_concat()
		actions = _.groupBy(actions,function(v){return v[0]})
		var CREATE = (actions.CREATE||[]).map(function(v){return v[1]})
		var UPDATE = (actions.UPDATE||[])
		var DELETE = _.uniq((actions.DELETE||[]).map(function(v){return v[1]}),function(v){return v.id})
		var ymd = function(v){return m.utc(v.timestamp*1000).format('YYYY-MM-DD')}
		return {
			msgs: [
				CREATE.map(function(v){return '+ CREATE: '+ymd(v)+' '+v.comment}),
				UPDATE.map(function(v){return '= UPDATE: '+ymd(v[2])+' '+v[2].comment}),
				DELETE.map(function(v){return '- DELETE: '+ymd(v)+' '+v.id}),
				].m_concat(),
			cmds: [
				[[user_slug+'.datapoints ~=',CREATE]],
				UPDATE.map(function(v){return [user_slug+'.datapoints['+v[1]+'] =',v[2]]}),
				DELETE.map(function(v){return [user_slug+'.datapoints['+v.id+'] =']}),
				].m_concat(),
			} }

	async.parallel(Object.keys(rc.beeminder).filter(function(v){return v.indexOf('/')!==-1}).map(function(user_slug){return function(cb){
		beeminder(user_slug+'.datapoints',function(e,v){if (e) cb(e,v); else {
			cb(0,{user_slug:user_slug,
				actions: generate_actions(
					user_slug,
					logfile_pings().filter(function(v){return tagdsl_eval(rc.beeminder[user_slug],v.tags)}),
					beeminder_pings(v))
				}) }}) }}),
		function(e,action_sets){
			action_sets.map(function(v){
				print(divider(' updating bmndr/'+v.user_slug+' '))
				v.actions.msgs.map(function(v){print(v.slice(0,80))})
			})
			if (!args.dry_run) async.parallel(action_sets.map(function(v){return v.actions.cmds}).m_concat().map(function(v){return function(cb){beeminder.apply(null,v.concat([cb]))}}))
		})
	}

var merge = function(fl){
	print('merging',fs(fs(fl).realpath()).path,'into',fs(fs(rc.p).realpath()).path)
	if (!args.dry_run) ping_file(rc.p).write(_.sortBy(ping_file(rc.p).all().concat(ping_file(fl).all()),'time')) }

module.exports.main = function(args){
	prompt_fn = args.prompt
	var argv = args.argv
	switch (argv[0]) {
		case undefined: run_pings(); break
		case 'prompt' : prompt({time:i(argv[1]), last_doing:argv[2]},function(e,args){print(args)}); break
		case 'sync'   : tt_sync(); process.exit(); break
		case 'merge'  : merge(argv[1]); break
		case 'e'      : print(eval(argv.slice(1).join(' '))); break
		default       : print('usage: tagtime.js (sync | merge <file>)? (--settings <file>)? (--dry-run)?'); break
	} }