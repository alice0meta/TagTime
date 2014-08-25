var G = global
var G_keys = Object.keys(G)

//===-------------------------===// requires //===-------------------------===//

G.util = require('util')
G.exec = require('child_process').exec

G.async = require('async')
G.lock = new (require('rwlock'))()
G.minimist = require('minimist')
G.$ = require('jquery')

var PQueue = require('priorityqueuejs')

//===----------------------------===// ζ₀ //===----------------------------===//

G.fs = require('fs')
G.path = require('path')
G.moment = require('moment')
G._ = require('underscore')
var mkdirp = require('mkdirp')
String.prototype.repeat = function(v){return new Array(v+1).join(this)}
G.pad = function(v,s){return v+s.slice(v.length)}
G.argv = {_:process.argv.slice(4)}
G.ζ0_def = function(o,m,get,set){Object.defineProperty(o,m,{configurable:true, enumerable:false, get:get, set:set}); return o}
Function.prototype.def = function(m,get,set){Object.defineProperty(this.prototype,m,{configurable:true, enumerable:false, get:get, set:set}); return this}
;[Array,String].forEach(function(Class){_.range(0,5).forEach(function(i){Class.def('-'+i,function(){return this.length<i? undefined : this[this.length-i]},function(v){return this.length<i? v : this[this.length-i] = v})})})
var Path = function Path(path){this._path = path.replace(/^~\//,process.env.HOME+'/')}
	.def('$',function(){return new PathValue(this._path)},
		function(v){
			mkdirp.sync(path.dirname(this._path))
			if (v instanceof PathValue) fs.createReadStream(v._path).pipe(fs.createWriteStream(this._path))
			else fs.writeFileSync(this._path,v,{mode:493})
			})
	.def('path',function(){return this._path.slice(0,(process.env.HOME+'/').length)===process.env.HOME+'/'? '~'+this._path.slice(process.env.HOME.length) : this._path})
var t = function(path){return new Path(path)}; t.__proto__ = fs; G.fs = t
function PathValue(path){this._path = path}
Path.prototype.realpath = function(){return fs.realpathSync(this._path)}
Path.prototype.exists = function(){return fs.existsSync(this._path)}
Path.prototype.append = function(v){fs.appendFileSync(this._path,v)}
PathValue.prototype.toString = function(){return fs.readFileSync(this._path)+''}
PathValue.prototype.split = function(v){return (this+'').split(v)}
PathValue.prototype.ζ0_SUB_BYs = function(b){return this.split(b)}
G.ζ0_SUB_Fs = function(s,f){return s.split(f).slice(1).join(f)}
G.ζ0_SUB_Ts = function(s,t){return s.split(t)[0]}
G.ζ0_memb_Emod_obj = function(o,m,f){o[m] = f(o[m]); return o}
Array.prototype.ζ0_concat = function(){return Array.prototype.concat.apply([],this)}
G.ζ0_int = function(v){return parseInt(v)}

//===---------===// other copypasted (lang-alpha, stopwatch) //===---------===//

G.merge_o = function(a,b){var r = {}; Object.keys(a).forEach(function(k){r[k] = a[k]}); Object.keys(b).forEach(function(k){r[k] = b[k]}); return r}
G.seq = function(v){return typeof v === 'string'? v.split('') : v instanceof Array? v : Object.keys(v).map(function(k){return [k,v[k]]})}
G.frequencies = function(v){return v.reduce(function(r,v){r[v] = v in r? r[v]+1 : 1; return r},{})}
G.now = function(){return Date.now() / 1000}
G.format_dur = function λ(v){
	v = Math.round(v)
	if (v<0) return '-'+λ(-v)
	var d = Math.floor(v/60/60/24), h = Math.floor(v/60/60)%24, m = Math.floor(v/60)%60, s = v%60
	return [d+'d',h+'h',m+'m',s+'s'].slice(d>0?0:h>0?1:m>0?2:3).join('')}

//===---------------------------===// util //===---------------------------===//

G.lazy = function(o,m,f){ζ0_def(o,m,function(){delete(o[m]); return o[m] = f()},function(v){delete(o[m]); return o[m] = v})}
G.poll = function(f,cb){var t; (t=f())? cb.in(0,null,t) : poll.in(0.02,f,cb)}

G.i = function(v){return parseInt(v)}
G.is = function(v){return v!==undefined}
G.err = function(v){print.apply(null,['#err#'].concat(A(arguments))); throw Error(v)}
G.pluralize = function(n,noun){return n+' '+noun+(n==1?'':'s')}
G.bit_reverse_i = function(length,v){var r = 0; for (var i=0;i<length;i++){r = (r << 1) | (v & 1); v = v >> 1}; return r}
Object.getOwnPropertyNames(Math).forEach(function(v){G[v] = Math[v]})
_.jclone = function(v){return v===undefined? v : JSON.parse(JSON.stringify(v))}
var sprint = function(v,opt){return v.map(function(v){return typeof(v)==='string'? v : util.inspect(v,opt)}).join(' ')}
G.A = function(v){return Array.prototype.slice.call(v)}
G.print = function(){var a = A(arguments); process.stdout.write(sprint(a,{colors:true,depth:2})+'\n'); return a[-1]}
G.$.prototype.on_key = function(key,sel,cb0){if (!cb0) {cb0 = sel; sel = null}
	var t = key.split(/(?=\.\w)/); key = t[0]; var ns = t.slice(1).join('')
	var t = {'⇥':[9,'↓'],'↩':[13],'⎋':[27,'↑'],'←':[37,'↓'],'↑':[38,'↓'],'→':[39,'↓'],'↓':[40,'↓']}
	var keyc = t[key]? t[key][0] : (typeof(key)==='number'? key : key.charCodeAt(0))
	this.on(((t[key]?{'↑':'keyup','↓':'keydown'}[t[key][1]]:0)||'keypress')+ns,sel,function(e){if (e.which===keyc) return cb0(e)}) }
G.$.prototype.find_self = function(sel){return this.find(sel).add(this.filter(sel))}

var tm = moment; G.moment = function(i){return typeof(i)==='number' && arguments.length===1? tm(i*1000) : tm.apply(this,arguments)}; moment.__proto__ = tm
G.moment.fn.valueOf = function(){return +this._d/1000 + (this._offset||0)*60}
G.moment.fn.toString = function(){return this.utc().format('YYYY-MM-DD[T]HH:mm:ss[Z]')}
G.moment.fn.inspect = function(){return '\x1b[35m'+this.toString()+'\x1b[39m'}

//===------------------------===// .prototype. //===-----------------------===//

var set_prototypes; ;(set_prototypes = function(G){

G.Function.prototype.def = function(m,get,set){Object.defineProperty(this.prototype,m,{configurable:true, enumerable:false, get:get, set:set}); return this}
;[G.Array,G.String].forEach(function(Class){_.range(0,5).forEach(function(i){Class.def('-'+i,function(){return this.length<i? undefined : this[this.length-i]},function(v){return this.length<i? v : this[this.length-i] = v})})})
G.Array.prototype.find = function(f,ctx){return _.find(this,f,ctx)}
G.String.prototype.repeat = function(v){return new G.Array(v+1).join(this)}
G.Array.prototype.ζ0_concat = function(){return G.Array.prototype.concat.apply([],this)}
G.Array.prototype.zipmap = function(f,ctx){return _.zip.apply(_,this).map(function(v){return f.apply(ctx,v)})}
G.Array.def('_',function(){return _(this)})

G.Function.prototype.every = function(time){var args = G.Array.prototype.slice.call(arguments).slice(1); return setInterval.apply(null,[this,time*1000].concat(args))}
G.Function.prototype.in = function(time){var f = this; var args = G.Array.prototype.slice.call(arguments).slice(1); return !time || time <= 0? setImmediate.apply(null,[f].concat(args)) : setTimeout.apply(null,[f,time*1000].concat(args))}
var poll_fns = new PQueue(function(a,b){return b.time-a.time})
;(function(){while (poll_fns.size() > 0 && poll_fns.peek().time < now()) poll_fns.deq().f()}).every(0.1)
G.Function.prototype.at = function(time){var θ=this; var args = G.Array.prototype.slice.call(arguments).slice(1); var t = {time:time,f:args.length===0? θ : function(){θ.apply(null,args)}}; if (time < now()) t.f.in(); else poll_fns.enq(t)}

})(G)

//===---------------------------===// <end> //===--------------------------===//

var fns = _.keys(G)._.difference(G_keys)
module.exports = function(window){if (window) {fns.forEach(function(v){window[v] = G[v]}); set_prototypes(window)}}