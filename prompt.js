









// var prompt = function(ping_before,cb){prompt.impl({sound:rc.ping_sound, ping_before:ping_before, macros:rc.macros},cb)}
// prompt:function(args,cb){
// 	sub1('ping_prompt',function(v){
// 		v.init(args)
// 		var t = v.show; v.show = function(cb){t(function(e,v){win.setShowInTaskbar(false); cb(e,v)})}
// 		cb(null,v)})
// 	gui.Window.open('ping.html',{frame:false, 'always-on-top':true, min_width:50, min_height:20, show:false})
// 	win.setShowInTaskbar(true)
// 	}

// use 'inject-js-end':'filename' option?

// gui.Window.open('blank.html',{frame:false, 'always-on-top':true, min_width:50, min_height:20, show:false, 'inject-js-end':'prompt.js'})








// <!DOCTYPE html>
// <html><head>
// 	<meta charset="utf-8">
// <style>
// 	/* behavior */
// 	body {margin:8px; white-space:nowrap;}
// 	body {-webkit-app-region:drag;} .expando_input, button {-webkit-app-region:no-drag;}
// 	#body {display:inline-block;}
	
// 	/* element defn */
// 	.expando_input {display:table-cell;}

// 	/* style */
// 	* {outline:none;}
// 	body {background-color:#222; color:#fff; font-family:Monaco,monospace; font-size:12px;}
// 	p {margin:0;}
// 	button {background-color:#333; border:1px solid #666; cursor:pointer; padding:2px 4px; color:inherit; font:inherit;}
// 	button.inline {margin:-1px -3px; padding:0 2px;}
// 	#tag_editor {margin:5px;} ol#tag_editor {padding:0; list-style:none;}
// 	.tags_in_li {display:inline-block; vertical-align:bottom; margin:0 0 0 1ch;}
// 	.key {background-color:#333; border:1px solid #666; padding:0 0.5ch 0 0.4ch; border-radius:0.5ch;}
// 	.curr_line {background-color:#444;} li.curr_line {margin:0 -13px; padding:0 13px;}
// 	.tagstr, .tags_in {color:#ffd700;}
// 	.time {color:#08f;}
// 	em {background-color:#800; margin:0 -0.5ch; padding:0 0.5ch; font-style:normal;}
// </style></head><body></body></html><script>

// require('./tt_util.js')(window)
// var gui = require('nw.gui')
// var win = gui.Window.get()
// var t = $; var $ = function(v){return t(v,document)}; $.__proto__ = t; $.prototype = t.prototype

// win.showf = function(){win.show(); win.focus()}
// $.prototype.focus_end = function(){var v
// 	if ((v=this.find_self('.expando_input')).length) try {v.focus(); var t = window.document.createRange(); t.selectNodeContents(v[0]); t.collapse(false); var u = window.getSelection(); u.removeAllRanges(); u.addRange(t)} catch (e) {clog('ERROR nonfatal',e)}
// 	else this.focus()
// 	return this}

// var future    = function(v){return v.time > now()}
// var late      = function(v){return Math.abs(now()-v.time) > 20}
// var very_late = function(v){return Math.abs(now()-v.time) > 86400/3}

// var args
// var prev_ping
// var pings = []
// var shown; var done
// var cur

// //! this file is a monstrous mess
// //! can we unify ping object tags and element tags?

// var build_window = function(){
// 	var L = function(a,b){a = 'IDS_'+a+'_MAC'; return b? nwDispatcher.getNSStringFWithFixup(a,b) : nwDispatcher.getNSStringWithFixup(a)}
// 	var menu = function(args,v){var r = args? new gui.Menu(args) : new gui.Menu(); v.forEach(function(v){
// 		var t = {label:v[0]}
// 		if (v[1]) {t.modifiers = v[1].split('').slice(0,-1).map(function(v){return v.replace(/⌘/g,'cmd').replace(/⇧/g,'shift').replace(/⌥/g,'alt').replace(/\^/g,'ctrl')}).join('-'); t.key = v[1][-1]}
// 		if (typeof(v[2])==='string') t.selector = v[2]
// 		else if (typeof(v[2])==='function') {t.click = v[2]; if ({'⎋':1}[v[1]]) $(window).on_key(v[1],t.click)}
// 		else t.submenu = v[2]
// 		r.append(new gui.MenuItem(t))
// 	}); return r}

