#!/usr/bin/env node

var fs = require('fs')
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')

//! bah load.α
function now(){return Date.now() / 1000}
var print = console.log.bind(console)
String.prototype.repeat = function(v){return new Array(v+1).join(this)}
//! bah stopwatch.js
pad = function(v,s,l){while (v.length < l) v = s+v; return v}
pretty_time = function λ(v){
	v = Math.round(v)
	if (v<0) return '-'+λ(-v)
	var d = Math.floor(v/60/60/24), h = Math.floor(v/60/60)%24, m = Math.floor(v/60)%60, s = v%60
	return [d+'d',pad(h+'','0',2)+'h',pad(m+'','0',2)+'m',pad(s+'','0',2)+'s'].slice(d>0?0:h>0?1:m>0?2:3).join('')}
//! bad
function logf(){return rc.user+'.log'}

var gap = 45*60

var IA = 16807      // 7^5: constant used for RNG (see p37 of Simulation by Ross)
var IM = 2147483647 // 2^31-1: constant used for RNG
var init_seed = 666
var seed = init_seed // a global variable that is really the state of the RNG.

// Returns a random integer in [1,$IM-1]; changes $seed, ie, RNG state.
// (This is ran0 from Numerical Recipes and has a period of ~2 billion.)
function ran0(){return (seed = IA*seed % IM)}

function ran01(){return ran0()/IM}
function exprand(){return -(gap*Math.log(ran01()))}

function clip(x,a,b){return Math.max(a,Math.min(b,x))}

function dd(v){return pad(v+'','0',2)}
// Date/time: Takes unixtime in seconds and returns list of [year, mon, day, hr, min, sec, day-of-week, day-of-year, is-daylight-time]
function dt(v){v = v || now()
	Date.prototype.stdTimezoneOffset = function() {
    var jan = new Date(this.getFullYear(), 0, 1);
    var jul = new Date(this.getFullYear(), 6, 1);
    return Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());}
	Date.prototype.dst = function() {return this.getTimezoneOffset() < this.stdTimezoneOffset()}
	var getDOY = function(v) {var onejan = new Date(v.getFullYear(),0,1); return Math.ceil((v - onejan) / 86400000)}
	v = new Date(v*1000)
	return [v.getFullYear(),dd(v.getMonth()+1),dd(v.getDate()),dd(v.getHours()),dd(v.getMinutes()),dd(v.getSeconds()),'SUN MON TUE WED THU FRI SAT'.split(' ')[v.getDay()],getDOY(v),v.dst()]}
module.exports.dt = dt

module.exports.prev_ping = function(time){
	seed = init_seed
	// Starting at the beginning of time, walk forward computing next pings until the next ping is >= t.
	var nxtping = 1184083200 // the birth of timepie/tagtime!
	var lstping = nxtping
	var lstseed = seed
	while (nxtping < time) {
		lstping = nxtping
		lstseed = seed
		nxtping = module.exports.next_ping(nxtping)
	}
	seed = lstseed
	return lstping}
// Takes previous ping time, returns random next ping time (unixtime).
// NB: this has the side effect of changing the RNG state ($seed) and so should only be called once per next ping to calculate, after calling prevping.
module.exports.next_ping = function(prev){return Math.max(prev+1,Math.round(prev+exprand()))}
//module.exports.next_ping = function(prev){return prev+10} //!
module.exports.ss = pretty_time
module.exports.annotate_timestamp = function(a,t,ll){ll = ll || 79
	var _ = dt(t); var yea=_[0],o=_[1],d=_[2],h=_[3],m=_[4],s=_[5],wd=_[6]
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
		].map(function(v){if ((a+' '+v).length <= ll) return lrjust(a,v,ll)}).filter(function(v){return v})[0] || a}
function lrjust(a,b,x){return a+' '+' '.repeat(Math.max(0,x-(a+' '+b).length))+b}

module.exports.strip = function(v){ // Strips out stuff in parens and brackets; remaining parens/brackets means they were unmatched.
	v = v.replace(/\([^\(\)]*\)/g,'')
	v = v.replace(/\[[^\[\]]*\]/g,'')
	return v}
