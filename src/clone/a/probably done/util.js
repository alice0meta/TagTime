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

//module.exports.next_ping = function(prev){return prev+10} //!
module.exports.ss = pretty_time

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