#!/usr/bin/env node

// later todo: implement commands install grppings cntpings tskedit tskproc merge
// todo: get a sane header
// todo: have read_graph cache its results
// todo: exit silently if tagtime is already running
// todo: implement functions

var print = console.log.bind(console)
var pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}

//===--------------------------------------------===// main functions //===--------------------------------------------===//

// beeps at appropriate times and opens ping windows
function main(){
	throw ''
}

// handle any pings between the last recorded ping and now
function pings_if(){
	throw ''
}

// prompt for what you're doing RIGHT NOW
function ping(time,tags){
	throw ''
}

// reads a graph from the beeminder api into standard graph format
function read_graph(user_slug){
	throw ''
}

// reads a log file into standard graph format
function read_log_file(log_file){
	throw ''
}

// updates graph at user_slug with data from new_graph
function update_graph(user_slug,new_graph){
	var graph = read_graph(user_slug)
	throw ''
}

//===--------------------------------------------===// choose command from argv //===--------------------------------------------===//

var commands = new function(){
	var varargs = function(f){f.varargs = true; return f}
	
	this.undefined = this.tagtimed = main
	this.launch = pings_if
	this.ping = function(time){ping(time || now(),time?[]:['UNSCHED'])}

	this.install = function(username){
		throw 'install not yet implemented'
	}
	this.grppings = varargs(function(log_file,exprs){
		throw 'grppings not yet implemented'
	})
	this.cntpings = varargs(function(log_file,exprs){
		throw 'cntpings not yet implemented'
	})
	this.tskedit = function(){
		throw 'tskedit not yet implemented'
	}
	this.merge = varargs(function(log_files){
		throw 'merge not yet implemented'
	})
	this.beeminder = function(log_file,user_slug){update_graph(username_slug,read_log_file(log_file))}

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
	f.apply(null,f.varargs? args.slice(0,f.length-1).concat([args.slice(f.length-1)]) : args)
	})()