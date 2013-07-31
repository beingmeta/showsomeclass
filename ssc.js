var SSC=(function(){

    var default_root='https://static.sbooks.net/showsomeclass';

    /* DOM utilities */

    function byID(id){return document.getElementById(id);}

    function make(tag,classname,content,id){
	var elt=document.createElement(tag);
	if (classname) elt.className=classname;
	if (!(content)) {}
	else if (typeof content === "string")
	    elt.innerHTML=content;
	else if (content.nodeType)
	    elt.appendChild(content);
	else elt.innerHTML=fillin(content);
	if (id) elt.id=id;
	return elt;}
    function make_text(input){
	if (typeof input === "string")
	    return document.createTextNode(input);
	else return document.createTextNode(fillin(input));}
    var text=make_text;

    function fillin(data,text){ /* Filling in templates */
	if (typeof data === "string") {
	    var tmp=data; data=text; text=tmp;}
	if ((!(text))&&(data)&&(data.template)) text=data.template;
	// Maybe a warning?
	if (typeof text !== "string") return;
	if (data) {
	    for (var prop in data) {
		if (data.hasOwnProperty(prop)) {
		    if (prop==="template") continue;
		    var value=data[prop];
		    var pat=new RegExp("{{"+prop+"}}","g");
		    text=text.replace(pat,value.toString());}}
	    return text;}
	else return text;}

    /* Manipulating node classes */

    var whitespace_pat=/(\s)+/;
    var trimspace_pat=/^(\s)+|(\s)+$/;
    var classpats={};
    /* Returns a Regex for matching a delimited class name */
    function classPat(name){
	var rx=new RegExp("\\b"+name+"\\b","g");
	classpats[name]=rx;
	return rx;}
    function addClass(elt,classname){
	if (typeof elt === "string") elt=byID(elt);
	if (!(elt)) return;
	if (Array.isArray(elt)) {
	    var i=0, lim=elt.length;
	    while (i<lim) addClass(elt[i++],classname);}
	else {
	    var current=elt.className, pat=classPat(classname);
	    if (!(current)) elt.className=classname;
	    else if (current===classname) {}
	    else if (current.search(pat)>=0) {}
	    else elt.className=((current+" "+classname).
				replace(whitespace_pat," ").
				replace(trimspace_pat,""));}}
    function dropClass(elt,classname){
	if (typeof elt === "string") elt=byID(elt);
	if (!(elt)) return;
	if (Array.isArray(elt)) {
	    var i=0, lim=elt.length;
	    while (i<lim) dropClass(elt[i++],classname);}
	else {
	    var current=elt.className, pat=classPat(classname);
	    if (!(current)) elt.className=classname;
	    else if (current===classname) elt.className=null;
	    else if (current.search(pat)>=0)
		elt.className=((current.replace(pat,"")).
			       replace(whitespace_pat," ").
			       replace(trimspace_pat,""));
	    else {}}}
    function hasClass(elt,classname){
	if (typeof elt === "string") elt=byID(elt);
	if (!(elt)) return;
	var current=elt.className, pat=classPat(classname);
	if (!(current)) return false;
	else if (current===classname) return true;
	else if (current.search(pat)>=0) return true;
	else return false;}

    /* Adding listeners */

    function addListener(node,evtype,handler){
	if (!(node)) return;
	else if (typeof node==="string")
	    node=document.getELementById(node);
	else if (node.nodeType) {}
	else if (node.length) {
	    var copy=[]; var i=0, lim=node.length;
	    while (i<lim) copy.push(node[i++]);
	    i=0; while (i<lim) addListener(copy[i++],evtype,handler);
	    return;}
	if (!(node)) return;
	else if (node.addEventListener)
	    node.addEventListener(evtype,handler,false);
	else if (node.attachEvent)
	    node.attachEvent("on"+evtype,handler);
	else return;}
    function cancel(evt){
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;}

    /* Getting node signatures */

    function getSignature(node,attribs){
	var classname=node.className.replace(/\bssc\w+/g,"").trim();
	var id=node.id, tag=node.tagName;
	if (id.search("sscTMP")===0) id=false;
	var sig=tag+
	    ((classname)?("."):(""))+
	    ((classname)?((classname.split(/\s+/)).join(".")):(""))+
	    (((attribs)&&(id))?("#"+id):(""));
	if (attribs) {
	    if (node.name) sig=sig+"[NAME='"+node.name+"']";
	    if (typeof attribs === "string") {
		var val=node.getAttribute(attribs);
		if (val) sig=sig+"["+attrib+"'"+val.replace("'","\\'")+"']";}}
	// We could interpret other attribs args (arrays, regexes, etc)
	else {}
	return sig;}

    /* Copying an array (or array-like object, such as a NodeList) into a new array. */

    function copy(input){
	var output=new Array(input.length);
	var i=0, lim=input.length;
	while (i<lim) {output[i]=input[i]; i++;}
	return output;}

    /* Determining if a node's text contains anything matching a
     * given regular expression. Note that this won't handle cases
     * where the matched text is split across elements. */
    function hasText(node,rx){
	if (!(node.childNodes)) return false;
	var children=node.childNodes;
	var i=0, lim=children.length;
	while (i<lim) {
	    var child=children[i++];
	    if (child.nodeType===3) {
		if (child.nodeValue.search(rx)>=0) return true;}
	    else if (child.nodeType===1) {
		if (hasText(child,rx)) return true;}}
	return false;}

    var hybrid_pattern=/[ ]*([^\/]+)\/([^\/]+)\/([mig]*)[ ]*/;
    
    /* Do a search, basically with a CSS selector combined with an
       (optional) text-matching regex. */
    function $(spec){
	var match=hybrid_pattern.exec(spec);
	if (match) {
	    var sel=match[1];
	    var rx=new RegExp(match[2].replace(/&slash;/g,"/"),match[3]||"mig");
	    var candidates=document.querySelectorAll(sel);
	    var output=[];
	    var i=0, lim=candidates.length;
	    while (i<lim) {
		var node=candidates[i++];
		if (hasText(node,rx)) output.push(node);}
	    return output;}
	else return copy(document.querySelectorAll(spec));}

    /* Stripping out the regex part of a hybrid pattern */
    function stripregex(spec){return spec.replace(/\/[^\/]+\//,"");}
    
    /* Generating temporary IDs if needed.  We don't currently use
     * this, but we might. */

    /* Serial number to guarantee uniqueness. */
    var tmpid_count=1;

    /* We use tmpid_elts to keep track of all the elements we've
     * given IDs so that we can take them back if we ever need to
     * extract and save the body of the document. */
    var tmpid_elts=[];

    function getID(node){
	if (node.id) return node.id;
	var newid="sscTMP"+(tmpid_count++);
	// This is very unlikely, but let's be obsessive
	while (byID(newid)) newid="sscTMP"+(tmpid_count++);
	node.id=newid;
	tmpid_elts.push(node);
	return node.id;}

    /* The state of the selector app. */

    // The CSS selector itself
    var selector=false;
    // The nodes it matches
    var selected=[];
    // Which of those nodes, if any, is the application focus
    var focus=false;
    // The index of the focus in selected.  This is helpful for
    //  tabbing forward and backward in the sequence.
    var focus_index=false;
    // The 'real title' used in construction new titles
    var real_title=false;

    /* Various status functions for the app */

    function isenabled(){return hasClass(document.body,"cxSSC");}
    function enable(){addClass(document.body,"cxSSC");}
    function disable(){dropClass(document.body,"cxSSC");}
    function toggle(){
	if (hasClass(document.body,"cxSSC"))
	    dropClass(document.body,"cxSSC");
	else addClass(document.body,"cxSSC");}
    
    /* Selective display */

    /* Clear all selective display classes */
    function clear(){
	var wrappers=$(".sscWRAPPER");
	var selected=$(".sscSELECTED");
	dropClass(wrappers,"sscWRAPPER");
	dropClass(selected,"sscSELECTED");
	selector=false;
	if (SSC.display) SSC.display.innerHTML="";
	selected=[];
	if ((!(real_title))&&(document.title))
	    real_title=document.title||"";
	document.title="(no class!) "+real_title;}

    /* Selectively display a particular node */
    function show(node){
	if (hasClass(node,"sscSELECTED")) return;
	addClass(node,"sscSELECTED");
	var scan=node.parentNode, body=document.body;
	while ((scan)&&(scan!==body)) {
	    if (hasClass(scan,"sscWRAPPER")) break;
	    else {
		addClass(scan,"sscWRAPPER");
		scan=scan.parentNode;}}}

    /* Selectively display all the nodes matching a spec
       and update the state variables for the app.  */
    function select(spec,force,nomsg){
	if (!(spec)) clear();
	else if ((spec===selector)&&(!(force))) return;
	else clear();
	if (!(spec)) return;
	var nodes=$(spec);
	var i=0, lim=nodes.length;
	enable(); addClass(document.body,"sscTOOLBAR");
	while (i<lim) show(nodes[i++]);
	document.title="("+nodes.length+"x"+spec+") "+real_title;
	var input=byID("SSCINPUT"), count=byID("SSCMATCHCOUNT");
	var styleinfo=byID("SSCSTYLEINFO");
	if (input) {
	    input.value=spec;
	    input.title="matches "+nodes.length+" elements";}
	if (count) count.innerHTML=""+nodes.length;
	if (styleinfo) {
	    var rules=SSC.getStyleInfo(spec);
	    styleinfo.innerHTML="";
	    var r=0, n_rules=rules.length;
	    while (r<n_rules) {
		var rule=rules[r++]; var p=make("p"); var body=rule.indexOf('{');
		p.appendChild(make("strong",false,rule.slice(0,body).trim()));
		p.appendChild(text(" { "));
		var clauses=rule.slice(body+1), semi=clauses.indexOf(';');
		while (semi>0) {
		    p.appendChild(make("span","prop",(clauses.slice(0,semi)).trim()+";"));
		    p.appendChild(text(" "));
		    clauses=clauses.slice(semi+1);
		    semi=clauses.indexOf(';');}
		p.appendChild(text(clauses));
		styleinfo.appendChild(p);}}
	selector=spec;
	selected=nodes;
	if (lim) SSC.focus(nodes[0]);
    	window.location.hash="#"+spec;}

    /* THE FOCUS is used for moving back and forth through the
       selected nodes. */
    function setFocus(node,index){
	if ((node)&&(typeof index!=="number"))
	    index=selected.indexOf(node);
	if (byID("SSCMATCHINDEX")) byID("SSCMATCHINDEX").innerHTML=""+(index+1);
	if (focus) dropClass(focus,"sscFOCUS");
	if (node) addClass(node,"sscFOCUS");
	focus=node; focus_index=index;
	if (!(focus)) {}
	else if (focus.scrollIntoViewIfNeeded) {
	    var offset=((window.innerHeight>400)?(-200):
			(window.innerHeight>200)?(-100):(-50));
	    var current=window.scrollY;
	    focus.scrollIntoViewIfNeeded();}
	else if (focus.scrollIntoView) {
	    var offset=((window.innerHeight>400)?(-200):
			(window.innerHeight>200)?(-100):(-50));
	    focus.scrollIntoView();
	    if (window.scrollBy) window.scrollBy(0,offset);}
	else {}}
    function focusfn(node){
	var index=false;
	if (typeof node === "undefined") return focus;
	else if (typeof node === "number") {
	    if (selected[node]) {
		index=node; node=selected[index];}
	    else node=false;}
	else if (node.nodeType!==1) node=false;
	else {}
	if (!(node)) setFocus(false,false);
	else setFocus(node,index);
	return node;}

    /* Finally, return the object */

    return {
	isenabled: isenabled,enable: enable,disable: disable,toggle: toggle,
	select: select, clear: clear, setFocus: setFocus, focus: focusfn, 
	selector: function getselector(){ return selector;},
	selected: function getselected(){ return selected;},
	refresh: function refresh(){select(selector,true);},
	focusIndex: function focusIndex(){ return focus_index;},
	getFocus: function(){return focus;},
	// Utility functions
	$: $, addClass: addClass, dropClass: dropClass, getSignature: getSignature,
	hasClass: hasClass, hasText: hasText, stripregex: stripregex, getID: getID,
	fillin: fillin, make: make, make_text: make_text, text: make_text,
	addListener: addListener, cancel: cancel, byID: byID,
	default_root: default_root, Templates: {}};})();

SSC.updateSelectors=(function(){

    var make=SSC.make, text=SSC.text, fillin=SSC.fillin;
    var addListener=SSC.addListener, byID=SSC.byID;
    
    function countSelectors(root){
	var counts={}, all=[];
	if (!(root)) root=document.body;
	// Gather all selectors, with frequency counts
	scandom(root,counts,all);
	// Sort by frequency, then length
	all.sort(function(x,y){
	    var cx=counts[x], cy=counts[y];
	    if (cx===cy) {
		if (x.search(y)>=0) return 1;
		else if (y.search(x)>=0) return -1;
		else return y.length-x.length;}
	    else return cy-cx;});
	if (all.length>1) {
	    // Remove some redundant entries
	    var i=1, lim=all.length;
	    var cur=all[0], reduced=[cur];
	    var curcount=counts[cur];
	    while (i<lim) {
		var sel=all[i++], count=counts[sel];
		if ((count!==curcount)||
		    (cur.search(new RegExp(sel.replace(".","\\.")+"\\b"))<0))
		    reduced.push(sel); cur=sel; curcount=count;}
	    counts._all=reduced;}
	else counts._all=all;
	return counts;}
    SSC.countSelectors=countSelectors;

    function possibleSelectors(tag,classes){
	var selectors=[];
	if (!(tag)) tag=false;
	if (tag!==false) selectors.push(tag);
	classes.sort();
	var i=0, lim=classes.length;
	while (i<lim) {
	    selectors.push("."+classes[i]);
	    if (tag!==false) selectors.push(tag+"."+classes[i]);
	    var j=i+2;
	    while (j<lim) {
		var compound=classes.slice(i,j).join(".");
		selectors.push("."+compound);
		if (tag!==false)
		    selectors.push(tag+"."+compound);
		j++;}
	    i++;}
	return selectors;}
    SSC.possibleSelectors=possibleSelectors;

    function scandom(node,counts,all){
	var tag=node.tagName; var classname=node.className;
	// Ignore yourself
	if (classname.search(/\bsscapp\b/)>=0) return;
	classname=classname.replace(/\bssc\w+/g,"");
	// Split up classnames
	var classes=((classname)?(classname.split(/\s+/)):[]);
	// Generate applicable selectors
	var selectors=possibleSelectors(tag,classes);
	// Increase the counts for applicable selectors
	var k=0, klim=selectors.length;
	while (k<klim) {
	    var sel=selectors[k++];
	    if (counts.hasOwnProperty(sel)) counts[sel]++;
	    else {counts[sel]=1; all.push(sel);}}
	// Descend the DOM
	if (node.childNodes) {
	    var children=node.childNodes;
	    var c=0, clim=children.length; while (c<clim) {
		var child=children[c++];
		if (child.nodeType===1) scandom(child,counts,all);}}}

    function updateSelectors(counts,dropbox){
	if (!(counts)) counts=SSC.countSelectors(document.body);
	var all=counts._all; var options=[];
	if (dropbox) dropbox.innerHTML="";
	var i=0, lim=all.length; while (i<lim) {
	    var sel=all[i++]; var count=counts[sel];
	    var label=((count===1)?(" (one element)"):(" ("+count+" elements)"));
	    var option=make("OPTION",false,sel+label);
	    option.value=sel; options.push(option);
	    if (dropbox) dropbox.appendChild(option);}
	counts._options=options;
	return counts;}

    return updateSelectors;})();

SSC.getStyleInfo=(function(){
    function getRules(sel,results){
	var sheets=document.styleSheets; var i=0, n_sheets=sheets.length;
	var pat=new RegExp(sel.replace(".","\\.")+"\\b","gi");
	if (!(results)) results=[];
	while (i<n_sheets) {
	    var sheet=sheets[i++];
	    if (!(sheet.rules)) continue;
	    var rules=sheet.rules; var j=0, n_rules=rules.length;
	    while (j<n_rules) {
		var rule=rules[j++];
		if (rule.selectorText.search(pat)>=0)
		    results.push(rule.cssText);}}
	return results;}

    function getStyleInfo(selector){
	if (selector.indexOf('/')>=0)
	    selector=selector.slice(0,selector.indexOf('/'));
	var parsed=selector.split(".");
	var selectors=SSC.possibleSelectors(
	    ((parsed[0]!=="")&&(parsed[0])),parsed.slice(1));
	selectors.sort(function(x,y){return x.length-y.length;});
	var results=[];
	var i=0, lim=selectors.length;
	while (i<lim) getRules(selectors[i++],results);
	return results;}

    getStyleInfo.getRules=getRules;

    return getStyleInfo;})();

SSC.Templates.toolbar=
    "<span id='SSCTOOLBARBUTTONS'>"+
    "<button class='button showrules'>Rules</button>"+
    "<button title='Hide the toolbar' class='button hide'>Hide</button></span>\n"+
    "<div class='combobox'>"+
    "<input type='TEXT' id='SSCINPUT' NAME='SELECTOR' placeholder='a CSS selector'/>\n"+
    "<select id='SSCDROPBOX' class='dropbox'></select>"+
    "</div>"+
    "<span class='text' id='SSCMATCHPHRASE'>"+
    "<span id='SSCMATCHCOUNT'>some</span> matches, at #<span id='SSCMATCHINDEX'>#</span></span>"+
    "<div class='styleinfo' id='SSCSTYLEINFO'></div>";

(function(){
    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var hasClass=SSC.hasClass, addClass=SSC.addClass, dropClass=SSC.dropClass;
    var addListener=SSC.addListener, cancel=SSC.cancel, byID=SSC.byID;

    /* Using the URL hash as a selector */

    function selectHash() {
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	SSC.select(hash);}

    addListener(window,"hashchange",selectHash);

    function setupToolbar(){
	var toolbar=make("div","sscapp ssctoolbar",
			 fillin(SSC.Templates.toolbar,
				{imgroot: SSC.default_root}),
			 "SSCTOOLBAR");
	var input=toolbar.querySelector('input'); {
	    addListener(input,"keydown",sscinput_keydown);
	    addListener(input,"focus",sscinput_focus);
	    addListener(input,"blur",sscinput_blur);}
	var dropbox=toolbar.querySelector("SELECT"); {
	    addListener(dropbox,"change",selector_selected);
	    SSC.selectors=SSC.updateSelectors(false,dropbox);}
	var hide_button=toolbar.querySelector(".hide"); {
	    addListener(hide_button,"click",hideToolbar);}
	var tapzone=make("div",false,false,"SSCTAPZONE"); {
	    addListener(tapzone,"click",showToolbar);}
	var showrules=toolbar.querySelector(".showrules"); {
	    addListener(showrules,"click",toggleStyleInfo);}
	document.body.appendChild(toolbar);}

    function showToolbar(){addClass(document.body,"sscTOOLBAR");}
    function hideToolbar(){dropClass(document.body,"sscTOOLBAR");}
    SSC.showToolbar=showToolbar; SSC.hideToolbar=hideToolbar;

    function toggleStyleInfo(){
	if (hasClass("SSCTOOLBAR","showstyle"))
	    dropClass("SSCTOOLBAR","showstyle");
	else addClass("SSCTOOLBAR","showstyle");}

    function sscinput_focus(){
	sscinput_complete();
	addClass("SSCTOOLBAR","focused"); }
    function sscinput_blur(){dropClass("SSCTOOLBAR","focused");}

    function sscinput_keydown(evt){
 	evt=evt||event;
	var kc=evt.keyCode;
	var target=evt.target||evt.srcElement;
	if (kc===RETURN) {
	    var spec=target.value;
	    SSC.select(spec,true);
	    target.blur();}
	else {
	    setTimeout(sscinput_complete,50);}}
    var selector_complete_string=false;
    var selector_completions=false;
    function sscinput_complete(){
	var input=byID("SSCINPUT"), dropbox=byID("SSCDROPBOX");
	var prefix=selector_prefix(input.value);
	if (prefix===selector_complete_string) return;
	else selector_complete_string=prefix;
	var selectors=SSC.selectors||
	    (SSC.selectors=SSC.updateSelectors());
	var all=selectors._all, options=selectors._options;
	var frag=document.createDocumentFragment();
	var i=0, lim=options.length, matches=0;
	if (prefix.length===0) while (i<lim) {
	    frag.appendChild(options[i++]);}
	else while (i<lim) {
	    var sel=all[i];
	    if ((prefix[0]==='.')?
		(sel.search(prefix)>=0):
		(sel.search(prefix)===0)) {
		frag.appendChild(options[i]); matches++;}
	    i++;}
	dropbox.innerHTML="";
	if (matches>7) dropbox.size=7; else dropbox.size=matches+1;
	dropbox.appendChild(frag);}

    function selector_selected(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var input=byID("SSCINPUT");
	if (target.value) {
	    var text=input.value.trim();
	    var comma=text.lastIndexOf(',');
	    if (comma<0) SSC.select(target.value);
	    else SSC.select(text.slice(0,comma)+','+target.value);
	    input.blur();}}
    function selector_prefix(string){
	string=string.trim();
	var comma=string.lastIndexOf(',');
	if (comma<0) return string;
	else return string.slice(comma+1);}

    /* Keyboard interaction */

    var CKEY=0x43;
    var TAB=0x09;
    var RETURN=0x0d;
    var SPACE=0x0a;
    var ESCAPE=0x1b;
    var PLUS=187;
    var MINUS=189;

    var usekeys=[TAB,CKEY,ESCAPE,RETURN];

    function window_keydown(evt){
	evt=evt||event;
	var key=evt.keyCode;
	var target=evt.target||evt.srcElement;
	if (usekeys.indexOf(key)<0) return;
	if ((evt.ctrlKey)||(evt.metaKey)||(evt.altKey)||(evt.altGraphKey))
	    return;
	if ((target)&&
	    ((target.tagName==='INPUT')||(target.tagName==='TEXTAREA')))
	    return;
	if (key===ESCAPE) {
	    var changed=false;
	    // Close any windows which are up
	    dropClass("SSCTOOLBAR","showstyle");
	    dropClass(document.body,"sscTOOLBAR");
	    if (!(SSC.isenabled())) SSC.enable();
	    else {
		if (SSC.focus()) {SSC.focus(false); changed=true;}
		if (!(changed)) {
		    SSC.select(false);
		    SSC.disable();}}}
	else if (key===TAB) {
	    var index=SSC.focusIndex();
	    var max=SSC.selected().length-1;
	    if (max<0) {}
	    else if (typeof index === "number") {
		if (evt.shiftKey) {
		    if (index<=0) {} else SSC.focus(index-1);}
		else if (index>=max) {}
		else SSC.focus(index+1);}
	    else if (evt.shiftKey)
		SSC.focus(max);
	    else SSC.focus(0);
	    cancel(evt);}
	else if (key===CKEY) {
	    if (evt.shiftKey) showCloud();
	    else if (hasClass(document.body,"sscSHOWCLOUD"))
		hideCloud();
	    else showCloud();}
	else if (key===RETURN) {
	    addClass(document.body,"sscTOOLBAR");
	    if (evt.shiftKey) {
		var input=byID("SSCINPUT");
		if (input) input.focus();}}
	else return;
	cancel(evt);}
    SSC.window_keydown=window_keydown;

    function window_click(evt){
	evt=evt||event;
	var selection=window.getSelection();
	if ((selection)&&
	    ((selection.anchorNode!==selection.focusNode)||
	     (selection.anchorOffset!==selection.focusOffset)))
	    return;
	var target=evt.target||evt.srcElement;
	var scan=target;
	while (scan) {
	    if (hasClass(scan,"sscapp")) return;
	    else if ((target.tagName==="A")&&(target.href)) return;
	    else if (scan===document.body) break;
	    else scan=scan.parentNode;}
	if (!(scan)) return; else scan=target;
	while (scan.nodeType!==1) scan=scan.parentNode;
	if (!(scan)) return;
	if ((evt.shiftKey)&&(scan.parentNode)) scan=scan.parentNode;
	if (hasClass(scan,"sscSELECTED")) {
	    SSC.focus(scan);
	    return;}
	var spec=scan.tagName;
	if (scan.className) {
	    var norm=(scan.className.replace(/\bssc\w+\b/g,"")).trim();
	    var classes=norm.split(/\s+/);
	    if (classes.length) spec=spec+"."+classes.join(".");}
	SSC.select(spec,true);}
    SSC.window_click=window_click;
    
    // Referencing SSC.nodeclick let's it be overriden by apps using SSC
    addListener(window,"load",function(){
	setupToolbar();
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	if (SSC.hasOwnProperty("onclick"))
	    addListener(window,"click",SSC.onclick);
	else addListener(window,"click",window_click);
    	if (SSC.hasOwnProperty("onkey"))
	    addListener(window,"keydown",SSC.onkey);
	else addListener(window,"keydown",window_keydown);
	if ((hash)&&($(hash).length)) {SSC.enable(); SSC.select(hash);}
	if (SSC.selected().length)
	    setTimeout(function(){
		SSC.focus((SSC.selected())[0]);},
		       200);
	if (SSC.onload) {
	    var loadfn=SSC.onload; SSC.onload=false;
	    setTimeout(loadfn,50);};});})();

