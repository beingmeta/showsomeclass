PATH:=/usr/local/bin:${PATH}
UGLIFY:=uglifyjs2
UGLIFY_FLAGS:=-b
UGLIFY_OFLAGS:=-c -b
CLEANCSS:=`which cleancss`
POSTCSS:=`which postcss`
AUTOPREFIXER:=`which autoprefixer`

%.js: %.html makefile
	./text2js SSC.Templates.`basename $@ .js` $< $@
%.hint: %.js
	@JSHINT=`which jshint`; if test "x$${JSHINT}" = "x"; then touch $@; else $${JSHINT} $^ | tee $@; fi

default: app.js app.css ../showsomeclass.js ../showsomeclass.css templates.js hints TAGS

JAVASCRIPT_SOURCES=ssc.js dialog.js edit.js
HINTS=ssc.hint dialog.hint edit.hint

CSS_SOURCES=ssc.css dialog.css edit.css
HTML_SOURCES=editcontent.html editselection.html textedit.html \
	editelement.html reclass.html toolbar.html bigtextedit.html \
	sscabout.html sschelp.html edithelp.html ssctoolbar.html \
	savedialog.html
TEMPLATES=toolbar.js editelement.js editcontent.js reclass.js \
	editselection.js textedit.js bigtextedit.js \
	sscabout.js sschelp.js edithelp.js ssctoolbar.js \
	savedialog.js
TAGS: ${JAVASCRIPT_SOURCES} ${CSS_SOURCES} ${HTML_SOURCES}
	etags $^

../showsomeclass.js: ssc.js dialog.js ${TEMPLATES} edit.js
	@$(UGLIFY) $(UGLIFY_FLAGS) \
		--source-map ../showsomeclass.js.map \
		ssc.js dialog.js ${TEMPLATES} edit.js -o $@

app.js: ssc.js ${TEMPLATES} dialog.js edit.js
	cat ssc.js dialog.js ${TEMPLATES} edit.js > $@
app.css: ssc.css dialog.css edit.css
	cat ssc.css dialog.css edit.css > app.css
templates.js: ${TEMPLATES}
	cat ${TEMPLATES} > templates.js
hints: ${HINTS}
	cat ${HINTS} > hints

clean:
	rm -f *.hint ${TEMPLATES}

