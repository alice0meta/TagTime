#!/usr/bin/env node

var fs = require('fs')
var sync = require('sync')
//var L = require('lazy.js')
var exec = require('child_process').exec

// todo:
// ? have read_graph cache its results
// exit (silently or not) if tagtime is already running
// update_graph should print more useful things
// ‽ implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
// use rc settings: editor terminal enforce_nums
// cope with empty/missing log file
// cope with missing rc file
// ‽ make this into a webapp hosted on github?
// make the ping algorithm not slow to start up
// pings_if(): skips past a lot of multiple-pings-handling logic, but that should be entirely reimplemented from a high level (current afk behavior is undesirable in many ways)
// pings_if(): after logging old datapoints, open the log file in an editor
// //! comments
// actually should be cool with goal formats like 31 0.75 "TagTime ping: bee spt" 31 0.75 "TagTime ping: bee spt"
// maybe refactor ping algorithm *again* to avoid maintaining state
// so the log entries fail to record both (1) ping frequency and (2) time zone . this is somewhat problematic.
// refactor things to be less synchronous

var err_print = function(f){return function(){try{f()} catch (e) {print('error!',e,e.message,e.stack)}}}
sync(err_print(function(){

////////////////////////////////////////////////////
/////  THE FOLLOWING IS COPIED FROM ELSEWHERE  ///// userscripts/gitminder, lang-alpha, stopwatch.js
////////////////////////////////////////////////////
	var print = console.log.bind(console)
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
	/////////////////////////////////////////////////////////
	//////////////////  END COPIED SECTION  /////////////////
	/////////////////////////////////////////////////////////

//===--------------------------------------------===// load rc file //===--------------------------------------------===//

var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')

if (rc.period < 45*60) print('WARNING: periods under 45min are not yet properly implemented! it will occasionally skip pings! (period:'+rc.period+')')
if (!((1 <= rc.seed && rc.seed < 566) || rc.seed===666 || (766 <= rc.seed && rc.seed < 3000))) print('WARNING: seeds should probably be (1) positive (2) not too close to each other (3) not too big (seed:'+rc.seed+')')

//===--------------------------------------------===// less hacky hacky partial beeminder api //===--------------------------------------------===//

var http = require('http')
var https = require('https')
var request = function(method,path,query,headers,cb){
	var t = path.match(/^(https?):\/\/(.*)$/); var http_ = t[1] === 'http'? http : https; path = t[2]
	var t = path.match(/^(.*?)(\/.*)$/); var host = t[1]; path = t[2]
	query = seq(query).map(function(v){return v[0]+'='+v[1]}).join('&')
	path = path+(query===''?'':'?'+query)
	http_.request({host:host,path:path,headers:headers,method:method},function(resp){
		var t = []; resp.on('data', function(chunk){t.push(chunk)}); resp.on('end', function(){
			t = t.join('')
			var err=null; var json; try {json = JSON.parse(t)} catch (e) {err = e}
			cb(err,{json:json,string:t,response:resp}) }) }).end() }
var beeminder_a = function(v){var a = arguments; var cb = a[a.length-1]; var arg = a.length > 2? a[1] : undefined
	var base = 'https://www.beeminder.com/api/v1/'
	var auth = {auth_token:rc.auth.beeminder}
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
var beeminder = function(){return beeminder_a.sync.apply(beeminder_a,[null].concat(Array.prototype.slice.apply(arguments)))}

//===--------------------------------------------===// util //===--------------------------------------------===//

var f0 = function(f){return function(v){return f(v)}}
var i = f0(parseInt)
var err = function(v){throw Error(v)}
var pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}
var bind = function(o,f){return o[f].bind(o)}
var def_get_proto = function(o,m,f){Object.defineProperty(o.prototype,m,{get:f})}
var read_lines = function(fl){return (fs.readFileSync(fl)+'').split('\n')}
Array.prototype.sort_n = function(){return this.sort(function(a,b){return a-b})}
var divider = function(v){ // 'foo' → '-----foo-----' of length 79
	var left = Math.floor((79 - v.length)/2), right = 79 - left - v.length
	return '-'.repeat(left)+v+'-'.repeat(right)}
var require_moment = function(){
	var old = require('moment')
	var r = function(v){
		var r = arguments.length===1 && typeof(v)==='number'? old(v*1000) : old.apply(null,arguments)
		r.valueOf = function(){return +this._d/1000 + ((this._offset || 0) * 60)}
		return r}
	for (var v in old) if (old.hasOwnProperty(v)) r[v] = old[v]
	return r}
var read_line_stdin = function(){return (function(cb){process.stdin.on('readable', function(){var t; if ((t=process.stdin.read())!==null) cb(undefined,t+'')})}).sync()}
var cyan  = function(v){return '\x1b[36;1m'+v+'\x1b[0m'}
var green = function(v){return '\x1b[32;1m'+v+'\x1b[0m'}

var m = require_moment()

//===--------------------------------------------===// log file api //===--------------------------------------------===//

var ttlog = (function(){
	var file = rc.log_file || rc.user+'.log'
	var parse = function(v){var t = v.match(/^(\d+)([^\[(]+)/); return [i(t[1]),t[2].trim()]}
	var stringify = function(time,tags){
		function lrjust(l,a,b){if ((a+' '+b).length <= l) return a+' '+' '.repeat(l-(a+' '+b).length)+b}
		var r = time+' '+tags
		return ['YYYY-MM-DD/HH:mm:ss ddd','YYYY-MM-DD/HH:mm:ss','MM-DD/HH:mm:ss','DD/HH:mm:ss','HH:mm:ss','HH:mm'
			].map(bind(m(time),'format')).map(function(t){return lrjust(79,r,'['+t+']')}).filter(function(v){return v})[0] || r }
	return {
		last: function(){var t; return (t=read_lines(file).filter(function(v){return v!==''}).slice(-1)[0])? parse(t) : undefined},
		append: function(time,tags){var r; fs.appendFileSync(file,(r=stringify(time,tags))+'\n'); return r},
		all: function(){return read_lines(file).filter(function(v){return v!==''}).map(parse)}
	} })()

//===--------------------------------------------===// ping algorithm //===--------------------------------------------===//

var pings = (function(){
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

	var seq_count = 45*60 / rc.period
	var seq_fraction = seq_count+1 - Math.ceil(seq_count)
	var seqs

	var again = seq_fraction===1? function(v){return false} : function(v){return v===seqs.slice(-1)[0] && !(bit_reverse(31,ran0_closed(v.seed,v.i)) / (Math.pow(2,31)-1) <= seq_fraction)}
	var next_s = function λ(v){var t = again(v); v.ping += interval(v.seed,v.i); v.i+=1; return t? λ(v) : v}
	var prev_s = function λ(v){v.i-=1; v.ping -= interval(v.seed,v.i); return again(v)? λ(v) : v}
	var get = function(){return seqs.min_by(function(v){return v.ping}).ping}
	var next = function(){next_s(seqs.min_by(function(v){return v.ping}))}
	var prev = function(){prev_s(seqs.max_by(function(v){return v.ping - interval(v.seed,v.i-1)}))}

	if (Math.ceil(seq_count)===1 && rc.seed===666) {seqs = [{seed:rc.seed, i:78922, ping:1397086515}]; prev()} // optimization: a recent seqs
	else seqs = range(Math.ceil(seq_count)).map(function(v){return next_s({seed:rc.seed+v, i:0, ping:1184083200})}) // the birth of timepie/tagtime!

	return {
		// time → nearest ping time < ≤ > ≥ time
		lt: function(time){while (get() <  time) next(); while (get() >= time) prev(); return get()},
		le: function(time){while (get() <= time) next(); while (get() >  time) prev(); return get()},
		gt: function(time){while (get() >  time) prev(); while (get() <= time) next(); return get()},
		ge: function(time){while (get() >= time) prev(); while (get() <  time) next(); return get()}
	} })()

//===-----------------===// functions loosely corresponding to the original tagtime architecture //===-----------------===//

// beeps at appropriate times and opens ping windows
function main(){
	var n; var t; print("TagTime is watching you! Last ping would've been",format_dur((n=now())-(t=pings.lt(n))),'ago, at',m(t).format('HH:mm:ss'))

	var start = now()
	var count = 0
	var lock = false // ugly hack
	setInterval(function(){sync(function(){
		if (lock) return; lock = true
		var t; var time = (t=ttlog.last())? pings.le(t[0]) : pings.lt(now())
		while(true) {
			var last = time; time = pings.gt(time)
			if (!(time <= now())) break

			print((++count)+': PING!',m(time).format('YYYY-MM-DD/HH:mm:ss'),'gap',format_dur(time-last),'','avg',format_dur((time-start)/count),'tot',format_dur(time-start))

			if (time < now()-rc.retro_threshold)
				ttlog.append(time,'afk RETRO')
			else
				ping(time)
			}
		lock = false
		})},3000)
	}

// prompt for what you're doing RIGHT NOW. blocks until completion.
function ping(time){exec.sync(null,'start bash -ci "tagtime.js ping_process '+Math.round(time)+';pause"')}
function ping_process(time){
	print('\u0007')
	if (now() - time > 9) {
		print(divider(''))
		print(divider(' WARNING '.repeat(8)))
		print(divider(''))
		print('This popup is',now() - time,'seconds late.')
		print('Either you were answering a previous ping when this tried to pop up, or you')
		print("just started tagtime, or your computer's extremely sluggish.")
		print(divider(''))
		print()
		}
	var last_doing = ttlog.last()[1]
	print("It's tag time! What are you doing RIGHT NOW ("+m(time).format('HH:mm:ss')+')?')
	print('Ditto ('+cyan('"')+') to repeat prev tags:',cyan(last_doing))
	var t = read_line_stdin().trim()
	t = ttlog.append(time,t==='"'? last_doing : t)
	print(green(t))
	update_graphs()
	process.exit()
	}

// updates beeminder graphs
function update_graphs(){
	// reads a log file into standard graph format {date:{pings:[ping],id:}}
	function read_log_file(){var r = {}; ttlog.all().map(function(v){var t; (r[t=m(v[0]).startOf('d')+0] = r[t] || {pings:[]}).pings.push(v[1])}); return r}
	// reads a graph from the beeminder api into standard graph format {date:{pings:[ping],id:}}
	function read_graph(user_slug){
		var r = {}
		beeminder(user_slug+'.datapoints').map(function(v){
			var time = m(v.timestamp).startOf('d')+0
			var pings = v.comment.match(/pings?:(.*)/)[1].trim().split(', ')
			var t = {pings:pings,id:v.id}
			if (r[time]) print('multiple datapoints in a day',r[time],t)
			r[time] = t})
		return r}

	Object.keys(rc.beeminder).map(function(user_slug){
		print(divider(' sending your tagtime data to bmndr/'+user_slug+' '))
		var t = user_slug.match(/^(.*)\/(.*)$/); var user = t[1]; var slug = t[2]
		var graph = read_graph(user_slug)
		var new_graph = read_log_file()
		Object.keys(new_graph).map(function(k){var v; (v=new_graph[k]).pings = v.pings.filter(function(v){return v.split(' ').filter(function(v){return v===rc.beeminder[user_slug]}).length>0})})
		var t = Object.keys(new_graph).map(i).sort_n(); var start = m(t[0]).add('d',-1)+0; var end = m(t.slice(-1)[0]).add('d',2)+0
		for (var time = start; time < end; time = m(time).add('d',1)+0) {
			var id = (graph[time]||{}).id
			var pings_old = (graph[time]    ||{}).pings||[]; var ol = pings_old.length; var o = pings_old.join(', ')
			var pings_new = (new_graph[time]||{}).pings||[]; var nl = pings_new.length; var n = pings_new.join(', ')
			//! var v = {timestamp:time, value:nl*rc.period/3600, comment:pluralize(nl,'ping')+': '+n}
			var v = {timestamp:m(time).hour(12)+0, value:nl*rc.period/3600, comment:pluralize(nl,'ping')+': '+n}
			//! oh dear that is not good; pings should log how much they're worth
			if (ol===nl && o===n) { // no change to the datapoint on this day
			} else if (ol===0 && nl > 0) { // no such datapoint on beeminder: CREATE
				print('creating datapoint',v.value,v.comment)
				print(beeminder(user_slug+'.datapoints ~=',[v]))
			} else if (ol > 0 && nl===0) { // on beeminder but not in tagtime log: DELETE
				print('deleting datapoint',id)
				print(beeminder(user_slug+'.datapoints['+id+'] ='))
			} else if (ol!==nl || o!==n) { // bmndr & tagtime log differ: UPDATE
				print('updating datapoint (old/new):')
				print('[bID:'+id+']')
				print(m(time).format(),'',v.value,v.comment)
				print(beeminder(user_slug+'.datapoints['+id+'] =',v))
			} else {
				print("ERROR: can't tell what to do with this datapoint (old/new):")
				print('[bID:'+id+']')
				print(m(time).format(),'',v.value,v.comment)
			}
		}
	}) }

//===--------------------------------------------===// choose from argv //===--------------------------------------------===//

if (!module.parent) {
	var v = process.argv.slice(2)
	if (v.length===0) main()
	else if (v.length===2 && v[0]==='ping_process') ping_process(i(v[1]))
	else if (v[0]==='e') print(eval(v.slice(1).join(' ')))
	else print('usage: ./tagtime.js')
	}

//===--------------------------------------------===// <end> //===--------------------------------------------===//

}))