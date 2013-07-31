%.js: %.html makefile
	./text2js SSC.Templates.`basename $@ .js` $< $@

default: app.js app.css TAGS

TEMPLATES=toolbar.js editelement.js editcontent.js reclass.js \
	editselection.js simpleselection.js
JAVASCRIPT_SOURCES=ssc.js edit.js
CSS_SOURCES=ssc.css dialog.css edit.css
HTML_SOURCES=editcontent.html editselection.html simpleselection.html \
	editelement.html reclass.html toolbar.html
TAGS: ${JAVASCRIPT_SOURCES} ${CSS_SOURCES} ${HTML_SOURCES}
	etags $^

app.js: ssc.js ${TEMPLATES} edit.js
	cat ssc.js ${TEMPLATES} edit.js > $@
app.css: ssc.css dialog.css edit.css
	cat ssc.css dialog.css edit.css > app.css
