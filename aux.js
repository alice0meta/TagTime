








G.clog = function(){return print.apply(null,[moment()].concat(A(arguments)))}

G.tags_split = function(v){return v.trim().split(/ +/)}
G.tags_join = function(v){return v.join(' ').trim()}
G.tags_norm = function(v){return tags_join(tags_split(v))}
G.tags_union = function(){return tags_join(_.union.apply(_,A(arguments).map(tags_split)))}

lazy(global,'rc',function(){
	var f_settings = '~/TagTime/settings.json'
	if (!fs(f_settings).exists()) {
		fs(f_settings).$ = (fs('settings.js').$+'').replace(/‹([^›]+)›/g,function(_,v){var t; return is(t=eval(v))?t:''})
		print("hey, I've put a settings file at",f_settings,'for you. Go fill it in!')
		//! gui.Shell.openItem(fs(f_settings).realpath())
		exec("open -a TextEdit '"+fs(f_settings).realpath()+"'") }
	try {var r = JSON.parse((fs(f_settings).$+'').replace(/\/\/.*/g,''))}
	catch (e) {print('ERROR: bad rc file -',e); return undefined}
	_.defaults(r,{ping_sound:'loud-ding.wav'})
	if (!fs(r.ping_file).exists()) fs(r.ping_file).$ = ''
	return r})

// less hacky hacky partial beeminder api
var beeminder = (function(){
	var http = require('http')
	var https = require('https')
	var request = function(method,path,query,headers,cb){
		var t = path.match(/^(https?):\/\/(.*)$/); var http_ = t[1] === 'http'? http : https; path = t[2]
		var t = path.match(/^(.*?)(\/.*)$/); var host = t[1]; path = t[2]
		query = seq(query).map(function(v){return encodeURIComponent(v[0])+'='+encodeURIComponent(v[1])}).join('&')
		path = path+(query===''?'':'?'+query)
		clog('REQUEST',method,host+path)
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
		if (v.match(/^....-/)) {var t = v.match(/^([^\sp]+)(p\S+)? (.*)$/); return {time:moment.utc(t[1],dt_fmt)+0, period:t[2]? parseFloat(t[2]) : 45, tags:t[3].trim()}}
		else {var t = v.match(/^(\d+)([^\[]+)/); if (!t) err('bad log file'); return {time:i(t[1]), period:rc.period, tags:t[2].trim()}}
		}
	var stringify = function(v){return moment(v.time).format(dt_fmt)+(v.period===45?'':'p'+v.period)+' '+v.tags}
	var read_nonblank_lines = function(fl){return fs(fl).$.split('\n').filter(function(v){return v!==''})}
	var r = function(fl){this.fl = fl}
		.def('$',function(){return read_nonblank_lines(this.fl).map(parse)},
			function(v){fs(this.fl).$ = v.map(stringify).join('\n')+'\n'; return this})
	r.prototype.append = function(v){fs(this.fl).append(stringify(v)+'\n'); return this}
	return function(fl){return new r(fl)}})()

var ping_seq = (function(period){
	var epoch = {seed:666, time:1184083200} // the birth of timepie/tagtime!
	var ping_next = function(ping){ // see p37 of Simulation by Ross
		ping.seed = pow(7,5)*ping.seed % (pow(2,31)-1) // ran0 from Numerical Recipes
		ping.time += round(max(1,-45*60*log(ping.seed / (pow(2,31)-1)))) }
	var keep = function(v){return !v.fraction || bit_reverse_i(31,v.seed) / (pow(2,31)-1) <= v.fraction}
	var next_s = function(v){var existing = _.pluck(seqs,'time'); do {ping_next(v)} while (!keep(v)); while (_.contains(existing,v.time)) v.time += 1; return v}
	
	var seqs
	var reset_before = function(time){if (!seqs || time < getv()) {
		var n = 45 / period
		seqs = _.range(ceil(n)).map(function(v){var t = _.clone(epoch); t.seed += v; return t}).map(next_s)
		if (ceil(n)-n !== 0) seqs[-1].fraction = 1-(ceil(n)-n)
		}}
	var getv = function(){var r = _.min(seqs,function(v){return v.time}).time; return r}
	var get = function(){return {time:getv(), period:period}}
	var next = function(){next_s(_.min(seqs,function(v){return v.time}))}
	
	reset_before(now())
	return ζ0_def({
		le: function(time){reset_before(time); while (true) {var t = _.jclone(seqs); next(); if (getv() > time) {seqs = t; break}}; return get()},
		next: function(){next(); return get()},
		}, '0', function(){return get()}
	) })(rc.period)

var cmp_versions = function(cb){
	var version_lt = function(a,b){a=a.split('.').map(i); b=b.split('.').map(i); return a[0]<b[0] || (a[0]===b[0] && (a[1]<b[1] || (a[1]===b[1] && a[2]<b[2])))}
	var local = JSON.parse(fs('package.json').$)
	exec("curl '"+'https://raw.githubusercontent.com/'+local.repository.url.match(/^https:\/\/github.com\/([\w-]+\/[\w-]+)\.git$/)[1]+'/master/package.json'+"'",function(e,v){var canon;
		if (v!=='' && (canon = JSON.parse(v), version_lt(local.version,canon.version))) cb(null,local.version+' → '+canon.version)
		else cb()
	}) }