module.exports.stripb = function(v){ // Strips out stuff in brackets only; remaining brackets means they were unmatched.
	v = v.replace(/\[[^\[\]]*\]/g,'')
	return v}
module.exports.stripc = function(v){ // Strips out stuff *not* in parens and brackets.
	//my($s) = @_;
	//my $tmp = $s;
	//my @a = split('UNIQUE78DIV', $tmp);
	//for(@a) {
	//  my $i = index($s, $_);
	//  substr($s, $i, length($_)) = "";
	//}
	//return $s;
	return (v.match(/[\[(][^\[\]]*[\])]/g)||[]).join('')}
module.exports.splur = function(n,noun){ // Singular or Plural:  Pluralize the given noun properly, if n is not 1. Eg: splur(3, "boy") -> "3 boys"
	return n+' '+noun+(n==1?'':'s')}
module.exports.divider = function(label){ // Takes a string "foo" and returns "-----foo-----" of length 79
	var left = Math.floor((79 - label.length)/2), right = 79 - left - label.length
	return '-'.repeat(left)+label+'-'.repeat(right)}
module.exports.slog = function(v){fs.appendFileSync(logf(),v)}

/*

# DATE/TIME FUNCTIONS FOLLOW

# Time string: takes unixtime and returns a formated YMD HMS string.
sub ts { my($t) = @_;
  my($year,$mon,$mday,$hour,$min,$sec,$wday,$yday,$isdst) = dt($t);
  return "$year-$mon-$mday $hour:$min:$sec $wday";
}

# Human-Compressed Time String: like 0711281947 for 2007-11-28 19:47
sub hcts { my($t) = @_;
  if($t % 60 >= 30) { $t += 60; } # round to the nearest minute.
  my($year,$mon,$mday,$hour,$min,$sec,$wday,$yday,$isdst) = dt($t);
  return substr($year,-2)."${mon}${mday}${hour}${min}";
}

# just like above but with the biggest possible unit being hours instead of days
sub ss2 { my($s) = @_;
  my($d,$h,$m);
  my $incl = "s";

  if($s < 0) { return "-".ss2(-$s); }

  $m = int($s/60);
  if($m > 0) { $incl = "ms"; }
  $s %= 60;
  $h = int($m/60);
  if($h > 0) { $incl = "hms"; }
  $m %= 60;

  return ($incl=~"h" ? $h."h" : "").
         ($incl=~"m" ? dd($m).":" : "").
         ($incl!~"m" ? $s : dd($s))."s";
}
       

# Parse ss: takes a string like the one returned from ss() and parses it,
# returning a number of seconds.
sub pss { my($s) = @_;
  $s =~ /^\s*(\-?)(\d*?)d?(\d*?)h?(\d*?)(?:\:|m)?(\d*?)s?\s*$/;
  return ($1 eq '-' ? -1 : 1) * ($2*24*3600+$3*3600+$4*60+$5);
}

# Parse Date: must be in year, month, day, hour, min, sec order, returns
#   unixtime.
sub pd { my($s) = @_;
  my($year, $month, $day, $hour, $minute, $second);

  if($s =~ m{^\s*(\d{1,4})\W*0*(\d{1,2})\W*0*(\d{1,2})\W*0*
                 (\d{0,2})\W*0*(\d{0,2})\W*0*(\d{0,2})\s*.*$}x) {
    $year = $1;  $month = $2;   $day = $3;
    $hour = $4;  $minute = $5;  $second = $6;
    $hour |= 0;  $minute |= 0;  $second |= 0;  # defaults.
    $year = ($year<100 ? ($year<70 ? 2000+$year : 1900+$year) : $year);
  }
  else {
    ($year,$month,$day,$hour,$minute,$second) =
      (1969,12,31,23,59,59); # indicates couldn't parse it.
  }

  return timelocal($second,$minute,$hour,$day,$month-1,$year);
}

*/