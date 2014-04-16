#!/usr/bin/env node

var fs = require('fs')
var util = require('util')
var sync = require('sync')

// todo:
// refactor things so this doesn't just copy a large block of code from tagtime.js

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
	var parse = function(v){var t = v.match(/^(\d+)([^\[]+)/); return [i(t[1]),t[2].trim()]}
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

//===--------------------------------------------===// log_upgrade //===--------------------------------------------===//

function main(out){fs.writeFileSync(out||rc.log_file||rc.user+'.log',ttlog.all().map(function(v){return [m(v[0]).format('YYYY-MM-DDTHH:mm:ssZ'),rc.period/3600,v[1]]}).map(function(v){return util.inspect(v).replace(/\n */g,' ').slice(2,-2)}).join('\n'))}

//===--------------------------------------------===// choose from argv //===--------------------------------------------===//

if (!module.parent) {
	var v = process.argv.slice(2)
	if (v.length<=1) main(v[0])
	else if (v[0]==='e') print(eval(v.slice(1).join(' ')))
	else print('usage: ./log_upgrade.js <out-file>?')
	}

//===--------------------------------------------===// <end> //===--------------------------------------------===//

}))