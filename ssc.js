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
	    else if (current===classname) elt.className=null;
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

    /* Making DOM nodes */
    
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
    function text(input){
	if (typeof input === "string")
	    return document.createTextNode(input);
	else return document.createTextNode(fillin(input));}

    function fillin(data,text){
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

    /* Adding listeners */

    function addListener(node,evtype,handler){
	if (node.addEventListener)
	    node.addEventListener(evtype,handler,false);
	else if (node.attachEvent)
	    node.attachEvent("on"+evtype,handler);
	else alert("Please switch to a modern browser");}

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
	else if ((spec===selector)&&(!(force))) return;
	else clear();
	if (!(spec)) return;
	var nodes=$(spec);
	var i=0, lim=nodes.length;
	if (lim===0) {
	    SSC.Message("There are no matches for <tt>{{spec}}</tt>",{spec: spec});
	    return;}
	var first=nodes[0];
	if (!(first)) {}
	else if (first.scrollIntoViewIfNeeded)
	    first.scrollIntoViewIfNeeded();
	else if (first.scrollIntoView)
	    first.scrollIntoView();
	else {}
	while (i<lim) show(nodes[i++]);
	document.title="("+nodes.length+"x"+spec+") "+real_title;
	dropClass(document.body,"sscSHOWCLOUD");
	var input=document.getElementById("SSCINPUT");
	if (input) {
	    input.value=spec;
	    input.title="matches "+nodes.length+" elements";}
	if ((!(SSC.quiet))&&(SSC.Message))
	    SSC.Message("The selector<br/><tt>{{spec}}</tt><br/>matches <strong>{{count}}</strong> elements"+
			"<p class='sschelp'><kbd>Tab</kbd> to scan through them, <kbd>Shift-Tab</kbd> to go back.</p>",
			{spec: spec, count: nodes.length});
	selector=spec;
	selected=nodes;
    	window.location.hash="#"+spec;}

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

    /* Finally, return the object */

    return {
	isenabled: isenabled,enable: enable,disable: disable,toggle: toggle,
	select: select, clear: clear, refresh: function refresh(){select(selector,true);},
	setFocus: setFocus, focus: focusfn, getFocus: function(){return focus;},
	$: $, addClass: addClass, dropClass: dropClass,
	hasClass: hasClass, hasText: hasText, simplespec: simplespec, getID: getID,
	fillin: fillin, text: text, make: make, addListener: addListener,
	selector: function getselector(){ return selector;},
	selected: function getselected(){ return selected;},
	focusIndex: function focusIndex(){ return focus_index;},
	isCompact: isCompact, setCompact: setCompact,
	isReduced: isReduced, setReduced: setReduced,
	preferred: ["p","h1","h2","h3","h4","h5"],
	Text: {},box: false,editnode: false};})();

