#!/usr/bin/env node

require('./ζtt.js')
require('./aux.js')

// the log file → [{time: period: tags:}]
var logfile_pings = function(){return ping_file(rc.ping_file).$}
// beeminder api datapoints → [{time: period: tags: id: group:}]
var beeminder_pings = function(datapoints){return datapoints.filter(function(v){return v.value!==0 && v.comment.match(/pings?:/)}).map(function(v){
	var pings = v.comment.match(/pings?:(.*)/)[1].trim().replace(/ \[..:..:..\]$/,'').split(', ')
	var r = pings.map(function(t){return {time:v.timestamp, period:v.value*60/pings.length, tags:t, id:v.id}})
	r.map(function(v){v.group = r})
	return r})._.flatten(true)._.sortBy('time') }

var tagdsl_eval = function(f,tags){var t
	tags = tags.replace(/\(.*?\)/g,' ').trim().split(/ +/)
	var check = function(v){return _.contains(tags,v)}
	return f instanceof Array? f.every(check) : f.slice(0,2)==='! '? !check(f.slice(2)) : f.split(' ').some(check) }

var generate_actions = function(user_slug,f_pings,b_pings){var t
	f_pings = f_pings._.sortBy('time')
	b_pings = b_pings._.sortBy('time')
	f_pings.map(function(v){v.group_time = round(v.time/86400 - 2/3)*86400 + 86400*2/3})
	b_pings.map(function(v){v.group_time = round(v.time/86400 - 2/3)*86400 + 86400*2/3})
	if (b_pings.some(function(v){return v.group_time!==v.time})) {print('ERROR: so confused'); throw '‽'}

	//! horrifyingly inefficient
	f_pings.map(function(fp){
		var bp = b_pings.filter(function(bp){return !bp.matched && bp.group_time===fp.group_time && bp.tags===fp.tags && bp.period===fp.period})[0]
		if (bp) {fp.matched = true; bp.matched = true} })
	var add_pings = f_pings.filter(function(v){return !v.matched})
	var kill_pings = b_pings.filter(function(v){return !v.matched})

	add_pings.map(function(v){v.add = true})
	kill_pings.map(function(v){v.kill = true})

	var actions = _.values(add_pings.concat(b_pings)._.groupBy(function(v){return v.group_time+' '+v.period})).map(function(v){
		if (!v.some(function(v){return v.add || v.kill})) // no change
			return undefined
		else if (v.every(function(v){return v.add})) // log and ¬bee: CREATE
			return [['CREATE',{timestamp:v[0].group_time, value:v.length*v[0].period/60, comment:pluralize(v.length,'ping')+': '+_.pluck(v,'tags').join(', ')}]]
		else if (v.every(function(v){return v.kill})) // ¬log and bee: DELETE
			return v.map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]})
		else { // log and bee: UPDATE?
			var t = _.values(v.filter(function(v){return !(v.add || v.kill)})._.groupBy('id'))
			v = v.concat(t.slice(1).ζ0_concat().map(function(v){v.kill = true; return {add:true, group_time:v.group_time, period:v.period, tags:v.tags}}))
			var set = v.filter(function(v){return !v.kill})
			var kill = v.filter(function(v){return v.kill})
			var id = t.length===0? kill[0].id : t[0][0].id
			return [['UPDATE',id,{timestamp:v[0].group_time, value:set.length*v[0].period/60, comment:pluralize(set.length,'ping')+': '+_.pluck(set,'tags').join(', ')},set.length-kill.length]].concat(kill.filter(function(v){return v.id!==id}).map(function(v){return ['DELETE',{timestamp:v.time,id:v.id}]}))
		} }).filter(function(v){return v}).ζ0_concat()
	actions = actions._.groupBy(0)
	var CREATE = (actions.CREATE||[])._.pluck(1)
	var UPDATE = (actions.UPDATE||[])
	var DELETE = (actions.DELETE||[])._.pluck(1)._.uniq(function(v){return v.id})
	var ymd = function(v){return moment(v.timestamp).utc().format('YYYY-MM-DD')}
	return {
		msgs: [
			CREATE.map(function(v){return 'BEE_SYNC + '+user_slug+' '+ymd(v)+' '+v.comment}),
			UPDATE.map(function(v){return 'BEE_SYNC = '+user_slug+' '+ymd(v[2])+' '+v[2].comment}),
			DELETE.map(function(v){return 'BEE_SYNC - '+user_slug+' '+ymd(v)+' '+v.id}),
			].ζ0_concat(),
		cmds: [
			CREATE.length? [[user_slug+'.datapoints *=',CREATE]] : [],
			UPDATE._.sortBy(3).map(function(v){return [user_slug+'.datapoints['+v[1]+'] =',v[2]]}),
			DELETE.map(function(v){return [user_slug+'.datapoints['+v.id+'] =']}),
			].ζ0_concat(),
		} }

var sync_bee = function(args,cb){
	async.parallelLimit(_.keys(rc.beeminder).filter(function(v){return v.indexOf('/')!==-1}).map(function(user_slug){return function(cb){
		beeminder(user_slug+'.datapoints',function(e,v){if (e) cb(e,v); else {
			cb(null,generate_actions(
				user_slug,
				logfile_pings().filter(function(v){return tagdsl_eval(rc.beeminder[user_slug],v.tags)})._.sortBy('time'),
				beeminder_pings(v)))
				}}) }}),
		10,
		function(e,action_sets){
			action_sets._.pluck('msgs').ζ0_concat().map(function(v){clog(v)})
			if (!args.dry) async.parallelLimit(action_sets._.pluck('cmds').ζ0_concat().map(function(v){return function(cb){beeminder.apply(null,[].concat(v,[cb]))}}),10,cb)
			else cb&&cb.in()
		} ) }

var sync = function(args,cb){clog('SYNC'); sync_bee(args||{},cb)}

module.exports = sync

if (!module.parent) sync({dry:process.argv[2]==='--dry'})
