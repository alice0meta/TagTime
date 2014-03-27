#!/usr/bin/env node

// todo: global rename ping_\w+ → \w+_ping
// todo: cope with an empty log file

var fs = require('fs')
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')
var util = require('./util')
var launch = require('./launch')
//var sync = require('sync')

//! bah
function now(){return Date.now() / 1000}
var print = console.log.bind(console)
function pad(v,s,l){while (v.length < l) v = s+v; return v}
//! bad
function logf(){return rc.user+'.log'}

//sync(function(){
	var ping_last = util.prev_ping(now())
	var ping_next = util.next_ping(ping_last)

	launch.go() // Catch up on any old pings.

	print("TagTime is watching you! Last ping would've been",util.ss(now()-ping_last),'ago')

	var start = now()

	var i = 1
	setInterval(function(){
		var now_ = now()
		if (ping_next <= now_) {
			if (rc.catchup || ping_next > now_-rc.retro_threshold)
				print('\u0007')
			launch.go()
			now_ = now()
			print(util.annotate_timestamp(pad(i+'',' ',4)+': PING! gap '+util.ss(ping_next-ping_last)+'  avg '+util.ss((now_-start)/i)+' tot '+util.ss(now_-start), ping_next, 72))
			ping_last = ping_next
			ping_next = util.next_ping(ping_next)
			i += 1
		}
	},1000)
//})