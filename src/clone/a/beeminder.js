#!/usr/bin/env node

////////////////////////////////////////////////////
////////////////////////////////////////////////////
/////  THE FOLLOWING IS COPIED FROM ELSEWHERE  ///// only the read_graph part
////////////////////////////////////////////////////
////////////////////////////////////////////////////

// given a tagtime log file and a beeminder graph to update, call beeminder api to update the graph
// also, generate a .bee file from the tagtime log to use as a cache to reduce calls to beeminder api

var fs = require('fs')
var sync = require('sync')
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')

// todo: actually choose the user to get from instead of using the auth user

//! bah load.α
function now(){return Date.now() / 1000}
String.prototype.repeat = function(v){return new Array(v+1).join(this)}
//! bah stopwatch.js
pad = function(v,s,l){while (v.length < l) v = s+v; return v}
pretty_time = function λ(v){
	v = Math.round(v)
	if (v<0) return '-'+λ(-v)
	var d = Math.floor(v/60/60/24), h = Math.floor(v/60/60)%24, m = Math.floor(v/60)%60, s = v%60
	return [d+'d',pad(h+'','0',2)+'h',pad(m+'','0',2)+'m',pad(s+'','0',2)+'s'].slice(d>0?0:h>0?1:m>0?2:3).join('')}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
/////  THE FOLLOWING IS COPIED FROM ELSEWHERE  ///// userscripts/gitminder
//////////////////////////////////////////////////// except i've also modified it somewhat
//////////////////////////////////////////////////// gah
var http = require('http')
var https = require('https')
var print = console.log.bind(console)
Object.mapv = function(v,f){f = f || function(v){return [v,true]}; r = {}; v.forEach(function(v){t = f(v); if (t) r[t[0]] = t[1]}); return r}
var merge_o = function(a,b){var r = {}; Object.keys(a).forEach(function(k){r[k] = a[k]}); Object.keys(b).forEach(function(k){r[k] = b[k]}); return r}
var seq = function(v){return typeof v === 'string'? v.split('') : v instanceof Array? v : Object.keys(v).map(function(k){return [k,v[k]]})}
var pad_left = function(v,s,l){while (v.length < l) v = s + v; return v}
function frequencies(v){var r = {}; v.forEach(function(v){r[v] = v in r? r[v]+1 : 1}); return r}
function dict_by(sq,f){var r = {}; for(var i=0;i<sq.length;i++) r[f(sq[i])] = sq[i]; return r}
Date.prototype.hours = function(v){this.setHours(this.getHours()+v); return this}
Date.prototype.yyyy_mm_dd = function(){var m = (this.getMonth()+1)+''; var d = this.getDate()+''; return this.getFullYear()+'-'+(m[1]?m:'0'+m)+'-'+(d[1]?d:'0'+d)}
function request(path,query,headers,f,base){
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
			f(r,response) }) }).end()}
function beeminder(path,query,f){request(path,merge_o({auth_token:rc.auth.beeminder},query),{},f,'https://www.beeminder.com/api/v1')}
function beeminder_get(goal,f){beeminder('/users/me/goals/'+goal+'/datapoints.json',{},f)}
function beeminder_create(goal,v){beeminder('POST /users/me/goals/'+goal+'/datapoints/create_all.json',{datapoints:JSON.stringify(v instanceof Array? v : [v])},function(v){print('beeminder_create returned:',v)})}
function beeminder_delete(goal,ids){(ids instanceof Array? ids : [ids]).map(function(id){beeminder('DELETE /users/me/goals/'+goal+'/datapoints/'+id+'.json',{},function(v){print('beeminder_delete returned:',v)})})}
function beeminder_update(goal,id,query){beeminder('PUT /users/me/goals/'+goal+'/datapoints/'+id+'.json',query,function(v){print('beeminder_update returned:',v)})}
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////
//////////////////  END COPIED SECTION  /////////////////
/////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////

var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')
var util = require('./util')

