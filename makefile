%.js: %.html makefile
	./text2js SSC.Templates.`basename $@ .js` $< $@

default: app.js app.css templates.js TAGS

JAVASCRIPT_SOURCES=ssc.js dialog.js edit.js
CSS_SOURCES=ssc.css dialog.css edit.css
HTML_SOURCES=editcontent.html editselection.html textedit.html \
	editelement.html reclass.html toolbar.html bigtextedit.html \
	sscabout.html sschelp.html edithelp.html ssctoolbar.html
TEMPLATES=toolbar.js editelement.js editcontent.js reclass.js \
	editselection.js textedit.js bigtextedit.js \
	sscabout.js sschelp.js edithelp.js ssctoolbar.js
TAGS: ${JAVASCRIPT_SOURCES} ${CSS_SOURCES} ${HTML_SOURCES}
	etags $^

app.js: ssc.js ${TEMPLATES} dialog.js edit.js
	cat ssc.js dialog.js ${TEMPLATES} edit.js > $@
app.css: ssc.css dialog.css edit.css
	cat ssc.css dialog.css edit.css > app.css
templates.js: ${TEMPLATES}
	cat ${TEMPLATES} > templates.js