SSC.updateCloud=(function(){

    var make=SSC.make, text=SSC.text, fillin=SSC.fillin;
    var addListener=SSC.addListener;

    function scoreSelectors(root){
	var scores={};
	if (!(root)) root=document.body;
	scandom(root,scores);
	return scores;}

    function scandom(node,scores){
	var tag=node.tagName; var selectors=[tag];
	var classname=node.className;
	// Ignore yourself
	if (classname.search(/\bsscapp\b/)>=0) return;
	// Generate applicable selectors
	var classes=((classname)?(classname.split(/\s+/)):[]);
	classes.sort();
	var i=0, lim=classes.length;
	while (i<lim) {
	    selectors.push("."+classes[i]);
	    selectors.push(tag+"."+classes[i]);
	    var j=i+2;
	    while (j<lim) {
		var compound=classes.slice(i,j).join(".");
		selectors.push("."+compound);
		selectors.push(tag+"."+compound);
		j++;}
	    i++;}
	// Increase the scores for applicable selectors
	var k=0, klim=selectors.length;
	while (k<klim) {
	    var sel=selectors[k++];
	    if (scores.hasOwnProperty(sel)) scores[sel]++;
	    else scores[sel]=1;}
	// Descend the DOM
	if (node.childNodes) {
	    var children=node.childNodes;
	    var c=0, clim=children.length; while (c<clim) {
		var child=children[c++];
		if (child.nodeType===1) scandom(child,scores);}}}

    function initCloud(){
	var cloud=make("div","sscapp sscloud","","SSCSELECTORCLOUD");
	var links=make("div","links","","SSCSELECTORSPANS");
	var button=make("div","button close","Close");
	cloud.appendChild(button); cloud.appendChild(links);
	addListener(cloud,"click",selector_clicked);
	document.body.appendChild(cloud);
	SSC.cloud=cloud;}

    function selector_clicked(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	while (target.nodeType!==1) target=target.parentNode;
	if (target.className==="selector") {
	    if (evt.shiftKey) {
		var cur=SSC.getSelector();
		select(cur+","+target.innerHTML);}
	    else select(target.innerHTML);}}

    function updateCloud(){
	if (!(SSC.cloud)) initCloud();
	var cloud=document.getElementById("SSCSELECTORCLOUD");
	var links=document.getElementById("SSCSELECTORSPANS");
	var scores=scoreSelectors(document.body);
	var all=[]; for (var sel in scores) {
	    if (scores.hasOwnProperty(sel)) all.push(sel);}
	all.sort(function(sel1,sel2){
	    if (sel1.length===sel2.length) {
		if (sel1<sel2) return -1; else return 1;}
	    else return sel1.length-sel2.length;});
	var cloudmap={};
	SSC.cloudmap=cloudmap;
	links.innerHTML="";
	var i=0, lim=all.length;
	while (i<lim) {
	    var sel=all[i++], score=scores[sel];
	    var span=make("span","selector",sel);
	    span.title=score+" matching elements";
	    span.style.fontSize=(100+(5*(Math.ceil(Math.log(score)))))+"%";
	    links.appendChild(span); cloudmap[sel]=span;
	    links.appendChild(text(" "));}
	SSC.cloudmap=cloudmap;
	SSC.selectors=all;
	sizeCloud();}

    function sizeCloud(){
	if (!(SSC.cloud)) updateCloud();
	var cloud=document.getElementById("SSCSELECTORCLOUD");
	var spans=document.getElementById("SSCSELECTORSPANS");
	cloud.style.setProperty('opacity',0.0,'!important');
	cloud.style.setProperty('display','block','!important');
	cloud.style.fontSize='100%';
	var ih=links.offsetHeight, oh=cloud.offsetHeight;
	var fs=100, delta=5;
	if (ih>oh) while (ih>oh) {
	    fs=fs-delta; spans.style.fontSize=(fs)+"%";
	    ih=spans.offsetHeight; oh=cloud.offsetHeight;}
	else {
	    while (oh>ih) {
		fs=fs+delta; links.style.fontSize=(fs)+"%";
		ih=spans.offsetHeight; oh=cloud.offsetHeight;}
	    fs=fs-delta; spans.style.fontSize=(fs)+"%";}
	cloud.style.removeProperty('opacity',0.0,'!important');
	cloud.style.removeProperty('display','block','!important');}
    
    return updateCloud;})();

