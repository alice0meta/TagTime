require("zeta-two");var http = require('http')
var https = require('https')
var EventEmitter = require('events').EventEmitter
var app = require('app')

var R = module.exports

var clog = R.clog = function(){return print.apply(null,[moment()].concat(ζ2_A(arguments)))}

var JsonFile = {'$':function(){return JSON.parse(fs(this).$)}, '=':function(v){fs(this).$ = JSON.stringify(v,null,'\t')},}
var rc = R.rc = fs(app.getDataPath()).join('settings.json').as_type(JsonFile)
if (!rc.exists()) rc.$ = {period:45, ping_sound:'loud-ding.wav', auth:{}}

R.rc_ = function(q,v){
	// atom-shell remote is weird, so have a hack to make things work anyway
	if (v === undefined) {return eval('rc.$'+q)}
	else {var t = rc.$; eval('t'+q+' = v'); rc.$ = t} }

// less hacky hacky partial beeminder api
// !! this is what i wanted method_missing for
var request = function(method,path,query,headers,cb){
	var t = path.match(/^(https?):\/\/(.*)$/); var http_ = t[1] === 'http'? http : https; path = t[2]
	var t = path.match(/^(.*?)(\/.*)$/); var host = t[1]; path = t[2]
	query = _(query).pairs().map(function(v){return encodeURIComponent(v[0])+'='+encodeURIComponent(v[1])}).join('&')
	path = path+(query===''?'':'?'+query)
	clog('REQUEST',method,host+path)
	http_.request({host:host,path:path,headers:headers,method:method},function(resp){
		var t = []; resp.on('data',function(chunk){t.push(chunk)}); resp.on('end',function(){
			t = t.join('')
			try {var json = JSON.parse(t)} catch (e) {var err = e}
			cb(err,{json:json,string:t,response:resp}) }) }).end() }
R.beeminder = function(v){var a = ζ2_A(arguments).slice(1); var cb = a.pop(); var arg = a[0]
	var base = 'https://www.beeminder.com/api/v1/'
	var auth = {auth_token:rc.$.auth.beeminder}
	var t0 = cb; cb = function(e,v){if (!e && (v.error || (v.errors && v.errors.length > 0))) t0(v.error||v.errors,v); else t0(e,v)}
	var t1 = cb; cb = function(e,v){t1(e, e? v : v.json)}
	var ug = v.match(/^(.+)\/(.+)$/)
	var ugd = v.match(/^(.+)\/(.+)\.datapoints$/)
	var ugdc = v.match(/^(.+)\/(.+)\.datapoints \*=$/)
	var ugdu = v.match(/^(.+)\/(.+)\.datapoints\[(.+)\] =$/)
	if (!ug) request('GET',base+'users/'+v+'.json',auth,{},cb)
	else if (ugd) request('GET',base+'users/'+ugd[1]+'/goals/'+ugd[2]+'/datapoints.json',auth,{},cb)
	else if (ugdc) request('POST',base+'users/'+ugdc[1]+'/goals/'+ugdc[2]+'/datapoints/create_all.json',merge_o(auth,{datapoints:JSON.stringify(arg)}),{},cb)
	else if (ugdu && arg) request('PUT',base+'users/'+ugdu[1]+'/goals/'+ugdu[2]+'/datapoints/'+ugdu[3]+'.json',merge_o(auth,arg),{},cb)
	else if (ugdu && !arg) request('DELETE',base+'users/'+ugdu[1]+'/goals/'+ugdu[2]+'/datapoints/'+ugdu[3]+'.json',auth,{},cb)
	else request('GET',base+'users/'+ug[1]+'/goals/'+ug[2]+'.json',auth,{},cb)
	}