module.exports.go = function(log_file,user_slug){
	var ping = 0.75

	var t = user_slug.match(/^(.*)\/(.*)$/); var user = t[1]; var slug = t[2]
	//var cache = user+' '+slug+'.bee'
	var criterion = rc.beeminder[user_slug]

	var start = now(), end = 0 // start and end are the earliest and latest times we will need to care about when updating beeminder.

	// ph (ping hash) maps "y-m-d" to number of pings on that day.
	// sh (string hash) maps "y-m-d" to the beeminder comment string for that day.
	// bh (beeminder hash) maps "y-m-d" to the bmndr ID of the datapoint on that day.
	// ph1 and sh1 are based on the current tagtime log and
	// ph0 and sh0 are based on the cached .bee file or beeminder-fetched data.
	var	ph1 = {}, sh1 = {},
		ph0 = {}, sh0 = {},
		bh = {}

	// .bee code is too messy; not translating

	if (true) {
		;(fs.readFileSync(log_file)+'').split('\n').filter(function(v){return v!==''}).map(function(v){
			var t = v.match(/^(\d+)\s*(.*)$/); var time = t[1]; var stuff = t[2]
			var tags = util.strip(stuff)
			if (tagmatch(tags,criterion)) {
				var t = util.dt(time); var y = t[0]; var m = t[1]; var d = t[2]
				var ymd = y+'-'+m+'-'+d
				ph1[ymd] = (ph1[ymd]||0)+1
				sh1[ymd] = (sh1[ymd]||'')+util.stripb(stuff).trim()+', '
				start = Math.min(time,start)
				end = Math.max(time,end)
			}
		})
		// clean up $sh1: trim trailing commas, pipes, and whitespace
		Object.keys(sh1).map(function(v){sh1[v] = sh1[v].replace(/\s*(\||\,)\s*$/,'')})

		beeminder_get(slug,function(v){
			// todo: "take one pass to delete any duplicates on bmndr; must be one datapt per day" 

			v.map(function(v){
				var t = util.dt(v.timestamp); var y = t[0]; var m = t[1]; var d = t[2]
				var ymd = y+'-'+m+'-'+d
				var t = v.comment.match(/(\d+)\s+pings?:(.*)/); var n = parseInt(t[1]); var sh = t[2].trim()
				ph0[ymd] = n
				sh0[ymd] = sh
				bh[ymd] = v.id
			})

			for (var day=day_snap(start)-86400;day <= day_snap(end)+86400; day += 86400) {
				var t = util.dt(day); var y = t[0]; var m = t[1]; var d = t[2]
				var ymd = y+'-'+m+'-'+d
				var b = bh[ymd] || ''
				var p0 = ph0[ymd] || 0
				var p1 = ph1[ymd] || 0
				var s0 = sh0[ymd] || ''
				var s1 = sh1[ymd] || ''
				if (p0===p1 && s0===s1) {} // no change to the datapoint on this day
				else if (b==='' && p1 > 0) { // no such datapoint on beeminder: CREATE
					print('creating datapoint',p1*ping,'"'+p1+' pings: '+s1+'"')
					beeminder_create(slug,{id:b,timestamp:day,value:p1*ping,comment:util.splur(p1,'ping')+': '+s1})
				} else if (p0 > 0 && p1 <= 0) { // on beeminder but not in tagtime log: DELETE
					print('deleting datapoint',p0*ping,'"'+p0+' pings: '+s0+' [bID:'+b+']"')
					beeminder_delete(slug,b)
				} else if (p0 !== p1 || s0 !== s1) { // bmndr & tagtime log differ: UPDATE
					print('updating datapoint (old/new):')
					print(ymd+'  ',p0*ping,'"'+p0+' pings: '+s0+' [bID:'+b+']"')
					print(ymd+'  ',p1*ping,'"'+p1+' pings: '+s1+'"')
					beeminder_update(slug,b,{timestamp:day,value:p1*ping,comment:util.splur(p1,'ping')+': '+s1})
				} else {
					print("ERROR: can't tell what to do with this datapoint (old/new):")
					print(ymd+'  ',p0*ping,'"'+p0+' pings: '+s0+' [bID:'+b+']"')
					print(ymd+'  ',p1*ping,'"'+p1+' pings: '+s1+'"')
				}
			}
			setTimeout(function(){process.exit()},5000) // this line is horrifying
		})
	}
	return '-'}

