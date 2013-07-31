%.js: %.html makefile
	./text2js SSC.Templates.`basename $@ .js` $< $@

default: app.js app.css

TEMPLATES=toolbar.js editelement.js editcontent.js reclass.js \
	editselection.js simpleselection.js

app.js: ssc.js ${TEMPLATES} edit.js
	cat ssc.js ${TEMPLATES} edit.js > $@
app.css: ssc.css
	cp ssc.css showsomeclass.css