R.ping_seq = (function(){
	var epoch = {seed:666, time:1184083200} // the birth of timepie/tagtime!
	var ping_next = function(ping){ // see p37 of Simulation by Ross
		ping.seed = pow(7,5)*ping.seed % (pow(2,31)-1) // ran0 from Numerical Recipes
		ping.time += round(max(1,-45*60*log(ping.seed / (pow(2,31)-1)))) }
	var keep = function(v){return !v.fraction || ζ2_bit_reverse_i(31,v.seed) / (pow(2,31)-1) <= v.fraction}
	var next_s = function(v){var existing = seqs._.map('time'); do {ping_next(v)} while (!keep(v)); while (existing._.contains(v.time)) v.time += 1; return v}
	
	var seqs;
	var period;
	var ensure_before = function(time){if (period !== (period=rc.$.period) || !seqs || time < getv()) {
		var n = 45 / period
		seqs = _.range(ceil(n)).map(function(v){var t = _(epoch).clone(); t.seed += v; return t}).map(next_s)
		if (ceil(n)-n !== 0) seqs[-1].fraction = 1-(ceil(n)-n)
		}}
	var getv = function(){return seqs._.min('time').time}
	var get = function(){return {time:getv(), period:period}}
	var next = function(){next_s(seqs._.min('time'))}

	return {
	le: function(time){ensure_before(time); while (true) {var t = ζ2_jsonclone(seqs); next(); if (getv() > time) {seqs = t; break}}; return get()},
	gt: function(time){le(time); next(); return get()},
	} })()

var PingFile = (function(){
	var dt_fmt = 'YYYY-MM-DD/HH:mm:ssZ' // log format is: 2014-03-26/19:51:56-07:00‹p22.5›? a b c (a: comment)
	var parse = function(v){var t;
		if (v.match(/^....-/)) {
			var t = v.match(/^([^\sp]+)(p\S+)? (.*)$/); var tags = t[3].trim()
			return _({time:moment.utc(t[1],dt_fmt)+0, period:t[2]? parseFloat(t[2]) : 45}).extend(tags === '<unanswered>'? {} : {tags:tags}) }
		else if (t=v.match(/^(\d+)([^\[]+)/)) return {time:ζ2_i(t[1]), period:rc.$.period, tags:t[2].trim()}
		else err('bad log file') }
	var stringify = function(v){return moment(v.time).format(dt_fmt)+(v.period===45?'':'p'+v.period)+' '+(v.tags!==undefined&&v.tags!==null? v.tags : '<unanswered>')}
	return { // be careful about adding more mutators here - it's a bit fragile. (it might screw up prompt.ζ₂)
	'$':function(){return this.lines().map(parse)},
	'=':function(v){fs(this).$ = v.map(stringify).join('\n')+'\n'; return v},
	push:function(v){this.events.emit('push'); this.ensure_eof_nl().append(stringify(v)+'\n'); return this},
	set:function(i,v){var t = this.lines(); this.splice(Buffer.byteLength(t.slice(0,i).join('\n')),Buffer.byteLength(t[i<0?i+t.length:i]+'\n'),stringify(v)+'\n')},
	} })()
var ping_file = R.ping_file = fs(app.getDataPath()).join('pings.log').as_type(PingFile)
ping_file.events = new EventEmitter()

// global.cmp_versions = function(cb){
// 	var version_lt = function(a,b){a=a.split('.').map(i); b=b.split('.').map(i); return a[0]<b[0] || (a[0]===b[0] && (a[1]<b[1] || (a[1]===b[1] && a[2]<b[2])))}
// 	var local = JSON.parse(fs('package.json').$)
// 	child_process.exec("curl -L '"+'https://raw.github.com/'+local.repository.url.match(/^https:\/\/github.com\/([\w-]+\/[\w-]+)\.git$/)[1]+'/master/package.json'+"'",function(e,v){var canon;
// 		if (v!=='' && (canon = JSON.parse(v), version_lt(local.version,canon.version))) cb(null,local.version+' → '+canon.version)
// 		else cb()
// 	}) }

// global.update = function(cb){child_process.exec('bash -c "eval $(curl -fsSL https://raw.github.com/alice0meta/TagTime/master/install.sh)"',cb)}