// 	win.menu = menu({type:'menubar'},[
// 		['',0,menu(0,[
// 			['Cancel','⎋',function(){win.close()}],
// 			['Cancel','⌘w','performClose:'],
// 			['Cancel','⌘q','performClose:'],
// 			['DevTools','⌘⌥i',function(){win.isDevToolsOpen()? win.closeDevTools() : win.showDevTools()}],
// 			['DevTools','⌘;',function(){win.isDevToolsOpen()? win.closeDevTools() : win.showDevTools()}],
// 			])],
// 		[L('EDIT_MENU'),0,menu(0,[
// 			[L('EDIT_UNDO'), '⌘z', 'undo:'],
// 			[L('EDIT_REDO'), '⌘⇧z', 'redo:'],
// 			[L('CUT'), '⌘x', 'cut:'],
// 			[L('COPY'), '⌘c', 'copy:'],
// 			[L('PASTE'), '⌘v', 'paste:'],
// 			[L('EDIT_SELECT_ALL'), '⌘a', 'selectAll:'],
// 			])],
// 		])

// 	win.on('close',function(){try {return_and_close(true)} catch (e) {win.close(true); args.cb(e); throw e}})

// 	$(window).mouseenter(win.showf)

// 	var macros = function λ(){return typeof(args.macros)==='string'? λ._ && λ.stale > now() - 5? λ._ : (λ.stale=now(),λ._=JSON.parse(global.fs(args.macros).$)) : args.macros}
// 	var m_prev; if (args.macros) (function(){if (shown) {var m = macros()
// 		// if (!$('#macros').length) {m_prev=0; $('#body').append($('<table id="macros">')); $.css}
// 		// if (!_.isEqual(m_prev,m)) {$('#macros').html(_.pairs(m).map(function(v){return $('<tr>').html([$('<td>').text(v[0]),$('<td>').text(v[1])])})); size_and_center()}
// 		$('.tags_in').map(function(i,v){var t; if ((t=$(v).textn().match(/^(.*?)(\S+) $/)) && $(v).text() !== (t=t[1]+(m[t[2]]||t[2])+'\xa0')) {$(v).text(t); c_focus()}})
// 		m_prev = m}}).every(0.2)
// 	}

// // much less important:
// //! when adding to the top and bottom, current selection should try to stay in the same place
// //! resizing and/or moving the window flashes it white

// // less important:
// //! sufficiently faraway times should be longer!
// //! sufficiently nearby times could be shorter! dynamically so, even! yeah. dynamically.
// //! i wanna see the blinky thing!

// // very important:
// //! when to add afk to things?

// var C = function(v){var id; var c = v.split(' ').filter(function(v){var t; if (t=v.match(/^#(.*)/)) id = t[1]; return !t}).join(' '); return (id?' id="'+id+'"':'')+(c!==''?' class="'+c+'"':'')}
// var S = function(c){return $('<span'+C(c)+'>')}
// var Key = function(v){return S('key').html(v)}
// var Expando_input = function(co,ci){return $('<div'+C(co)+'><div class="expando_input '+ci+'" contenteditable="true"></div></div>')}

// win.size_and_center = function(op){op=op||{}; var yb; var xw; var yw
// 	this.setResizable(true)
// 	this.resizeTo(xw=$('#body').width()+16,yw=Math.min(yb=$('#body').height()+16,Math.round(xw*1.5)))
// 	if (op.tall) {this.setMinimumSize(xw,20); this.setMaximumSize(xw,yb)} else this.setResizable(false)
// 	this.moveTo(Math.round((window.screen.width-xw)/2),Math.round((window.screen.height-yw)/2)) }
// var size_and_center = function(){win.size_and_center({tall:$('#body').hasClass('editor_multi')})}

