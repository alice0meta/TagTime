#!/usr/bin/env node

var fs = require('fs')
var sync = require('sync')
//var L = require('lazy.js')
var exec = require('child_process').exec

sync(function(){try {

// todo: have read_graph cache its results
// todo: exit silently if tagtime is already running
// todo: update_graph should print more useful things
// todo: update_graph should "take one pass to delete any duplicates on bmndr; must be one datapt per day"
// todo: implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
// todo: use rc settings: editor terminal enforce_nums
// todo: cope with empty log file
// todo: cope with missing rc file
// todo: current afk behavior is undesirable in many ways
// ‽ todo: make this into a webapp hosted on github?
// todo: make the ping algorithm not slow to start up

////////////////////////////////////////////////////
/////  THE FOLLOWING IS COPIED FROM ELSEWHERE  ///// userscripts/gitminder, lang-alpha, stopwatch.js
////////////////////////////////////////////////////
	var print = console.log.bind(console)
	Object.mapv = function(v,f){f = f || function(v){return [v,true]}; r = {}; v.forEach(function(v){t = f(v); if (t) r[t[0]] = t[1]}); return r}
	var merge_o = function(a,b){var r = {}; Object.keys(a).forEach(function(k){r[k] = a[k]}); Object.keys(b).forEach(function(k){r[k] = b[k]}); return r}
	var seq = function(v){return typeof v === 'string'? v.split('') : v instanceof Array? v : Object.keys(v).map(function(k){return [k,v[k]]})}
	var pad_left = function(v,s,l){while (v.length < l) v = s + v; return v}
	var frequencies = function(v){return v.reduce(function(r,v){r[v] = v in r? r[v]+1 : 1; return r},{})}
	function dict_by(sq,f){var r = {}; for(var i=0;i<sq.length;i++) r[f(sq[i])] = sq[i]; return r}
	Date.prototype.hours = function(v){this.setHours(this.getHours()+v); return this}
	Date.prototype.yyyy_mm_dd = function(){var m = (this.getMonth()+1)+''; var d = this.getDate()+''; return this.getFullYear()+'-'+(m[1]?m:'0'+m)+'-'+(d[1]?d:'0'+d)}
	function now(){return Date.now() / 1000}
	String.prototype.repeat = function(v){return v<=0? '' : new Array(v+1).join(this)}
	var pad = function(v,s,l){while (v.length < l) v = s+v; return v}
	var pretty_time = function λ(v){
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

//===--------------------------------------------===// hacky hacky beeminder api //===--------------------------------------------===//

	var http = require('http')
	var https = require('https')
	function request(path,query,headers,cb,base){
		var t = path.match(/^([A-Z]+) (.*)$/); var method = t? t[1] : 'GET'; path = t? t[2] : path
		path = path.indexOf(base) === 0? path : base+path
		t = path.match(/^(https?):\/\/(.*)$/); var http_ = t[1] === 'http'? http : https; path = t[2]
		t = path.match(/^(.*?)(\/.*)$/); var host = t[1]; path = t[2]
		query = seq(query).map(function(v){return v[0]+'='+v[1]}).join('&')
		path = path+(query===''?'':'?'+query)
		http_.request({host:host,path:path,headers:headers,method:method},function(response){
			var r = []; response.on('data', function(chunk){r.push(chunk)}); response.on('end', function(){
				r = r.join('')
				//var t = ['---','fetched',pad_left(Math.round(r.length/1024)+'kb',' ',5),'---','from',host,'---']; var u = response.headers['x-ratelimit-remaining']; if (u) t.push('limit-remaining',u,'---'); print(t.join(' '))
				try {r = JSON.parse(r)}
				catch (e) {}
				//f(r,response) }) }).end()}
				cb(null,r) }) }).end()}
	function beeminder(path,query,cb){request(path,merge_o({auth_token:rc.auth.beeminder},query),{},cb,'https://www.beeminder.com/api/v1')}

	function beeminder_get(slug,cb){beeminder('/users/me/goals/'+slug+'/datapoints.json',{},cb)}
	function beeminder_create(slug,v,cb){beeminder('POST /users/me/goals/'+slug+'/datapoints/create_all.json',{datapoints:JSON.stringify(v instanceof Array? v : [v])},cb||function(e,v){print('beeminder_create returned:',v)})}
	function beeminder_delete(slug,id,cb){beeminder('DELETE /users/me/goals/'+slug+'/datapoints/'+id+'.json',{},cb||function(e,v){print('beeminder_delete returned:',v)})}
	function beeminder_update(slug,id,query,cb){beeminder('PUT /users/me/goals/'+slug+'/datapoints/'+id+'.json',query,cb||function(e,v){print('beeminder_update returned:',v)})}

//===--------------------------------------------===// util (mostly hacky) //===--------------------------------------------===//
/*
L.prototype.generate_memoized_o_sparse_sequential_len = function(){
	var t = function(f,cache){this.f = f; this.cache = cache || {}; this.len = 0}
	t.prototype = new L.Sequence()
	t.prototype.get_ = function(i){
		var j = i-1; while (this.cache[j]===undefined) j -= 1
		var v = this.get(j); for (var k=j+1;k<=i;k++) v = f(v); return v}
	t.prototype.get = function(i){if (this.cache[i]===undefined) {this.cache[i] = this.get_(i); this.len = Math.max(this.len,i+1)} return this.cache[i]}
	t.prototype.get_by = function(f){}
	t.prototype.length = function(){return this.len}
	t.prototype.last = function(){return this.get(this.length()-1)}
	return function(f,cache){return new t(f,cache)} }()*/

var err = function(v){throw Error(v)}
var pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}
var divider = function(v){ // 'foo' → '-----foo-----' of length rc.log_line_length
	var left = Math.floor((rc.log_line_length - v.length)/2), right = rc.log_line_length - left - v.length
	return '-'.repeat(left)+v+'-'.repeat(right)}
var logf = function(){return rc.log_file || rc.user+'.log'}
var slog = function(v){fs.appendFileSync(logf(),v+'\n')}
var bind = function(o,f){return o[f].bind(o)}
var def_get_proto = function(o,m,f){Object.defineProperty(o.prototype,m,{get:f})}

def_get_proto(Date,'yyyy',function(){return this.getFullYear()+''})
def_get_proto(Date,'MM',function(){return pad(this.getMonth()+1+'','0',2)})
def_get_proto(Date,'dd',function(){return pad(this.getDate()+'','0',2)})
def_get_proto(Date,'hh',function(){return pad(this.getHours()+'','0',2)})
def_get_proto(Date,'mm',function(){return pad(this.getMinutes()+'','0',2)})
def_get_proto(Date,'ss',function(){return pad(this.getSeconds()+'','0',2)})
def_get_proto(Date,'weekday',function(){return seq('UMTWRFS')[this.getDay()]})
def_get_proto(Date,'day_in_year',function(){return Math.ceil((this - new Date(this.getFullYear(),0,1))/24/60/60/1000)})
Date.prototype.hacky_format = function(v){var me = this; return v.split(/\b/).map(function(v){return me[v]||v}).join('')}
var annotate_timestamp = function(v,time){
	function lrjust(l,a,b){return a+' '+' '.repeat(l-(a+' '+b).length)+b}
	function lrjust_e(l,a,b){var r = lrjust(l,a,b); if (r.length===l) return r}
	return [
		'[yyyy-MM-dd/hh:mm:ss weekday]',
		'[yyyy-MM-dd/hh:mm:ss]',
		'[MM-dd/hh:mm:ss]',
		'[dd/hh:mm:ss]',
		'[hh:mm:ss]',
		'[hh:mm]'
		].map(bind(new Date(time*1000),'hacky_format')).map(function(t){return lrjust_e(rc.log_line_length,v,t)}).filter(function(v){return v})[0] || v}

var read_lines = function(fl){return (fs.readFileSync(fl)+'').split('\n').filter(function(v){return v!==''})}
var ymd_yesterday = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours(-12)).yyyy_mm_dd()}
var ymd_tomorrow  = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours( 36)).yyyy_mm_dd()}
var ymd_to_seconds = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours(12)/1000}

