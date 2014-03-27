#!/usr/bin/env node

var fs = require('fs')
var exec = require('child_process').exec
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')
var util = require('./util')
var beeminder = require('./beeminder')
var sync = require('sync')

//! bah load.α
function now(){return Date.now() / 1000}
var print = console.log.bind(console)
String.prototype.repeat = function(v){return new Array(v+1).join(this)}
//! bah stopwatch.js
pad = function(v,s,l){while (v.length < l) v = s+v; return v}
//! bad
function logf(){return rc.user+'.log'}
function dd(v){return pad(v+'','0',2)}

// Prompt for what you're doing RIGHT NOW.
// In the future this should show a cool pie chart that lets you click on the appropriate pie slice, making that slice grow slightly. And the slice boundaries could be fuzzy to indicate the confidence intervals! Ooh, and you can drag the slices around to change the order so similar things are next to each other and it remembers that order for next time! That's gonna rock.
module.exports.go = function(argv1,f){exec('start bash -ci "ping.js '+argv1+';pause"',{},f)}
if (require.main===module) go2()
function go2(){
	var ping_time = now()

	// don't bother with tskf today

	// if passed a parameter, take that to be the timestamp for this ping.
	var t = process.argv[2]

	if (ping_time-t > 9){
		print(util.divider(''))
		print(util.divider(' WARNING '.repeat(8)))
		print(util.divider(''))
		print('This popup is',ping_time-t,'seconds late.')
		print('Either you were answering a previous ping when this tried to pop up, or you just')
		print("started the tagtime daemon (tagtimed.pl), or your computer's extremely sluggish.")
		print(util.divider(''))
		print()
	}

	var tt = new Date(); var s = dd(tt.getSeconds()), m = dd(tt.getMinutes()), h = dd(tt.getHours()), d = dd(tt.getDate())

	print("It's tag time!  What are you doing RIGHT NOW ("+h+":"+m+":"+s+")?")

	// Get what the user was last doing.
	var last_doing = get_last_doing().trim()

	// todo: colorize with CYAN() . BOLD() . $last_doing . RESET()
	print('Ditto (") to repeat prev tags:',last_doing)

	process.stdin.on('readable', function(what) {var resp = process.stdin.read(); if (resp !== null) {
		resp = resp+''
		if (resp.trim() === '"') resp = last_doing
		var tagstr = util.strip(resp).trim().replace(/\s+/g,' ')
		var comments = util.stripc(resp).trim()
		var a = util.annotate_timestamp(t+' '+tagstr+' '+comments,t)
		print(a)
		util.slog(a+'\n')

		// Send your TagTime log to Beeminder if user has %beeminder hash non-empty. (maybe should do this after retropings too but launch.pl would do that).
		if (Object.keys(rc.beeminder).length > 0 && resp.trim()!=='') {
			print(util.divider(' sending your tagtime data to beeminder '))
			Object.keys(rc.beeminder).map(function(v){print(v+':',bm(v))})
		}

		//process.exit()
	}})
	/*var resp,tagstr,comments,a
	do {
		var chunk = process.stdin.on('readable', function(chunk) {
			resp = process.stdin.read()
			if (chunk !== null) {
				print('data: ' + chunk)
			}
		})
		return;
		//process.stdin.resume()
		//resp = fs.readSync(process.stdin.fd, 100, 0, 'utf8')+''
		//process.stdin.pause()

		if (resp.trim() === '"') resp = last_doing

		tagstr = util.strip(resp).trim()
		comments = util.stripc(resp).trim()
		//tagstr = tagstr.replace(/\b(\d+)\b/g, // s/\b(\d+)\b/($tags{$1} eq "" ? "$1" : "$1 ").$tags{$1}/eg;
		//tagstr = tagstr.replace(/\b(\d+)\b/g,'tsk $1')
		tagstr = tagstr.replace(/\s+/g,' ')
		a = util.annotate_timestamp(t+' '+tagstr+' '+comments,t)+'\n'
		//print('what',tagstr)
	} while (tagstr !== '')
	print(a)
	util.slog(a)

	// Send your TagTime log to Beeminder if user has %beeminder hash non-empty. (maybe should do this after retropings too but launch.pl would do that).
	if (Object.keys(rc.beeminder).length > 0 && resp.trim()!=='') {
		print(util.divider(' sending your tagtime data to beeminder '))
		Object.keys(rc.beeminder).map(function(v){print(v+':',bm(v))})
	}
	*/
}
// Send pings to the given beeminder goal, e.g. passing "alice/foo" sends appropriate (as defined in .tagtimerc) pings to bmndr.com/alice/foo
function bm(v){return beeminder.go(rc.user+'.log',v)}

// Return what the user was last doing by extracting it from their logfile.
function get_last_doing(){var t = (fs.readFileSync(logf())+'').split('\n').slice(-1)[0]; return t?util.strip(t.match(/^\d+\s+(.*)/)[1]):''}