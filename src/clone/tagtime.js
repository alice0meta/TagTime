#!/usr/bin/env node

var fs = require('fs')
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')
var sync = require('sync')
var exec = require('child_process').exec

sync(function(){

// todo: implement commands: install grppings cntpings tskedit tskproc merge
// todo: have read_graph cache its results
// todo: exit silently if tagtime is already running
// todo: update_graph should print more useful things
// todo: update_graph should "take one pass to delete any duplicates on bmndr; must be one datapt per day"
// todo: implement "In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock."
// todo: use rc settings: editor terminal enforce_nums
// todo: cope with empty log file
// todo: cope with missing rc file

var GAP = 45*60
var INIT_SEED = 666

////////////////////////////////////////////////////
/////  THE FOLLOWING IS COPIED FROM ELSEWHERE  ///// userscripts/gitminder, lang-alpha, stopwatch.js
////////////////////////////////////////////////////
	var print = console.log.bind(console)
	Object.mapv = function(v,f){f = f || function(v){return [v,true]}; r = {}; v.forEach(function(v){t = f(v); if (t) r[t[0]] = t[1]}); return r}
	var merge_o = function(a,b){var r = {}; Object.keys(a).forEach(function(k){r[k] = a[k]}); Object.keys(b).forEach(function(k){r[k] = b[k]}); return r}
	var seq = function(v){return typeof v === 'string'? v.split('') : v instanceof Array? v : Object.keys(v).map(function(k){return [k,v[k]]})}
	var pad_left = function(v,s,l){while (v.length < l) v = s + v; return v}
	function frequencies(v){var r = {}; v.forEach(function(v){r[v] = v in r? r[v]+1 : 1}); return r}
	function dict_by(sq,f){var r = {}; for(var i=0;i<sq.length;i++) r[f(sq[i])] = sq[i]; return r}
	Date.prototype.hours = function(v){this.setHours(this.getHours()+v); return this}
	Date.prototype.yyyy_mm_dd = function(){var m = (this.getMonth()+1)+''; var d = this.getDate()+''; return this.getFullYear()+'-'+(m[1]?m:'0'+m)+'-'+(d[1]?d:'0'+d)}
	function now(){return Date.now() / 1000}
	String.prototype.repeat = function(v){return new Array(v+1).join(this)}
	var pad = function(v,s,l){while (v.length < l) v = s+v; return v}
	var pretty_time = function λ(v){
		v = Math.round(v)
		if (v<0) return '-'+λ(-v)
		var d = Math.floor(v/60/60/24), h = Math.floor(v/60/60)%24, m = Math.floor(v/60)%60, s = v%60
		return [d+'d',pad(h+'','0',2)+'h',pad(m+'','0',2)+'m',pad(s+'','0',2)+'s'].slice(d>0?0:h>0?1:m>0?2:3).join('')}
	/////////////////////////////////////////////////////////
	//////////////////  END COPIED SECTION  /////////////////
	/////////////////////////////////////////////////////////

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

var err = function(v){throw Error(v)}
var pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}
var dd = function(v){return pad(v+'','0',2)}
var divider = function(v){ // 'foo' → '-----foo-----' of length rc.log_line_length
	var left = Math.floor((rc.log_line_length - v.length)/2), right = rc.log_line_length - left - v.length
	return '-'.repeat(left)+v+'-'.repeat(right)}
var logf = function(){return rc.log_file || rc.user+'.log'}
var slog = function(v){fs.appendFileSync(logf(),v+'\n')}
var dt = function(v){v = v || now() // Date/time: Takes unixtime in seconds and returns list of [year, mon, day, hr, min, sec, day-of-week, day-of-year, is-daylight-time]
	Date.prototype.stdTimezoneOffset = function(){return Math.max(new Date(this.getFullYear(), 0, 1).getTimezoneOffset(), new Date(this.getFullYear(), 6, 1).getTimezoneOffset())}
	Date.prototype.dst = function(){return this.getTimezoneOffset() < this.stdTimezoneOffset()}
	var getDOY = function(v){var onejan = new Date(v.getFullYear(),0,1); return Math.ceil((v - onejan) / 86400000)}
	v = new Date(v*1000)
	return [v.getFullYear(),dd(v.getMonth()+1),dd(v.getDate()),dd(v.getHours()),dd(v.getMinutes()),dd(v.getSeconds()),'SUN MON TUE WED THU FRI SAT'.split(' ')[v.getDay()],getDOY(v),v.dst()]}
var annotate_timestamp = function(v,time){ 
	function lrjust(a,b){return a+' '+' '.repeat(Math.max(0,rc.log_line_length-(a+' '+b).length))+b}
	var _ = dt(time); var yea=_[0],o=_[1],d=_[2],h=_[3],m=_[4],s=_[5],wd=_[6]
	return [
		'['+yea+'.'+o+'.'+d+' '+h+':'+m+':'+s+' '+wd+']',
		'['+o+'.'+d+' '+h+':'+m+':'+s+' '+wd+']',
		'['+d+' '+h+':'+m+':'+s+' '+wd+']',
		'['+o+'.'+d+' '+h+':'+m+':'+s+']',
		'['+h+':'+m+':'+s+' '+wd+']',
		'['+o+'.'+d+' '+h+':'+m+']',
		'['+h+':'+m+' '+wd+']',
		'['+h+':'+m+':'+s+']',
		'['+h+':'+m+']',
		'['+m+']'
		].map(function(t){if ((v+' '+t).length <= rc.log_line_length) return lrjust(v,t)}).filter(function(v){return v})[0] || v}

var read_lines = function(fl){return (fs.readFileSync(fl)+'').split('\n').filter(function(v){return v!==''})}
var ymd_yesterday = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours(-12)).yyyy_mm_dd()}
var ymd_tomorrow  = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours( 36)).yyyy_mm_dd()}
var ymd_to_seconds = function(v){var t = v.match(/^(\d+)-(\d+)-(\d+)$/); return new Date(parseInt(t[1]),parseInt(t[2])-1,parseInt(t[3])).setHours(12)/1000}