//===--------------------------------------------===// ping algorithm //===--------------------------------------------===//

var pings = new function(){
	// utils
	var bit_reverse = function(length,v){var r = 0; for (var i=0;i<length;i++){r = (r << 1) | (v & 1); v = v >> 1}; return r}
	var i32_mul_mod = function(a,b,m) { // a*b % m
		var ah = (a >> 16) & 0xffff, al = a & 0xffff
		var bh = (b >> 16) & 0xffff, bl = b & 0xffff
		return (al*bl + ((ah*bl + al*bh) * Math.pow(2,16)) + ah*bh * (Math.pow(2,32) % m)) % m}
	var pow_mod = function(v,e,m){ // vᵉ % m
		var r = 1; while (e > 0) {if (e % 2 === 1) r = i32_mul_mod(r,v,m); v = i32_mul_mod(v,v,m); e = e >> 1}; return r}
	var range = function(l){var r = []; for (var i=0;i<l;i++) r.push(i); return r}
	Array.prototype.min_by = function(f){
		if (this.length <= 1) return this[0]
		var r = this[0]; var fr = f(r)
		this.slice(1).map(function(v){var t = f(v); if (t < fr) {r = v; fr = t}})
		return r}
	Array.prototype.max_by = function(f){
		if (this.length <= 1) return this[0]
		var r = this[0]; var fr = f(r)
		this.slice(1).map(function(v){var t = f(v); if (t > fr) {r = v; fr = t}})
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
	var next = function(){next_s(seqs.min_by(function(v){return v.ping})); return get()}
	var prev = function(){prev_s(seqs.max_by(function(v){return v.ping - interval(v.seed,v.i-1)})); return get()}

	if (Math.ceil(seq_count)===1 && rc.seed===666) {seqs = [{seed:rc.seed, i:78922, ping:1397086515}]; prev()} // optimization: a recent seqs
	else seqs = range(Math.ceil(seq_count)).map(function(v){return next_s({seed:rc.seed+v, i:0, ping:1184083200})}) // the birth of timepie/tagtime!

	// time → last scheduled ping time < time
	this.prev = function(time){while (get() < time) next(); while (get() >= time) prev(); return get()}
	// time → first scheduled ping time > time
	this.next = function(time){while (get() > time) prev(); while (get() <= time) next(); return get()}
	// time → first scheduled ping time ≥ time
	this.get  = function(time){while (get() >= time) prev(); while (get() < time) next(); return get()}
	}

//===--------------------------------------------===// functions loosely corresponding to commands //===--------------------------------------------===//

// beeps at appropriate times and opens ping windows
function main(){
	var start = now()
	var last = pings.prev(start)

	pings_if()

	print("TagTime is watching you! Last ping would've been",pretty_time(now()-last),'ago')

	var next = pings.next(last)
	var i = 1
	var in_sync = false // ugly lock hack
	setInterval(function(){sync(function(){
		if (in_sync) return; in_sync = true
		var time = now()
		if (next <= time) {
			if (rc.catchup || next > time-rc.retro_threshold)
				print('\u0007')
			pings_if()
			time = now()
			print(annotate_timestamp(pad(i+'',' ',4)+': PING! gap '+pretty_time(next-last)+'  avg '+pretty_time((time-start)/i)+' tot '+pretty_time(time-start), next))
			last = next
			next = pings.next(next)
			i += 1
		}
		in_sync = false
	})},1000)
	}

// handle any pings between the last recorded ping and now
//! skips past a lot of multiple-pings-handling logic, but that should be entirely reimplemented from a high level
function pings_if(){
	var launch_time = now() //! ??

	var last_log_line = read_lines(logf()).slice(-1)[0]
	var last = last_log_line===undefined? pings.prev(launch_time) : parseInt(last_log_line.match(/^\d+/)[0])
	var next = pings.get(last)
	if (next !== last) {
		print('TagTime log file ('+logf()+') has bad last line:\n'+last_log_line)
		//! probably remove: next = pings.prev(launch_time)
	}
	next = pings.next(next)

	while (next <= now()) {
		if (next < now()-rc.retro_threshold) {
			var tags = next < launch_time-rc.retro_threshold? ' afk off RETRO' : ' afk RETRO'
			slog(annotate_timestamp(next+tags,next))
			//!todo: give an opportunity to then edit the pings in an editor
		} else {
			ping(next) // blocking
		}
		next = pings.next(next)
	}
	}

// prompt for what you're doing RIGHT NOW. blocks until completion.
function ping(time){exec.sync(null,'start bash -ci "tagtime.js ping_process '+Math.round(time)+';pause"')}
function ping_process(time){
	// Return what the user was last doing by extracting it from their logfile.
	function get_last_doing(){var t = read_lines(logf()).slice(-1)[0]; return t?t.match(/^\d+([^\[(]+)/)[1].trim():''}

	var ping_time = now()

	if (ping_time - time > 9) {
		print(divider(''))
		print(divider(' WARNING '.repeat(8)))
		print(divider(''))
		print('This popup is',ping_time - time,'seconds late.')
		print('Either you were answering a previous ping when this tried to pop up, or you')
		print("just started tagtime, or your computer's extremely sluggish.")
		print(divider(''))
		print()
	}

	//!todo
		//my $tskf = "$path$usr.tsk";
		//# walk through the task file, printing the active tasks and capturing the list
		//# of tags for each task (capturing in a hash keyed on task number).
		//# TODO: have a function that takes a reference to a tasknum->tags hash and a
		//# tasknum->fulltaskline hash and populates those hashes, purging them first.
		//# that way we we're not duplicating most of this walk through code. one 
		//# annoyance: we want to print them in the order they appear in the task file.
		//# maybe an optional parameter to the function that says whether to print the
		//# tasks to stdout as you encounter them.
		//if(-e $tskf) {  # show pending tasks
		//  if(open(F, "<$tskf")) {
		//    while(<F>) {
		//      if(/^\-{4,}/ || /^x\s/i) { print; last; }
		//      if(/^(\d+)\s+\S/) {
		//        print;
		//        $tags{$1} = gettags($_);  # hash mapping task num to tags string
		//      } else { print; }
		//    }
		//    close(F);
		//  } else {
		//    print "ERROR: Can't read task file ($tskf)\n";
		//    $eflag++;
		//  }
		//  print "\n";
		//}

	print("It's tag time! What are you doing RIGHT NOW ("+new Date(time*1000).hacky_format('hh:mm:ss')+')?')

	var last_doing = get_last_doing()
	function cyan (v){return '\x1b[36;1m'+v+'\x1b[0m'}
	function green(v){return '\x1b[32;1m'+v+'\x1b[0m'}
	print('Ditto ('+cyan('"')+') to repeat prev tags:',cyan(last_doing))

	var read_once = false
	process.stdin.on('readable', function(_){sync(function(){
		var resp = process.stdin.read(); if (resp!==null){
			if (read_once) return; read_once = true

			resp = (resp+'').trim()
			if (resp==='"') resp = last_doing

			//!todo
				//  # refetch the task numbers from task file; they may have changed.
				//  if(-e $tskf) {
				//    if(open(F, "<$tskf")) {
				//      %tags = ();  # empty the hash first.
				//      while(<F>) {
				//        if(/^\-{4,}/ || /^x\s/i) { last; }
				//        if(/^(\d+)\s+\S/) { $tags{$1} = gettags($_); } 
				//      }
				//      close(F);
				//    } else {
				//      print "ERROR: Can't read task file ($tskf) again\n";
				//      $eflag++;
				//    }
				//  }

			//! original tagtime parses out comments from resp here, as distinct from tags, but i don't understand what it is
			var tags = resp.split(/\s+/)//!.concat(auto_tags)
			var t = annotate_timestamp(time+' '+tags.join(' '),time)
			print(green(t))
			slog(t)

			if (Object.keys(rc.beeminder).length > 0 && resp!=='') {
				print(divider(' sending your tagtime data to beeminder '))
				Object.keys(rc.beeminder).map(function(v){update_graph(v,read_log_file(logf()))})
			}

			process.exit()
			}})})
	}

// reads a graph from the beeminder api into standard graph format {yyyy_mm_dd:{pings:[ping],id:}}
function read_graph(user,slug){
	var r = {}
	beeminder_get.sync(null,slug).map(function(v){
		var day = new Date(v.timestamp*1000).yyyy_mm_dd()
		var t = v.comment.match(/(\d+)\s+pings?:(.*)/); var n = parseInt(t[1]); var pings = t[2].trim().split(', ')
		if (pings.length !== n) print('datapoint looks bad:',v)
		var t = {pings:pings,id:v.id}
		if (r[day]) print('multiple datapoints in a day',r[day],t)
		r[day] = t})
	return r}

// reads a log file into standard graph format {yyyy_mm_dd:{pings:[ping],id:}}
function read_log_file(log_file){
	var r = {}
	read_lines(log_file).map(function(v){
		var t = v.match(/^(\d+)([^\[(]+)/); var day = t[1]; var tags = t[2]
		day = new Date(day*1000).yyyy_mm_dd()
		;(r[day] = r[day] || {pings:[]}).pings.push(tags.trim())
	})
	return r}

// updates graph at user_slug with data from new_graph, filtered by rc.beeminder
function update_graph(user_slug,new_graph){
	var t = user_slug.match(/^(.*)\/(.*)$/); var user = t[1]; var slug = t[2]
	var graph = read_graph(user,slug)
	Object.keys(new_graph).map(function(k){var v = new_graph[k]; v.pings = v.pings.filter(function(v){return v.split(' ').filter(function(v){return v===rc.beeminder[user_slug]}).length>0})})
	var t = Object.keys(new_graph).sort(); var start = t[0]; var end = t.slice(-1)[0]
	for (var day = ymd_yesterday(start); day <= ymd_tomorrow(end); day = ymd_tomorrow(day)) {
		var id = (graph[day]||{}).id
		var pings_old = (graph[day]||{}).pings;     var ol = (pings_old||[]).length; var o = (pings_old||[]).join(', ')
		var pings_new = (new_graph[day]||{}).pings; var nl = (pings_new||[]).length; var n = (pings_new||[]).join(', ')
		var v = {timestamp:ymd_to_seconds(day), value:nl*rc.period/3600, comment:pluralize(nl,'ping')+': '+n}
		//! oh dear that is not good; pings should log how much they're worth
		if (ol===nl && o===n) { // no change to the datapoint on this day
		} else if (id===undefined && nl > 0) { // no such datapoint on beeminder: CREATE
			print('creating datapoint',v.value,v.comment)
			print(beeminder_create.sync(null,slug,v))
		} else if (ol > 0 && nl===0) { // on beeminder but not in tagtime log: DELETE
			print('deleting datapoint',id)
			print(beeminder_delete.sync(null,slug,id))
		} else if (ol!==nl || o!==n) { // bmndr & tagtime log differ: UPDATE
			print('updating datapoint (old/new):')
			print('[bID:'+id+']')
			print(day,'',v.value,v.comment)
			print(beeminder_update.sync(null,slug,id,v))
		} else {
			print("ERROR: can't tell what to do with this datapoint (old/new):")
			print('[bID:'+id+']')
			print(day,'',v.value,v.comment)
		}
	} }

//===--------------------------------------------===// choose from argv //===--------------------------------------------===//

if (!module.parent) {
	if (process.argv.length===2) main()
	else if (process.argv.length===4 && process.argv[2]==='ping_process') ping_process(parseInt(process.argv[3]))
	else if (process.argv.length===4 && process.argv[2]==='e') print(eval(process.argv[3]))
	else print('usage: ./tagtime.js')
}

/*
//===--------------------------------------------===// choose command from argv //===--------------------------------------------===//
var commands = new function(){
	var varargs = function(f){f.varargs = true; return f}

	this.undefined = main
	this.grppings = varargs(function(log_file,exprs){throw 'grppings not yet implemented'})
	this.cntpings = varargs(function(log_file,exprs){throw 'cntpings not yet implemented'})
	this.tskedit = function(){throw 'tskedit not yet implemented'}
	this.merge = varargs(function(log_files){throw 'merge not yet implemented'})

	this.help = function(){
		print('usage: ')
		print('  ./tagtime.js                          : the TagTime daemon')
		print('  ./tagtime.js grppings log_file exprs+ : grep your TagTime log file')
		print('  ./tagtime.js cntpings log_file exprs+ : tally pings matching given criteria')
		print('  ./tagtime.js tskedit                  : todo list that integrates w/ TagTime')
		print('  ./tagtime.js merge log_file+          : for fixing/merging TagTime logs')
		}

	//this.e = function(v){print(eval(v))}
	this.ping_process = ping_process
	}
;(function(){
	var f = commands[process.argv[2]]||commands.help
	var args = process.argv.slice(3)
	if (f.length < args.length && !f.varargs) print('WARNING: discarding',pluralize(args.length-f.length,'argument')+':',args.slice(f.length))
	try {f.apply(null,f.varargs? args.slice(0,f.length-1).concat([args.slice(f.length-1)]) : args)}
	catch (e) {print('error!',e,e.message,e.stack)}
	})()
*/

} catch (e) {print('error!',e,e.message,e.stack)}})