SSC.Message=(function(){

    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var addListener=SSC.addListener;

    var msg_delay=false;
    var msg_delta=0.025;
    var msg_fader=false;
    var msg_fade_interval=100;
    var msg_opacity=1.0;

    function close(){
	var msg=document.getElementById("SSCMESSAGE");
	if (msg_delay) clearTimeout(msg_delay);
	if (msg_fader) clearInterval(msg_fader);
	if (msg) msg.parentNode.removeChild(msg);}

    function keep(){
	var msg=document.getElementById("SSCMESSAGE");
	if (msg_delay) {clearTimeout(msg_delay); msg_delay=false;}
	if (msg_fader) {clearInterval(msg_fader); msg_fader=false;}
	msg_opacity=Message.opts.init_opacity||0.9;
	msg.style.setProperty('opacity',msg_opacity,'!important');
	msg.className=msg.className+" keep";}

    function Message(text,data,opts){
	if (typeof text === "string")  {
	    if (data) text=fillin(text,data);}
	if (typeof opts === "number") {
	    // Assume it's seconds, convert to msecs
	    if (opts<100) opts=opts*1000;
	    // Divide the delay between wait and finale
	    opts={delay: opts/2,finale: opts/2};}
	else if (!(opts)) opts={};
	else if ((opts.delay===false)&&(!(opts.finale))) opts.keep=true;
	else if ((opts.delay)&&(!(opts.hasOwnProperty('finale')))) {
	    // If we just have a delay, and no finale, divide the delay
	    var d=opts.delay;
	    // Assume it's seconds, convert to msecs
	    if (d<100) d=d*1000;
	    opts.delay=d/2; opts.finale=d/2;}
	else {
	    if ((opts.delay)&&(opts.delay<100)) opts.delay=opts.delay*1000;
	    if ((opts.finale)&&(opts.finale<100)) opts.finale=opts.finale*1000;}
	var box=make("div","sscdialog sscapp"); {
	    if (!((opts.modal)&&(opts.choices)&&(opts.choices.length))) {
		var close_button=make("DIV","close button","Close"); {
		    addListener(close_button,"click",close);
		    box.appendChild(close_button);}
		var keep_button=make("DIV","keep button","Keep"); {
		    addListener(keep_button,"click",keep);
		    box.appendChild(keep_button);}}}
	if (opts.title) {
	    var title_text=opts.title;
	    var title=make("div","title",title_text);
	    box.appendChild(title);}
	if (typeof text === "string") {
	    var frag=document.createElement("div"); frag.innerHTML=text;
	    var children=frag.childNodes; var toadd=[];
	    var k=0, klim=children.length;
	    while (k<klim) toadd.push(children[k++]);
	    k=0; while (k<klim) box.appendChild(toadd[k++]);}
	else box.appendChild(text);
	if ((opts.choices)&&(opts.choices.length)) {
	    var choices=opts.choices, buttons=[];
	    var i=0, lim=choices.length; while (i<lim) {
		var choice=choices[i++];
		var button=document.createElement("BUTTON");
		if (typeof choice === "string") 
		    choice={label: choice, value: choice};
		if (choice.classname) button.className=choice.classname;
		button.appendChild(document.createTextNode(
		    (((choice.label)&&(choice.data))?(fillin(choice.label,choice.data)):(choice.label))));
		button.value=choice.value;
		button.name=choice.name||choice.label;
		if (button.handler)
		    addListener(button,"click",button.handler);
		else addListener(button,"click",choice_button_handler);
		buttons.push(button);}
	    var container=document.createElement("DIV"); {
		var j=0; container.className="choices"; 
		while (j<lim) {
		    container.appendChild(buttons[j++]);
		    container.appendChild(document.createTextNode(" "));}}
	    box.appendChild(choices);}
	box.id="SSCMESSAGE";
	document.body.appendChild(box);
	msg_opacity=opts.init_opacity||Message.opts.init_opacity||0.9;
	box.style.setProperty('opacity',msg_opacity,'!important');
	if (opts.keep) box.className=box.className+" keep";
	// We do this "old school" with an interval, rather than using
	//  CSS transitions, because the selective display CSS uses
	//  !important opacity definitions which get in the way of the
	//  transitions.
	if ((!(opts.modal))&&(!(opts.keep))) {
	    var delay=opts.delay||Message.opts.delay||3000;
	    var finale=((opts.hasOwnProperty('finale'))?(opts.finale):
			(Message.opts.hasOwnProperty('finale'))?(Message.opts.finale):			
			3000);
	    var interval=((opts.fade_interval)||(Message.opts.fade_interval)||100);
	    var n_steps=Math.ceil((finale)&&(finale/interval));
	    var delta=((finale)&&(msg_opacity/n_steps));
	    if (delta) {
		msg_delta=delta;
		msg_fade_interval=interval;
		msg_delay=setTimeout(startfinale,delay);}
	    else msg_delay=setTimeout(close,delay);}
	return box;}

    function startfinale(){
	if (msg_fader) close();
	if (msg_delay) {clearTimeout(msg_delay); msg_delay=false;}
	msg_fader=setInterval(fademessage,msg_fade_interval);}

    function fademessage(){
	var delta=msg_delta;
	if (!(delta)) {close(); return;}
	if (!(msg_fader)) {close(); return;}
	var msg=document.getElementById("SSCMESSAGE");
	if (!(msg)) close();
	else if (msg_opacity<=0) close();
	else {
	    msg_opacity=msg_opacity-delta;
	    msg.style.setProperty('opacity',msg_opacity,'!important');}}

    Message.close=close; Message.keep=keep;
    Message.opts={};

    return Message;})();