// var c_first = function(){return $('#body').hasClass('editor_single')? $('.tags_in') : $('#tag_editor > *').first()}
// var c_set = function(v){if (v!==cur) {cur&&cur.removeClass('curr_line'); cur = v; cur.addClass('curr_line'); ditto_o_set()}}
// var c_line = function(){return cur.is($('#submit'))? undefined : cur.find_self('.tags_in')}
// var c_get_next = function(){var t; return cur.is($('#submit'))? c_first()                   : (t=cur.next()).length? t : $('#submit')}
// var c_get_prev = function(){var t; return cur.is($('#submit'))? $('#tag_editor > *').last() : (t=cur.prev()).length? t : $('#submit')}
// var c_next = function(){c_set(c_get_next()); c_focus(); return false}
// var c_prev = function(){c_set(c_get_prev()); c_focus(); return false}
// var c_focus = function(){cur.focus_end()}
// var c_at_end = function(){return cur.is($('#submit')) || $('#body').hasClass('editor_single')}

// var c_focus_some_always = function(){
// 	c_focus()
// 	$(window).on('click',c_focus())
// 	if ($('#body').hasClass('editor_single')) $('.tags_in').on('click',function(e){e.stopPropagation()})
// 	else $('#tag_editor').on('click','li',function(e){e.stopPropagation(); c_set($(this)); c_focus()})
// 	}

// var single_ditto = function(e){var t; if (prev_ping&&prev_ping.tags!=='') {e.preventDefault(); (t=c_line()).text(tags_union(t.textn(),prev_ping.tags)); return_and_close()}}
// var multi_ditto = function(e){var t; e.preventDefault(); if (c_at_end()) return_and_close(); else {copy_gui_tags_to_ping_tags(); var prev = [prev_ping].concat(pings)[cur.index()+1-1]; if (prev&&prev.tags!=='') (t=c_line()).text(tags_union(t.textn(),prev.tags)); c_next()}}

// var ping_in = function(co,v){var t=Expando_input(co,'tags_in'); t.find('.tags_in').text(v.tags); return t}
// var ping_li = function(v){return $('<li>').html([S('time').html(moment(v.time).format('HH:mm:ss')),ping_in('tags_in_li',v)])}

// var copy_gui_tags_to_ping_tags = function(){ //! remove, maybe just with the unification
// 	if ($('.tags_in').length === pings.length) [pings,$('.tags_in').toArray().map(function(v){return $(v).textn()})].zipmap(function(v,tags){v.tags = tags_norm(tags)})
// 	else err('oh gosh!',$('.tags_in').length,pings.length)
// 	}

// var build_single_editor = function(){
// 	var v = pings[0]
// 	$('body').html($('<div id="body" class="editor_single">').html([
// 		$('<p>').html(["It's tag time! What ",late(v)? $('<em>').text(future(v)?'are':'were') : 'are',' you doing RIGHT ',late(v)?'AT':'NOW',' ',S('time').html(moment(v.time).format((very_late(v)?'YYYY-MM-DD/':'')+'HH:mm:ss')),'?']),
// 		$('<p id="ditto_o">').html([Key("'"),' to repeat previous tags: ',$('<button id="ditto" class="inline tagstr">')]),
// 		ping_in('#tag_editor',v),
// 	]))

// 	cur = c_first()
// 	c_focus_some_always()

// 	$('.tags_in').on_key('↩',function(){if (cur.text()!=='') return_and_close(); return false})
// 	$('.tags_in').on_key('⇥',function(){return false})
	
// 	$('.tags_in, #submit').on_key('↑',function(){if (cur.is(c_first())) ping_unshift_if(); else c_prev(); return false})
// 	$('#ditto').on('click',single_ditto)
// 	$('.tags_in, #submit').on_key('\'',single_ditto)
// 	prev_ping_set(prev_ping)

