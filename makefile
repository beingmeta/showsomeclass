%.js: %.html makefile
	./text2js SSC.Templates.`basename $@ .js` $< $@

default: showsomeclass.js showsomeclass.css

TEMPLATES=toolbar.js editelement.js editcontent.js reclass.js editselection.js

showsomeclass.js: ssc.js ${TEMPLATES} edit.js
	cat ssc.js ${TEMPLATES} edit.js > $@
showsomeclass.css: ssc.css
	cp ssc.css showsomeclass.css

