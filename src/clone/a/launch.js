#!/usr/bin/env node

var fs = require('fs')
var rc = eval(fs.readFileSync(process.env.HOME+'/.tagtime_rc')+'')
var util = require('./util')
var ping = require('./ping')

//! bah load.α
function now(){return Date.now() / 1000}
var print = console.log.bind(console)
String.prototype.repeat = function(v){return new Array(v+1).join(this)}
//! bah stopwatch.js
pad = function(v,s,l){while (v.length < l) v = s+v; return v}
//! bad
function logf(){return rc.user+'.log'}

// Check if it's time (or past time) to ping. If so, catch up on missed pings and/or launch ping.pl for the current ping. This should be called by the daemon (tagtimed.pl) every time a ping is due.
module.exports.go = function(){
	var launch_time = now()

	var ping_next
	if (fs.existsSync(logf())) {
		var last_log_line = (fs.readFileSync(logf())+'').split('\n').filter(function(v){return v!==''}).slice(-1)[0]
		var lstping = last_log_line===undefined? util.prev_ping(launch_time) : parseInt(last_log_line.match(/^\s*(\d+)/)[1])
		var t = util.next_ping(util.prev_ping(lstping))
		if (lstping === t) {
			ping_next = util.next_ping(lstping)
		} else {
			print('TagTime log file ('+logf()+') has bad last line:\n'+last_log_line)
			ping_next = util.prev_ping(launch_time)
		}
	} else {
		ping_next = util.prev_ping(launch_time)
	}

	var editor_flag = false
	// First, if we missed any pings by more than $retrothresh seconds for no apparent reason, then assume the computer was off and auto-log them.
	while (ping_next < launch_time - rc.retro_threshold) {
		util.slog(util.annotate_timestamp(ping_next+' afk off RETRO',ping_next)+'\n')
		ping_next = util.next_ping(ping_next)
		editor_flag = true
	}

	// Next, ping for any pings in the last retrothresh seconds.
	//do {
		if (ping_next <= now()) {
			if (ping_next < now()-rc.retro_threshold) {
				util.slog(util.annotate_timestamp(ping_next+' afk RETRO',ping_next)+'\n')
				editor_flag = true
			} else {
				// this shouldn't complete till you answer. but it will anyway. oh well.
				ping.go(ping_next,function(){
					print('done!')
				})
			}

			//print('what.')
			//ping_next += 100
			//var t = lastln(); var ts = t[0]; var ln = t[1]
			/*
		    my($ts,$ln) = lastln();
		    if($ts != $nxtping) { # in case, eg, we closed the window w/o answering.
		      # suppose there's a ping window waiting (call it ping 1), and while it's 
		      # sitting there unanswered another ping (ping 2) pings.  then you kill 
		      # the ping 1 window.  the editor will then pop up for you to fix the err 
		      # ping but there will be nothing in the log yet for ping 2.  perhaps 
		      # that's ok, just thinking out loud here...
		      slog(annotime(
		             "$nxtping err [missed ping from ".ss(time()-$nxtping)." ago]",
		             $nxtping)."\n");
		      editor($logf,"TagTime Log Editor (unanswered pings logged as \"err\")");
		      $editorFlag = 0;
		    } elsif(trim(strip($ln)) eq "") {  # no tags in last line of log.
		      #editor($logf, "TagTime Log Editor (add tags for last ping)");
		      #$editorFlag = 0;
		      $editorFlag = 1;
		    }

		    $lstping = $nxtping; $nxtping = nextping($nxtping);
		    # Here's where we would add an artificial gap of $nxtping-$lstping.
		  }
		  if($editorFlag) {
		    editor($logf, "TagTime Log Editor (fill in your RETRO pings)");
		    $editorFlag = 0;
		    # when editor finishes there may be new pings missed!
		    # that's why we have the outer do-while loop here, to start over if
		    #   there are new pings in the past after we finish editing.
		  }
		} while($nxtping <= time());
		*/
		}
	//} while (ping_next <= now())
}

/*
# Returns the last line in the log but as a 2-element array
#   consisting of timestamp and rest of the line.
sub lastln { 
  my $x;
  open(L, $logf) or die "ERROR-lastln: Can't open log: $!";
  $x = $_ while(<L>);
  close(L);
  $x =~ /^\s*(\d+)\s*(.*)$/;
  return ($1,$2);
}

# Launch an editor to edit file f, labeling the window with title t.
sub editor {
  my($f, $t) = @_;
  $ENV{DISPLAY} ||= ":0.0";  # have to set this explicitly if invoked by cron.
  if(!defined($EDIT_COMMAND)) {
    $cmd = "$XT -T '$t' -fg white -bg red -cr MidnightBlue -bc -rw -e $ED $f";
    system($cmd) == 0 or print "SYSERR: $cmd\n";
    #system("${path}term.sh $ED $f");
  } else {
    $cmd = "$EDIT_COMMAND $f";
    system($cmd) == 0 or print "SYSERR: $cmd\n";
  }
}
*/