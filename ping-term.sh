#!/usr/bin/env bash

# was something like:

# var ping_process = function(time,last_doing){var t
# 	print('\u0007')
# 	if (now() - time > 9) {
# 		print(divider(''))
# 		print(divider(' WARNING '.repeat(8)))
# 		print(divider(''))
# 		print('This popup is',now() - time,'seconds late.')
# 		print('Either you were answering a previous ping when this tried to pop up, or you')
# 		print("just started tagtime, or your computer's extremely sluggish.")
# 		print(divider(''))
# 		print()
# 		}
# 	print("It's tag time! What are you doing RIGHT NOW ("+m(time*1000).format('HH:mm:ss')+')?')
# 	var cyan = function(v){return '\x1b[36;1m'+v+'\x1b[0m'}
# 	print('Ditto ('+cyan('"')+') to repeat prev tags:',cyan(last_doing))
# 	var t; var tags = (t=read_line_stdin().trim())==='"'? last_doing : t
# 	return tags
# 	}