SSC.UI=(function(){
    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var hasClass=SSC.hasClass, addClass=SSC.addClass, dropClass=SSC.dropClass;
    var addListener=SSC.addListener;

    function cancel(evt){
	if (evt.preventDefault) evt.preventDefault();
	else evt.returnValue=false;
	evt.cancelBubble=true;}

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

    var toolbar_text=
	"<button title='See all selectors' class='right' onclick='SSC.toggleCloud();'>A</button>\n"+
	"<button title='Toggle reduced view' class='left' onclick='SSC.setReduced();'>R</button>\n"+
	"<button title='Toggle compact view' class='left' onclick='SSC.setCompact();'>C</button>\n";

    function setupToolbar(){
	var input=make("input",false,"","SSCINPUT");
	var toolbar=make("div","sscapp ssctoolbar",toolbar_text,"SSCTOOLBAR");
	input.type="TEXT"; input.name="SELECTOR";
	var selector=SSC.selector();
	var selected=SSC.selected();
	if (selector) input.value=selector;
	if (selected) input.title="matches "+selected.length+" elements";
	toolbar.appendChild(input);
	addListener(input,"keydown",selector_keydown);
	document.body.appendChild(toolbar);}
    addListener(window,"load",setupToolbar);

    function showCloud(){
	if (!(SSC.cloud)) SSC.updateCloud();
	addClass(document.body,"sscSHOWCLOUD");}
    function hideCloud(){
	dropClass(document.body,"sscSHOWCLOUD");}
    function hideCloudDelayed(){
	setTimeout(hideCloud,500);}
    SSC.showCloud=showCloud;
    SSC.hideCloud=hideCloud;

    function selector_keydown(evt){
 	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    var spec=target.value;
	    var nodes=document.querySelectorAll(spec);
	    if (nodes.length===0) {
		SSC.message("No elements match <tt>{{spec}}</tt>",{spec: spec});}
	    else {
		SSC.select(spec,true);}}}

    /* Keyboard interaction */

    var TAB=0x09;
    var AKEY=0x41;
    var CKEY=0x43;
    var RKEY=0x52;
    var RETURN=0x0d;
    var ESCAPE=0x1b;

    var usekeys=[TAB,RKEY,CKEY,AKEY,ESCAPE,RETURN];

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
	    // Close any windows which are up
	    SSC.Message.close();
	    dropClass(document.body,"sscSHOWCLOUD");
	    dropClass(document.body,"sscTOOLBAR");
	    if (!(SSC.isenabled())) SSC.enable();
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
	    if (max<0) SSC.Message("No matches for selector!");
	    else if (typeof index === "number") {
		if (evt.shiftKey) {
		    if (index<=0) SSC.Message("No more matches",false,4);
		    else SSC.focus(index-1);}
		else if (index>=max)
		    SSC.Message("No more matches",false,4);
		else SSC.focus(index+1);}
	    else if (evt.shiftKey)
		SSC.focus(max);
	    else SSC.focus(0);
	    cancel(evt);}
	else if (key===AKEY) {
	    if (evt.shiftKey) showCloud();
	    else if (hasClass(document.body,"sscSHOWCLOUD"))
		hideCloud();
	    else showCloud();}
	else if (key===CKEY) {
	    if (evt.shiftKey)
		SSC.setCompact(true);
	    else SSC.setCompact();}
	else if (key===RKEY) {
	    if (evt.shiftKey)
		SSC.setReduced(true);
	    else SSC.setReduced();}
	else if (key===RETURN) {
	    addClass(document.body,"sscTOOLBAR");
	    var input=document.getElementById("SSCINPUT");
	    input.focus();}
	else return;
	cancel(evt);}

    // Should we put this inside an onload handler?
    addListener(window,"keydown",ssckeydown);

    function nodeclick(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var scan=target;
	while (scan) {
	    if (hasClass(scan,"sscapp")) return;
	    else if ((target.tagName==="A")&&(target.href)) return;
	    else if (scan===document.body) break;
	    else scan=scan.parentNode;}
	if ((hasClass(document.body,"sscTOOLBAR"))||
	    (hasClass(document.body,"sscSHOWCLOUD"))) {
	    dropClass(document.body,"sscTOOLBAR");
	    dropClass(document.body,"sscSHOWCLOUD");
	    return;}
	if (!(scan)) return; else scan=target;
	while (scan.nodeType!==1) scan=scan.parentNode;
	if (!(scan)) return;
	if ((evt.shiftKey)&&(scan.parentNode)) scan=scan.parentNode;
	var spec=scan.tagName;
	if (scan.className) {
	    var norm=(scan.className.replace(/\bssc\w+\b/g,"")).trim();
	    var classes=norm.split(/\s+/);
	    if (classes.length) spec=spec+"."+classes.join(".");}
	SSC.select(spec,true);}
    
    addListener(window,"click",nodeclick);})();