// Whether the given string of space-separated tags matches the given criterion.
function tagmatch(tags,criterion){
	/*sub tagmatch { my($tags, $crit) = @_;
	  my $r = ref($crit);
	  if   ($r eq "")       { return $tags =~ /\b$crit\b/;                         }
	  elsif($r eq "ARRAY")  { for my $c (@$crit) { return 1 if $tags =~ /\b$c\b/; }}
	  elsif($r eq "CODE")   { return &$crit($tags);                                }
	  elsif($r eq "Regexp") { return $tags =~ $crit;                               }
	  else { die "Criterion $crit is neither string, array, regex, nor lambda!"; }
	  return 0;
	}*/
	return tags.split(' ').filter(function(v){return v===criterion}).length>0}

function day_snap(v){var r = new Date(v*1000); r.setHours(12); return r/1000}

/*
my $nquo = 0;  # number of datapoints on beeminder with no changes (status quo)
my $ndel = 0;  # number of deleted datapoints on beeminder
my $nadd = 0;  # number of created datapoints on beeminder
my $nchg = 0;  # number of updated datapoints on beeminder
my $minus = 0; # total number of pings decreased from what's on beeminder
my $plus = 0;  # total number of pings increased from what's on beeminder
for(my $t = daysnap($start)-86400; $t <= daysnap($end)+86400; $t += 86400) {
  my($y,$m,$d) = dt($t);
  my $ts = "$y-$m-$d";
  my $b =  $bh{$ts} || "";
  my $p0 = $ph0{$ts} || 0;
  my $p1 = $ph1{$ts} || 0;
  my $s0 = $sh0{$ts} || "";
  my $s1 = $sh1{$ts} || "";
  if($p0 eq $p1 && $s0 eq $s1) { # no change to the datapoint on this day
    $nquo++ if $b;
    next;
  } 
  if($b eq "" && $p1 > 0) { # no such datapoint on beeminder: CREATE
    $nadd++;
    $plus += $p1;
    $bh{$ts} = beemcreate($usr,$slug,$t, $p1*$ping, splur($p1,"ping").": ".$s1);
    #print "Created: $y $m $d  ",$p1*$ping," \"$p1 pings: $s1\"\n";
  } elsif($p0 > 0 && $p1 <= 0) { # on beeminder but not in tagtime log: DELETE
    $ndel++;
    $minus += $p0;
    beemdelete($usr, $slug, $b);
    #print "Deleted: $y $m $d  ",$p0*$ping," \"$p0 pings: $s0 [bID:$b]\"\n";
  } elsif($p0 != $p1 || $s0 ne $s1) { # bmndr & tagtime log differ: UPDATE
    $nchg++;
    if   ($p1 > $p0) { $plus  += ($p1-$p0); } 
    elsif($p1 < $p0) { $minus += ($p0-$p1); }
    beemupdate($usr, $slug, $b, $t, ($p1*$ping), splur($p1,"ping").": ".$s1);
    # If this fails, it may well be because the point being updated was deleted/
    # replaced on another machine (possibly as the result of a merge) and is no
    # longer on the server. In which case we should probably fail gracefully
    # rather than failing with an ERROR (see beemupdate()) and not fixing
    # the problem, which requires manual cache-deleting intervention.
    # Restarting the script after deleting the offending cache is one option,
    # though simply deleting the cache file and waiting for next time is less
    # Intrusive. Deleting the cache files when merging two TT logs would reduce
    # the scope for this somewhat.
    #print "Updated:\n";
    #print "$y $m $d  ",$p0*$ping," \"$p0 pings: $s0 [bID:$b]\" to:\n";
    #print "$y $m $d  ",$p1*$ping," \"$p1 pings: $s1\"\n";
  } else {
    print "ERROR: can't tell what to do with this datapoint (old/new):\n";
    print "$y $m $d  ",$p0*$ping," \"$p0 pings: $s0 [bID:$b]\"\n";
    print "$y $m $d  ",$p1*$ping," \"$p1 pings: $s1\"\n";
  }
}

open(F, ">$beef") or die;  # generate the new cache file
for my $ts (sort(keys(%ph1))) {
  my($y,$m,$d) = split(/\-/, $ts);
  my $p = $ph1{$ts};
  my $v = $p*$ping;
  my $c = $sh1{$ts};
  my $b = $bh{$ts};
  print F "$y $m $d  $v \"",splur($p,"ping"),": $c [bID:$b]\"\n";
}
close(F);

my $nd = scalar(keys(%ph1)); # number of datapoints
if($nd != $nquo+$nchg+$nadd) { # sanity check
  print "\nERROR: total != nquo+nchg+nadd ($nd != $nquo+$nchg+$nadd)\n";
}
print "Datapts: $nd (~$nquo *$nchg +$nadd -$ndel), ",
      "Pings: $np (+$plus -$minus) ";
my $r = ref($crit);
if   ($r eq "")       { print "w/ tag $crit";                        }
elsif($r eq "ARRAY")  { print "w/ tags in {", join(",",@$crit), "}"; }
elsif($r eq "Regexp") { print "matching $crit";                      }
elsif($r eq "CODE")   { print "satisfying lambda";                   }
else                  { print "(unknown-criterion: $crit)";          }
print "\n";





# Convert a timestamp to noon on the same day. 
# This matters because if you start with some timestamp and try to step 
# forward 24 hours at a time then daylight savings time can screw you up.
# You might add 24 hours and still be on the same day. If you start from 
# noon that you shouldn't have that problem.
sub daysnap { my($t) = @_;
  my($sec,$min,$hr, $d,$m,$y) = localtime($t);
  return timelocal(0,0,12, $d,$m,$y);
}

# $string = do {local (@ARGV,$/) = $file; <>}; # slurp file into string
























use LWP::UserAgent;  # tip: run 'sudo cpan' and at the cpan prompt do 'upgrade'
use JSON;            # then 'install LWP::UserAgent' and 'install JSON' etc
use HTTP::Request::Common;  # pjf recomends cpanmin.us
use Data::Dumper; $Data::Dumper::Terse = 1;
$beembase = 'https://www.beeminder.com/api/v1/';

# Delete datapoint with given id for beeminder.com/u/g
sub beemdelete { my($u, $g, $id) = @_;
  my $ua = LWP::UserAgent->new;
  my $uri = $beembase . 
            "users/$u/goals/$g/datapoints/$id.json?auth_token=$beemauth";
  my $resp = $ua->delete($uri);
  beemerr('DELETE', $uri, {}, $resp);
}

# Fetch all the datapoints for beeminder.com/u/g
sub beemfetch { my($u, $g) = @_;
  my $ua = LWP::UserAgent->new;
  #$ua->timeout(30); # give up if no response for this many seconds; default 180
  my $uri = $beembase .
            "users/$u/goals/$g/datapoints.json?auth_token=$beemauth";
  my $resp = $ua->get($uri);
  beemerr('GET', $uri, {}, $resp);
  return decode_json($resp->content);
}

# Create a new datapoint {timestamp t, value v, comment c} for bmndr.com/u/g
# and return the id of the new datapoint.
sub beemcreate { my($u, $g, $t, $v, $c) = @_;
  my $ua = LWP::UserAgent->new;
  my $uri = $beembase."users/$u/goals/$g/datapoints.json?auth_token=$beemauth";
  my $data = { timestamp => $t,
               value     => $v,
               comment   => $c };
  my $resp = $ua->post($uri, Content => $data);
  beemerr('POST', $uri, $data, $resp);
  my $x = decode_json($resp->content);
  return $x->{"id"};
}

# Update a datapoint with the given id. Similar to beemcreate/beemdelete.
sub beemupdate { my($u, $g, $id, $t, $v, $c) = @_;
  my $ua = LWP::UserAgent->new;
  my $uri = $beembase . 
            "users/$u/goals/$g/datapoints/$id.json?auth_token=$beemauth";
  my $data = { timestamp => $t,
               value     => $v,
               comment   => $c };
  # you'd think the following would work:
  # my $resp = $ua->put($uri, Content => $data);
  # but it doesn't so we use the following workaround, courtesy of
  # http://stackoverflow.com/questions/11202123/how-can-i-make-a-http-put
  my $req = POST($uri, Content => $data);
  $req->method('PUT');
  my $resp = $ua->request($req);
  beemerr('PUT', $uri, $data, $resp);
}

# Takes request type (GET, POST, etc), uri string, hashref of data arguments, 
# and response object; barfs verbosely if problems. 
# Obviously this isn't the best way to do this.
sub beemerr { my($rt, $uri, $data, $resp) = @_; 
  if(!$resp->is_success) {
    print "Error making the following $rt request to Beeminder:\n$uri\n";
    print Dumper $data;
    print $resp->status_line, "\n", $resp->content, "\n";
    exit 1;
  }
}
*/