// 	size_and_center() }
// var build_multi_editor = function(){var t
// 	if (pings.length > 300 && confirm("oh dear, we're about to try to load "+pings.length+' ping boxes. Quit?'))
// 		{alert('Quitting!'); win.close(); return}

// 	$('body').html($('<div id="body" class="editor_multi">').html([
// 		$('<p>').html("It's tag times! What were you doing RIGHT AT these times?"),
// 		$('<p>').html([Key("'"),' to repeat previous tags',$('<span id="ditto_o">').html([': ',$('<button id="ditto" class="inline tagstr">')])]),
// 		$('<ol id="tag_editor">').html(pings.map(ping_li)),
// 		$('<button id="submit">').text('submit all'),
// 	]))

// 	c_set(c_first())
// 	c_focus_some_always()

// 	$('#tag_editor').on_key('↩','.tags_in',c_next)
// 	$('#tag_editor').on_key('⇥','.tags_in',c_next)
// 	$('#tag_editor').on_key('↓','.tags_in',c_next)
// 	$('#submit').on_key('⇥',c_next)
// 	$('#submit').on_key('↓',c_next)
// 	$('#submit').on('click',return_and_close)

// 	$('#tag_editor').on_key('↑','.tags_in',t=function(){if (cur.is(c_first())) ping_unshift_if(c_prev); else c_prev(); return false})
// 	$('#submit').on_key('↑',t)
// 	$('#ditto').on('click',multi_ditto)
// 	$('#tag_editor').on_key('\'','.tags_in',multi_ditto)
// 	$('#submit').on_key('\'',multi_ditto)
// 	prev_ping_set(prev_ping)

// 	size_and_center() }

// var ping_push = function(v,begin){lock.readLock('gui',function(rel){
// 	if (shown && pings.length===1) copy_gui_tags_to_ping_tags()
// 	pings[begin? 'unshift' : 'push'](v)
// 	if (shown) {
// 		if (pings.length===2) {$('body').html(''); build_multi_editor()}
// 		else {$('#tag_editor')[begin? 'prepend' : 'append'](ping_li(v)); size_and_center()} }
// 	rel()})}
// var ping_unshift = function(v){ping_push(v,true)}

// var ping_unshift_if = function(cb){lock.readLock('gui',function(rel){
// 	if (prev_ping) {ping_unshift(prev_ping); prev_ping_set(undefined); fetch_prev_ping()}
// 	rel(); cb&&cb()})}

// var prev_ping_set = function(v){prev_ping = v; if (shown) {if (v) $('#ditto').text(v.tags); ditto_o_set()}}

// var ditto_o_set = function(){prev_ping&&prev_ping.tags!=='' && cur.is(c_first())? $('#ditto_o').show() : $('#ditto_o').hide()}

// var fetch_prev_ping = function(cb){if (prev_ping===undefined && args.ping_before) args.ping_before(pings[0].time,function(ping){if (ping) ping.tags=ping.tags||''; prev_ping_set(ping||null); cb&&cb()}); else cb&&cb()}

// var build_gui = function(cb){lock.writeLock('gui',function(rel){
// 	shown = true
// 	if (pings.length===0) err('‽')
// 	pings.length===1? build_single_editor() : build_multi_editor()
// 	rel(); cb&&cb()})}

// var beep = function(){if (shown) new Audio(global.fs(args.sound).realpath()).play()}

// var return_and_close = function(canceled){
// 	done = true
// 	copy_gui_tags_to_ping_tags()
// 	if (canceled===true) pings.forEach(function(v){v.tags = tags_union(v.tags,'canceled')})
// 	win.close(true)
// 	args.cb(null,pings)}

// global.pub('ping_prompt',{
// 	init:function(args_){args = args_; build_window()},
// 	ping:function(ping){if (!done) {beep(); ping.tags=ping.tags||''; ping_push(ping); return true}},
// 	show:function(cb){args.cb = cb; fetch_prev_ping(function(){build_gui(function(){beep(); win.showf.in(0.2)})})},
// 	})

// </script>