var tagtime_rng = new function(){
	var IA = 16807      // 7^5: constant used for RNG (see p37 of Simulation by Ross)
	var IM = 2147483647 // 2^31-1: constant used for RNG
	var seed = INIT_SEED // a global variable that is really the state of the RNG.
	
	function ran0(){return (seed = IA*seed % IM)} // Returns a random integer in [1,IM-1]; changes seed, ie, RNG state. (This is ran0 from Numerical Recipes and has a period of ~2 billion.)
	function exprand(){return -(GAP*Math.log(ran0()/IM))}

	this.prev_ping = function(time){
		seed = INIT_SEED
		//!‽ Starting at the beginning of time, walk forward computing next pings until the next ping is >= t.
		//!‽ this takes 78526 iterations as of 2014-03-27/16:19
		var nxtping = 1184083200 // the birth of timepie/tagtime!
		var lstping = nxtping
		var lstseed = seed
		while (nxtping < time) {
			lstping = nxtping
			lstseed = seed
			nxtping = this.next_ping(nxtping)
			}
		seed = lstseed
		return lstping}
	// Takes previous ping time, returns random next ping time (unixtime).
	// NB: this has the side effect of changing the RNG state ($seed) and so should only be called once per next ping to calculate, after calling prevping.
	this.next_ping = function(prev){return Math.max(prev+1,Math.round(prev+exprand()))}
	}

//===--------------------------------------------===// functions loosely corresponding to commands //===--------------------------------------------===//

// beeps at appropriate times and opens ping windows
function main(){
	var start = now()
	var last = tagtime_rng.prev_ping(start)
	var next = tagtime_rng.next_ping(last)

	pings_if()

	print("TagTime is watching you! Last ping would've been",pretty_time(now()-last),'ago')

	var i = 1
	var in_sync = false // ugly lock hack
	setInterval(function(){sync(function(){
		if (in_sync) return; in_sync = true
		var time = now()
		print('in',i,next,time,time-next)
		if (next <= time) {
			if (rc.catchup || next > time-rc.retro_threshold)
				print('\u0007')
			pings_if()
			time = now()
			print(annotate_timestamp(pad(i+'',' ',4)+': PING! gap '+pretty_time(next-last)+'  avg '+pretty_time((time-start)/i)+' tot '+pretty_time(time-start), next))
			last = next
			next = tagtime_rng.next_ping(tagtime_rng.next_ping(tagtime_rng.prev_ping(next)))
			i += 1
		}
		in_sync = false
	})},1000)
	}

