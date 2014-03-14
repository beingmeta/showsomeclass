var SSC=(function(){
    /* Utilities for manipulating classes */
    var whitespace_pat=/(\s)+/;
    var trimspace_pat=/^(\s)+|(\s)+$/;
    var classpats={};
    /* Returns a Regex for matching a delimited class name */
    function classPat(name){
	var rx=new RegExp("\\b"+name+"\\b","g");
	classpats[name]=rx;
	return rx;}
    function addClass(elt,classname){
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
	if (Array.isArray(elt)) {
	    var i=0, lim=elt.length;
	    while (i<lim) dropClass(elt[i++],classname);}
	else {
	    var current=elt.className, pat=classPat(classname);
	    if (!(current)) elt.className=classname;
	    else if (current===classname) elt.className="";
	    else if (current.search(pat)>=0)
		elt.className=((current.replace(pat,"")).
			       replace(whitespace_pat," ").
			       replace(trimspace_pat,""));
	    else {}}}
    function hasClass(elt,classname){
	var current=elt.className, pat=classPat(classname);
	if (!(current)) return false;
	else if (current===classname) return true;
	else if (current.search(pat)>=0) return true;
	else return false;}

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
    function simplespec(spec){return spec.replace(/\/[^\/]+\//,"");}
    
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
	while (document.getElementById(newid))
	    newid="sscTMP"+(tmpid_count++);
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
    
    function isCompact() {
	return hasClass(document.body,"cxSSCOMPACT");}
    function setCompact(flag) {
	if (typeof flag === "undefined") {
	    if (isCompact())
		dropClass(document.body,"cxSSCOMPACT");
	    else addClass(document.body,"cxSSCOMPACT");}
	else if (flag) addClass(document.body,"cxSSCOMPACT");
	else dropClass(document.body,"cxSSCOMPACT");}

    function isReduced() {
	return hasClass(document.body,"cxSSCREDUCED");}
    function setReduced(flag) {
	if (typeof flag === "undefined") {
	    if (isReduced())
		dropClass(document.body,"cxSSCREDUCED");
	    else addClass(document.body,"cxSSCREDUCED");}
	else if (flag) addClass(document.body,"cxSSCREDUCED");
	else dropClass(document.body,"cxSSCREDUCED");}

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
	dropClass(document.body,"cxSSC");
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
    function select(spec,force){
	if (!(spec)) clear();
	else if ((spec===selector)&&(!(force))) {
	    if (SSC.box) SSC.UI.setBox(false);
	    return;}
	else clear();
	if (!(spec)) return;
	var nodes=$(spec);
	var i=0, lim=nodes.length;
	if (lim===0) {
	    alert("There are no matches for "+spec);
	    return;}
	while (i<lim) show(nodes[i++]);
	document.title="("+spec+") "+real_title;
	if (SSC.box) SSC.UI.setBox(false);
	if (SSC.display) SSC.display.innerHTML=spec;
	selector=spec;
	selected=nodes;}

    /* THE FOCUS is used for moving back and forth through the
       selected nodes. */
    function setFocus(node,index){
	if ((node)&&(typeof index!=="number"))
	    index=selected.indexOf(node);
	if (focus) dropClass(focus,"sscFOCUS");
	if (node) addClass(node,"sscFOCUS");
	focus=node; focus_index=index;
	if (!(focus)) {}
	else if (focus.scrollIntoViewIfNeeded)
	    focus.scrollIntoViewIfNeeded();
	else if (focus.scrollIntoView)
	    focus.scrollIntoView();
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
    
    /* Adjusting nodes to match a new selector.

       Note that we don't do attributes yet nor do we have the ability
       to just add or delete particular classes. */

    function adjustNode(node,spec){
	var parsed=(spec.trim()).split(/([.+-])/);
	var tag=parsed[0], classname=parsed.slice(1).join(" ").trim();
	if ((tag)&&(node.tagName!==tag)) {
	    var fresh=document.createElement(tag);
	    if (!(classname)) fresh.className=node.className;
	    else fresh.className=classname;
	    if (node.id) fresh.id=node.id;
	    if (node.title) fresh.title=node.title;
	    if ((node.style)&&(node.style.cssText))
		fresh.setAttribute("style",node.style.cssText);
	    var attribs=node.attributes;
	    var i=0, n_attribs=attribs.length;
	    while (i<n_attribs) {
		var attrib=attribs[i++];
		if ((['id','class','title','style'].indexOf(attrib.name.toLowerCase()))<0)
		    fresh.setAttribute(attrib.name,attrib.value);}
	    var children=copy(node.childNodes);
	    var j=0, n_children=children.length;
	    while (j<n_children) fresh.appendChild(children[j++]);
	    node.parentNode.replaceChild(fresh,node);
	    return fresh;}
	if (classname) node.className=classname;
	else node.className="";
	return node;}

    /* Finally, return the object */

    return {
	isenabled: isenabled,enable: enable,disable: disable,toggle: toggle,
	select: select, clear: clear, refresh: function refresh(){select(selector,true);},
	setFocus: setFocus, focus: focusfn, getFocus: function(){return focus;},
	$: $, addClass: addClass, dropClass: dropClass,adjustNode: adjustNode,
	hasClass: hasClass, hasText: hasText, simplespec: simplespec, getID: getID,
	selector: function getselector(){ return selector;},
	selected: function getselected(){ return selected;},
	focusIndex: function focusIndex(){ return focus_index;},
	isCompact: isCompact, setCompact: setCompact,
	isReduced: isReduced, setReduced: setReduced,
	preferred: ["p","h1","h2","h3","h4","h5"],
	Text: {},box: false,editnode: false};})();


SSC.UI=(function(){
    var $=SSC.$;
    var adjustNode=SSC.adjustNode;

    function addListener(node,evtype,handler){
	if (node.addEventListener)
	    node.addEventListener(evtype,handler,false);
	else if (node.attachEvent)
	    node.attachEvent("on"+evtype,handler);
	else alert("Please switch to a modern browser");}
    function cancel(evt){
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;}

    function inapp(node){
	var box=SSC.box, body=document.body;;
	var scan=node;
	while (scan) {
	    if (scan===box) return true;
	    else if (scan===body) return false;
	    else scan=scan.parentNode;}
	return true;}

    /* Using the URL hash as a selector */

    function selectHash() {
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	SSC.select(hash);}

    function selectHashOnLoad() {
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	if ((hash)&&($(hash).length)) {
	    SSC.enable(); SSC.select(hash);}}

    addListener(window,"load",selectHashOnLoad);
    addListener(window,"hashchange",selectHash);

    /* The `box` is the interaction window. */

    function setBox(box){
	if (SSC.box) closebox();
	if (box) document.body.appendChild(box);
	SSC.box=box;}
    
    function closebox(){
	if (SSC.box) {
	    if (SSC.box.parentNode)
		SSC.box.parentNode.removeChild(SSC.box);
	    SSC.box=false;}
	SSC.editnode=false;}

    function setupSelectorDisplay(){
	var div=document.createElement("div");
	var sel=SSC.selector();
	div.className="sscSELECTOR";
	div.id="SSCDISPLAY";
	if (sel) div.appendChild(document.createTextNode(sel));
	SSC.display=div;
	document.body.appendChild(div);}
    addListener(window,"load",setupSelectorDisplay);

    /* Opening select and edit boxes */
    
    function openSearchBox(seltext){
	if (!(seltext)) seltext=SSC.selector()||"";
	var selectbox=document.createElement("DIV");
	selectbox.className="sscselect sscapp";
	selectbox.innerHTML=SSC.Text.selectbox.replace(/{{spec}}/g,seltext);
	selectbox.id="SSCSELECT";
	setBox(selectbox);
	var input=document.getElementById("SSCSELECTINPUT");
	input.focus();}

    function openEditBox(seltext){
	if (!(seltext)) seltext=SSC.selector();
	var editbox=document.createElement("DIV");
	editbox.className="sscsedit sscapp";
	editbox.innerHTML=(SSC.Text.editbox.replace(/{{spec}}/g,seltext)).
	    replace(/{{simplespec}}/g,SSC.simplespec(seltext)).
	    replace(/{{count}}/g,""+(SSC.selected().length));
	editbox.id="SSCEDIT";
	if ((SSC.preferred)&&(SSC.preferred.length)) {
	    var select=document.createElement("SELECT");
	    var preferred=SSC.preferred;
	    select.id="SSCEDITSELECT"; select.className="centered";
	    addListener(select,"change",editselect);
	    var headopt=document.createElement("OPTION"); headopt.value="";
	    headopt.appendChild(document.createTextNode("or select:"));
	    select.appendChild(headopt);
	    var i=0, lim=preferred.length; while (i<lim) {
		var option=document.createElement("OPTION");
		option.value=preferred[i];
		option.appendChild(document.createTextNode(preferred[i]));
		select.appendChild(option);
		i++;}
	    editbox.appendChild(select);}
	setBox(editbox);
	var input=document.getElementById("SSCEDITINPUT");
	input.focus();}

    function setupEditNode(box,node){
	var style=node.style.cssText;
	var classes=((node.className)?((node.className.trim()).split(/\s+/)):([]));
	var tagname=node.tagName, spec=tagname;
	if (classes.length) spec=spec+"."+classes.join(".");
	spec=spec.replace(/\.ssc[^.]+/,"");
	var specinput=box.querySelector(".specinput"); specinput.value=spec;
	var styleinput=box.querySelector(".styleinput"); styleinput.value=style;
	if (!((style)&&(style.length))) styleinput.style.display='none';
	var selector_span=box.querySelector(".selectorlinks");
	selector_span.innerHTML=""; SSC.editnode=node;
	var i=0, lim=classes.length;
	while (i<lim) {
	    var classname=classes[i++];
	    if (classname.search("ssc")===0) continue;
	    var classmatches=document.querySelectorAll("."+classname);
	    var tagmatches=document.querySelectorAll(tagname+"."+classname);
	    if (tagmatches.length) {
		var size=100+(Math.floor(Math.log(tagmatches.length))*10);
		var tagclasslink=document.createElement("A");
		tagclasslink.href="#"+tagname+"."+classname;
		tagclasslink.style="font-size: "+size+"%;";
		tagclasslink.appendChild(document.createTextNode(tagname+"."+classname));
		tagclasslink.title=tagmatches.length+" matches";
		selector_span.appendChild(tagclasslink);
		selector_span.appendChild(document.createTextNode("("+tagmatches.length+" elements) "));}
	    if ((classmatches.length)&&(classmatches.length>tagmatches.length)) {
		var size=100+(Math.floor(Math.log(classmatches.length))*10);
		var classlink=document.createElement("A");
		classlink.href="#."+classname;
		classlink.style="font-size: "+size+"%;";
		classlink.appendChild(document.createTextNode("."+classname));
		classlink.title=classmatches.length+" matches";
		if (SSC.selector()===("."+classname)) classlink.disabled=true;
		selector_span.appendChild(classlink);
		selector_span.appendChild(document.createTextNode("("+classmatches.length+" elements) "));}}}
    
    function openEditNodeBox(node){
	var editbox=document.createElement("DIV");
	editbox.innerHTML=SSC.Text.editnode;
	editbox.className="sscseditnode sscapp";
	setupEditNode(editbox,node);
	var specinput=editbox.querySelector('.specinput');
	addListener(specinput,"keydown",function(evt){
	    var kc=evt.keyCode;
	    if (kc===RETURN) {
		var fresh=adjustNode(node,specinput.value);
		setupEditNode(editbox,fresh);
		cancel(evt);}});
	var links=editbox.querySelector('.selectorlinks');
	/*
	if (links) addListener(links,"click",function(){
	    setTimeout(function(){closebox();},100);}); */
	editbox.id="SSCEDITNODE";
	setBox(editbox);
	var input=editbox.querySelector(".specinput");
	if (input) input.focus();}

    function setupSelectNode(editbox,node){
	var options=[], scan=node, getID=SSC.getID;
	while ((scan)&&(scan.nodeType===1)&&(scan!==document.body)) {
	    var id=getID(scan);
	    var text=scan.tagName;
	    if ((scan.className)&&(scan.className.length)) {
		var classname=scan.className;
		text=text+"."+classname.replace(/\s+/g,".");}
	    if (id.search("sscTMP")!==0) text=text+"#"+id;
	    var option=document.createElement("OPTION");
	    option.value=id; option.appendChild(document.createTextNode(text));
	    if (scan===node) option.selected=true;
	    options.push(option);
	    scan=scan.parentNode;}
	var selectbox=editbox.querySelector("select");
	var i=0, lim=options.length;
	while (i<lim) {selectbox.appendChild(options[i++]);}
	addListener(selectbox,"change",function(){
	    setupEditNode(editbox,document.getElementById(selectbox.value));});}

    
    function editNodeRemove(){
	var node=SSC.editnode;
	if ((node)&&(node.parentNode)) {
	    node.parentNode.removeChild(node);}
	closebox();}
    function editNodeUnwrap(){
	var node=SSC.editnode;
	if ((node)&&(node.parentNode)) {
	    var parent=node.parentNode;
	    var children=node.childNodes;
	    var frag=document.createDocumentFragment();
	    var move=[]; var i=0, lim=children.length;
	    while (i<lim) move.push(children[i++]);
	    i=0; while (i<lim) frag.appendChild(move[i++]);
	    parent.insertBefore(frag,node);
	    parent.removeChild(node);}
	closebox();}
    
    /* Keyboard interaction */

    var TAB=0x09;
    var CKEY=0x43;
    var RKEY=0x52;
    var SKEY=0x53;
    var RETURN=0x0d;
    var ESCAPE=0x1b;

    var usekeys=[TAB,RKEY,CKEY,SKEY,ESCAPE,RETURN];

    function ssckeydown(evt){
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
	    if (SSC.box) {
		if (SSC.box.parentNode)
		    SSC.box.parentNode.removeChild(SSC.box);
		SSC.box=false;}
	    else if (!(SSC.isenabled())) SSC.enable();
	    else {
		if (SSC.isReduced()) {SSC.setReduced(false); changed=true;}
		if (SSC.isCompact()) {SSC.setCompact(false); changed=true;}
		if (SSC.focus()) {SSC.focus(false); changed=true;}
		if (!(changed)) {
		    SSC.select(false);
		    SSC.disable();}}}
	else if (key===TAB) {
	    var index=SSC.focusIndex();
	    var max=SSC.selected().length-1;
	    if (max<0) alert("No matches!");
	    else if (typeof index === "number") {
		if (evt.shiftKey) {
		    if (index<=0) alert("No more matches");
		    else SSC.focus(index-1);}
		else if (index>=max)
		    alert("No more matches");
		else SSC.focus(index+1);}
	    else if (evt.shiftKey)
		SSC.focus(max);
	    else SSC.focus(0);
	    cancel(evt);}
	else if (key===CKEY) {
	    if (evt.shiftKey)
		SSC.setCompact(true);
	    else SSC.setCompact();}
	else if (key===RKEY) {
	    if (evt.shiftKey)
		SSC.setReduced(true);
	    else SSC.setReduced();}
	else if (key===RETURN) {
	    if (evt.shiftKey) {
		var seltext=SSC.selector();
		if (!(seltext)) openSearchBox(false);
		else openEditBox(seltext);}
	    else openSearchBox(seltext);}
	else return;
	cancel(evt);}

    // Should we put this inside an onload handler?
    addListener(window,"keydown",ssckeydown);
    
    /* The handler for keypresses in the select dialog */

    function selectpress(evt){
	evt=evt||event;
	var ch=evt.charCode;
	if (ch===RETURN) {
	    if (evt.shiftKey) {}
	    else {
		var target=evt.target||evt.srcElement;
		if (!(target)) {cancel(evt); return;}
		if (target.value) {
		    var spec=target.value;
		    if (spec.search(/\S/)<0) {
			/* Empty string, just close */
			closebox();}
		    else {
			var found=[], error=false;
			try {found=$(spec);}
			catch (ex) {error=true;}
			if (error) {
			    var errmsg=document.getElementById("SSCSELECTMESSAGE");
			    errmsg.className="error";
			    errmsg.innerHTML="There was an error processing your selector";}
			else if (found.length===0) {
			    var failmsg=document.getElementById("SSCSELECTMESSAGE");
			    failmsg.className="fail";
			    failmsg.innerHTML="No content matched your selector";}
			else {
			    SSC.select(spec);
			    window.location.hash="#"+spec;
			    closebox();}}}}}}

    /* The handler for keypresses in the edit dialog */

    function editpress(evt){
	evt=evt||event;
	var ch=evt.charCode;
	if (ch===RETURN) {
	    var selected=SSC.selected(), i=0, n=selected.length;
	    var target=evt.target||evt.srcElement;
	    if (!(target)) {cancel(evt); return;}
	    if (target.value) {
		var spec=target.value;
		if (spec.search(/\S/)<0) {
		    if (window.confirm("Really delete all "+selected.length+" nodes?")) {
			while (i<n) {
			    if (selected[i].parentNode) 
				selected[i].parentNode.removeChild(selected[i]);
			    i++;}
			closebox();
			alert("Deleted all "+selected.length+" nodes");}
		    else cancel(evt);}
		else {
		    var adjustNode=SSC.adjustNode;
		    while (i<n) adjustNode(selected[i++],spec);
		    SSC.select(spec); location.hash="#"+spec;
		    closebox();
		    alert("All "+selected.length+" nodes have been updated.");}}}}
    function editselect(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var spec=target.value;
	if (!(spec)) return;
	var adjustNode=SSC.adjustNode;
	var selected=SSC.selected(), i=0, n=selected.length;
	while (i<n) adjustNode(selected[i++],spec);
	SSC.select(spec); location.hash="#"+spec;
	closebox();
	alert("All "+selected.length+" nodes have been updated.");}

    function nodeclick(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	if (target.tagName==="A") return;
	if (inapp(target)) {cancel(evt); return;}
	while (target.nodeType!==1) target=target.parentNode;
	openEditNodeBox(target);}
    
    addListener(window,"click",nodeclick);

    return {
	selectpress: selectpress,editpress: editpress,editselect: editselect,
	setBox: setBox,closebox: closebox};})();

SSC.Text.selectbox=
    "<button class='close' onclick='SSC.UI.closebox();'>close</button>\n"+
    "<input type='TEXT' NAME='SPEC' VALUE='{{spec}}' id='SSCSELECTINPUT' onkeypress='SSC.UI.selectpress(event);'/>\n"+
    "<p id='SSCSELECTMESSAGE'></p>"+
    "<p class='sschelp'>Enter a new CSS selector, e.g. <tt>P.class1</tt> to see matching elements.</p>\n"+
    "<p class='sschelp'>Include a regular expression in slashes to match node content.</p>\n";

SSC.Text.editbox=
    "<button class='close' onclick='SSC.UI.closebox();'>close</button>\n"+
    "<div class='selector'>{{spec}}</div>\n"+
    "<p class='instruction'>Change all {{count}} occurrences to</p>"+
    "<input type='TEXT' NAME='SPEC' VALUE='{{simplespec}}' id='SSCEDITINPUT' onkeypress='SSC.UI.editpress(event);'/>\n"+
    "<p id='SSCEDITMESSAGE'></p>\n";

SSC.Text.infobox=
    "<div class='sschead'><span class='count'>{{count}}</span>{{spec}}</div>\n"+
    "<div class='sscedit'>\n<span class='label'>Edit</span>\n"+
    "<button class='sscdoit' onclick='SSC.doedit();'>OK</button>\n"+
    "<input TYPE='TEXT' NAME='NEWSPEC' VALUE='{{spec}}'/>\n"+
    "</div>\n";

SSC.Text.editnode=
    "<button class='close' onclick='SSC.UI.closebox();'>close</button>\n"+
    "<input TYPE='TEXT' NAME='SPEC' class='specinput'/>\n"+
    "<input TYPE='TEXT' NAME='STYLE' class='styleinput'/>\n"+
    "<div class='selectors'><span class='label'>Selectors:</span> <span class='selectorlinks'></span></div>\n"+
    "<div class='buttons'>\n<button onclick='SSC.UI.editNodeDelete();'>Delete</button>\n"+
    "<button onclick=SSC.UI.editNodeUnwrap();'>Unwrap</button>\n</div>\n";