// handle any pings between the last recorded ping and now
//! skips past a lot of multiple-pings-handling logic, but that should be entirely reimplemented from a high level
function pings_if(){
	var launch_time = now()

	var last_log_line = read_lines(logf()).slice(-1)[0]
	var last = last_log_line===undefined? tagtime_rng.prev_ping(launch_time) : parseInt(last_log_line.match(/^\d+/)[0])
	var next
	if (last === tagtime_rng.next_ping(tagtime_rng.prev_ping(last))) {
		next = tagtime_rng.next_ping(last)
	} else {
		print('TagTime log file ('+logf()+') has bad last line:\n'+last_log_line)
		next = tagtime_rng.next_ping(tagtime_rng.prev_ping(last))
		//! probably remove: next = tagtime_rng.prev_ping(launch_time)
	}

	while (next <= now()) {
		if (next < now()-rc.retro_threshold) {
			var tags = next < launch_time-rc.retro_threshold? ' afk off RETRO' : ' afk RETRO'
			slog(annotate_timestamp(next+tags,next))
			//!todo: give an opportunity to then edit the pings in an editor
		} else {
			ping(next,[]) // blocking
		}
		next = tagtime_rng.next_ping(next)
	}
	}

// prompt for what you're doing RIGHT NOW. blocks until completion.
function ping(time,auto_tags){exec.sync(null,'start bash -ci "tagtime.js ping_process '+Math.round(time)+' '+auto_tags.join(' ')+';pause"')}
function ping_process(time,auto_tags){
	// Return what the user was last doing by extracting it from their logfile.
	function get_last_doing(){var t = read_lines(logf()).slice(-1)[0]; return t?t.match(/^\d+([^\[(]+)/)[1].trim():''}

	var ping_time = now()

	if (ping_time - time > 9) {
		print(divider(''))
		print(divider(' WARNING '.repeat(8)))
		print(divider(''))
		print('This popup is',ping_time - t,'seconds late.')
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

	var t = new Date(time*1000); var s = dd(t.getSeconds()), m = dd(t.getMinutes()), h = dd(t.getHours()), d = dd(t.getDate())
	print("It's tag time! What are you doing RIGHT NOW ("+h+":"+m+":"+s+")?")

	var last_doing = get_last_doing()
	print('Ditto (") to repeat prev tags:','\x1b[36;1m'+last_doing+'\x1b[0m')

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
			print('\x1b[32m'+t+'\x1b[0m')
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
		var v = {timestamp:ymd_to_seconds(day), value:nl*GAP/3600, comment:pluralize(nl,'ping')+': '+n}
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

//===--------------------------------------------===// choose command from argv //===--------------------------------------------===//

var commands = new function(){
	var varargs = function(f){f.varargs = true; return f}

	this.e = function(v){print(eval(v))}
	
	this.tagtimed = this.undefined = main
	this.launch = pings_if
	this.ping = function(time){ping(time || now(),time?[]:['UNSCHED'])}
	this.ping_process = varargs(ping_process)

	this.install = function(username){throw 'install not yet implemented'}
	this.grppings = varargs(function(log_file,exprs){throw 'grppings not yet implemented'})
	this.cntpings = varargs(function(log_file,exprs){throw 'cntpings not yet implemented'})
	this.tskedit = function(){throw 'tskedit not yet implemented'}
	this.merge = varargs(function(log_files){throw 'merge not yet implemented'})
	this.beeminder = function(log_file,user_slug){update_graph(user_slug,read_log_file(log_file))}

	this.help = function(){
		print('usage: ')
		print('  ./tagtime.js tagtimed?                 : the TagTime daemon')
		print('  ./tagtime.js launch                    : runs ping for any unhandled pings')
		print('  ./tagtime.js ping timestamp?           : prompts for the tags')
		print('  ---')
		print('  ./tagtime.js install username          : install script')
		print('  ./tagtime.js grppings log_file exprs+  : grep your TagTime log file')
		print('  ./tagtime.js cntpings log_file exprs+  : tally pings matching given criteria')
		print('  ./tagtime.js tskedit                   : todo list that integrates w/ TagTime')
		print('  ./tagtime.js merge log_file+           : for fixing/merging TagTime logs')
		print('  ./tagtime.js beeminder log_f user/slug : uploads to a beeminder graph')
		}
	}
;(function(){
	var f = commands[process.argv[2]]||commands.help
	var args = process.argv.slice(3)
	if (f.length < args.length && !f.varargs) print('WARNING: discarding',pluralize(args.length-f.length,'argument')+':',args.slice(f.length))
	try {f.apply(null,f.varargs? args.slice(0,f.length-1).concat([args.slice(f.length-1)]) : args)}
	catch (e) {print('error!',e,e.message,e.stack)}
	})()

})