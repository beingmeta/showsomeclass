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
    function make_text(input){
	if (typeof input === "string")
	    return document.createTextNode(input);
	else return document.createTextNode(fillin(input));}
    var text=make_text;

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
	if (typeof node==="string") node=document.getELementById(node);
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
	var classname=node.className.replace(/\bssc\w+/,"").trim();
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
	if (lim===0) {
	    if (!(nomsg)) {
		if (SSC.Message)
		    SSC.Message("There are no matches for <tt>{{spec}}</tt>",
				{spec: spec,timeout: 4000});
		else if (SSC.Dialog)
		    SSC.Dialog("There are no matches for <tt>{{spec}}</tt>",
			       {spec: spec,timeout: 4000});
		else alert("There are no matches for "+spec);}
	    return;}
	enable();
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
	var count=document.getElementById("SSCMATCHCOUNT");
	var phrase=document.getElementById("SSCMATCHPHRASE");
	if (input) {
	    input.value=spec;
	    input.title="matches "+nodes.length+" elements";}
	if (count) count.innerHTML=""+nodes.length;
	var rules=SSC.getStyleInfo(spec);
	if (phrase) {
	    var r=0, n_rules=rules.length, rule_list="";
	    while (r<n_rules) rule_list=rule_list+rules[r++]+"\n";
	    phrase.title=rule_list;}
	if ((!(SSC.quiet))&&(!(nomsg))&&(SSC.Dialog)) {
	    var msg=SSC.Dialog(
		"The selector<br/><tt>{{spec}}</tt><br/>matches <strong>{{count}}</strong> elements\n"+
		    "<p class='sschelp'><kbd>Tab</kbd> to scan through them, <kbd>Shift-Tab</kbd> to go back.</p>\n"+
		    "<div class='sscrules'></div>",
		{spec: spec, count: nodes.length, timeout: 6000});
	    var rules_div=msg.querySelector(".sscrules");
	    var j=0, n_rules=rules.length; while (j<n_rules) {
		var rule=make("div","cssrule",rules[j++]);
		rules_div.appendChild(rule);}}
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
	addListener: addListener, cancel: cancel};})();

SSC.Dialog=(function(){

    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var addListener=SSC.addListener, hasClass=SSC.hasClass;

    function getDialog(elt){
	if ((!(elt.nodeType))&&((elt.target)||(elt.srcElement)))
	    elt=((elt.target)||(elt.srcElement));
	while (elt) {
	    if (hasClass(elt,"sscdialog")) return elt;
	    else elt=elt.parentNode;}
	return false;}
    SSC.getDialog=getDialog;

    /* Creating a dialog */

    function Dialog(text,data,opts){
	if (typeof text === "string")  {
	    if (data) text=fillin(text,data);}
	if (typeof opts === "number") {
	    // Assume it's seconds, convert to msecs
	    if (opts<100) opts=opts*1000;
	    // Divide the delay between wait and finale
	    opts={delay: opts/2,finale: opts/2};}
	else if ((!(opts))&&(data)) opts=data;
	else {}
	if ((opts.timeout===false)&&(!(opts.finale))) opts.keep=true;
	else if ((opts.timeout)&&(!(opts.hasOwnProperty('finale')))) {
	    // If we just have a delay, and no finale, divide the delay
	    var d=opts.timeout;
	    // Assume it's seconds, convert to msecs
	    if (d<100) d=d*1000;
	    opts.timeout=d/2; opts.finale=d/2;}
	else {
	    if ((opts.timeout)&&(opts.timeout<100)) opts.timeout=opts.timeout*1000;
	    if ((opts.finale)&&(opts.finale<100)) opts.finale=opts.finale*1000;}
	var classname="sscdialog sscapp";
	if (opts.classname) {
	    var custom=opts.classname.trim();
	    if (custom.search(/\bsscdialog\b/)<0) custom=custom+" sscdialog";
	    if (custom.search(/\bsscapp\b/)<0) custom=custom+" sscapp";
	    classname=custom.replace(/\s+/g," ");}
	var box=make("div",classname,false,opts.id); {
	    if (!((opts.modal)&&(opts.choices)&&(opts.choices.length))) {
		if (!(opts.noclose)) {
		    var close_button=make("DIV","close button","Close"); {
			box.appendChild(close_button);}}
		if ((opts.timeout)&&(!(opts.keep))) {
		    var keep_button=make("DIV","keep button","Keep"); {
			box.appendChild(keep_button);}}}}
	if (opts.title) {
	    var title_text=opts.title;
	    var title=make("div","title",title_text);
	    box.appendChild(title);}
	box.appendChild(make("div","sscmessages","","SSCMESSAGEBOX"));
	if (typeof text === "string") {
	    var frag=document.createElement("div"); frag.innerHTML=text;
	    var children=frag.childNodes; var toadd=[];
	    var k=0, klim=children.length;
	    while (k<klim) toadd.push(children[k++]);
	    k=0; while (k<klim) box.appendChild(toadd[k++]);}
	else if (text.nodeType) box.appendChild(text);
	else if (text.template)
	    box.appendChild(make_text(fillin(text)));
	else {}
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
	addListener(box.querySelectorAll("div.button.close"),"click",close);
	addListener(box.querySelectorAll("div.button.keep"),"click",keep);
	box.id="SSCMESSAGE";
	document.body.appendChild(box);
	if (opts.keep) box.className=box.className+" keep";
	// We do this "old school" with an interval, rather than using
	//  CSS transitions, because the selective display CSS uses
	//  !important opacity definitions which get in the way of the
	//  transitions.
	if ((opts.timeout)&&
	    (!(opts.modal))&&
	    (!(opts.keep)))
	    startClosing(box,opts);
	return box;}

    /* Gradual closing */

    var closing=false;
    var closing_delay=false;
    var closing_delta=0.025;
    var closing_fader=false;
    var closing_fade_interval=100;
    var closing_opacity=1.0;

    function startClosing(dialog,opts){
	if (dialog===closing) return;
	else if (closing) close(closing);
	closing=dialog;
	closing_opacity=opts.init_opacity||Dialog.opts.init_opacity||0.9;
	dialog.style.setProperty('opacity',closing_opacity,'!important');
	var delay=((opts.hasOwnProperty('timeout'))?(opts.timeout):
		   (Dialog.opts.hasOwnProperty('timeout'))?(Dialog.opts.timeout):
		   3000);
	var finale=((opts.hasOwnProperty('finale'))?(opts.finale):
		    (Dialog.opts.hasOwnProperty('finale'))?(Dialog.opts.finale):3000);
	var interval=((opts.fade_interval)||(Dialog.opts.fade_interval)||100);
	var n_steps=Math.ceil((finale)&&(finale/interval));
	var delta=((finale)&&(closing_opacity/n_steps));
	if (delta) {
	    closing_delta=delta;
	    closing_fade_interval=interval;
	    closing_delay=setTimeout(startfinale,delay);}
	else closing_delay=setTimeout(close,delay);}

    function startfinale(){
	if (closing_fader) close();
	if (closing_delay) {clearTimeout(closing_delay); closing_delay=false;}
	closing_fader=setInterval(fademessage,closing_fade_interval);}

    function fademessage(){
	var delta=closing_delta;
	if (!(delta)) {close(closing); return;}
	if (!(closing_fader)) {close(closing); return;}
	if ((!(closing))||(!(closing.parentNode))) close();
	else if (closing_opacity<=0) {
	    closing.style.removeProperty('opacity');
	    close();}
	else {
	    closing_opacity=closing_opacity-delta;
	    closing.style.setProperty('opacity',closing_opacity,'!important');}}

    function close(arg){
	if (!(arg)) arg=closing;
	else if (typeof arg === "STRING")
	    arg=document.getElementById(string)
	else if ((arg.target)||(arg.srcElement))
	    arg=((arg.target)||(arg.srcElement));
	else {}
	if (arg.nodeType) {
	    var scan=arg;
	    while (scan) {
		if (scan.nodeType!==1) scan=scan.parentNode;
		else if (hasClass(scan,"sscdialog")) break;
		else scan=scan.parentNode;}
	    if (!(scan)) return;
	    else arg=scan;}
	else return;
	if ((closing)&&(closing===arg)) {
	    if (closing_delay) clearTimeout(closing_delay);
	    if (closing_fader) clearInterval(closing_fader);
	    closing=closing_delay=closing_fader=false;}
	if (arg.onclose) {
	    var closefn=arg.onclose;
	    var close_data=arg.onclose_data;
	    arg.onclose=false;
	    if (close_data) arg.onclose_data=false;
	    if (close_data) closefn(arg,close_data); else closefn(arg);}
	if (arg.parentNode) arg.parentNode.removeChild(arg);}

    function keep(arg){
	if (!(arg)) arg=closing;
	else if (typeof arg === "STRING")
	    arg=document.getElementById(string)
	else if ((arg.target)||(arg.srcElement))
	    arg=((arg.target)||(arg.srcElement));
	else {}
	if (arg.nodeType) arg=getDialog(arg);
	else return;
	if (!(arg)) return;
	else if (arg===closing) {
	    if (closing_delay) {clearTimeout(closing_delay); closing_delay=false;}
	    if (closing_fader) {clearInterval(closing_fader); closing_fader=false;}
	    closing_opacity=Dialog.opts.init_opacity||0.9;
	    arg.style.setProperty('opacity',closing_opacity,'!important');
	    arg.className=msg.className+" keep";}
	else {}}

    SSC.Message=function(text_arg,data,opts){
	var text=text_arg;
	if (typeof text === "string")  {
	    if (data) text=fillin(text,data);}
	else if (text.template) text=fillin(text);
	else {}
	var livebox=document.getElementById("SSCMESSAGEBOX");
	if (livebox) {
	    if (text.nodeType) livebox.appendChild(text);
	    else if (typeof text === "string")
		livebox.appendChild(make_text(text));
	    else livebox.appendChild(make_text(""+text));}
	else SSC.Dialog(text,false,opts||6000);};

    Dialog.close=close; Dialog.keep=keep;
    Dialog.opts={};

    return Dialog;})();

SSC.updateCloud=(function(){

    var make=SSC.make, text=SSC.text, fillin=SSC.fillin;
    var addListener=SSC.addListener;

    function scoreSelectors(root){
	var scores={};
	if (!(root)) root=document.body;
	scandom(root,scores);
	return scores;}

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

    function scandom(node,scores){
	var tag=node.tagName; var classname=node.className;
	// Ignore yourself
	if (classname.search(/\bsscapp\b/)>=0) return;
	classname=classname.replace(/\bssc\w+/g,"");
	// Split up classnames
	var classes=((classname)?(classname.split(/\s+/)):[]);
	// Generate applicable selectors
	var selectors=possibleSelectors(tag,classes);
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
	var links=make("div","selectors","","SSCSELECTORSPANS");
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
		var cur=SSC.selector();
		SSC.select(cur+","+target.innerHTML);}
	    else SSC.select(target.innerHTML);}}

    function updateCloud(){
	if (!(SSC.cloud)) initCloud();
	var cloud=document.getElementById("SSCSELECTORCLOUD");
	var selectors=document.getElementById("SSCSELECTORSPANS");
	var scores=scoreSelectors(document.body);
	var all=[]; for (var sel in scores) {
	    if (scores.hasOwnProperty(sel)) all.push(sel);}
	all.sort(function(sel1,sel2){
	    if (sel1.length===sel2.length) {
		if (sel1<sel2) return -1; else return 1;}
	    else return sel1.length-sel2.length;});
	var cloudmap={};
	SSC.cloudmap=cloudmap;
	selectors.innerHTML="";
	var i=0, lim=all.length;
	while (i<lim) {
	    var sel=all[i++], score=scores[sel];
	    var span=make("span","selector",sel);
	    span.title=score+" matching elements";
	    span.style.fontSize=(100+(5*(Math.ceil(Math.log(score)))))+"%";
	    selectors.appendChild(span); cloudmap[sel]=span;
	    selectors.appendChild(text(" "));}
	SSC.cloudmap=cloudmap;
	SSC.selectors=all;
	sizeCloud();}

    function sizeCloud(){
	if (!(SSC.cloud)) updateCloud();
	var cloud=document.getElementById("SSCSELECTORCLOUD");
	var selectors=document.getElementById("SSCSELECTORSPANS");
	cloud.style.setProperty('opacity',0.0,'!important');
	cloud.style.setProperty('display','block','!important');
	cloud.style.fontSize='100%';
	var ih=selectors.offsetHeight, oh=cloud.offsetHeight;
	var fs=100, delta=5;
	if (ih>oh) while (ih>oh) {
	    fs=fs-delta; selectors.style.fontSize=(fs)+"%";
	    ih=selectors.offsetHeight; oh=cloud.offsetHeight;}
	else {
	    while (oh>ih) {
		fs=fs+delta; selectors.style.fontSize=(fs)+"%";
		ih=selectors.offsetHeight; oh=cloud.offsetHeight;}
	    fs=fs-delta; selectors.style.fontSize=(fs)+"%";}
	cloud.style.removeProperty('opacity',0.0,'!important');
	cloud.style.removeProperty('display','block','!important');}
    
    return updateCloud;})();

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

(function(){
    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var hasClass=SSC.hasClass, addClass=SSC.addClass, dropClass=SSC.dropClass;
    var addListener=SSC.addListener, cancel=SSC.cancel;

    /* Using the URL hash as a selector */

    function selectHash() {
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	SSC.select(hash);}

    addListener(window,"hashchange",selectHash);

    SSC.toolbar_text=
	"<button title='See all selectors' class='right' onclick='SSC.toggleCloud();'>All Selectors</button>\n"+
	"<input type='TEXT' id='SSCINPUT' NAME='SELECTOR' placeholder='a CSS selector'/> <span id='SSCMATCHPHRASE'>matches <span id='SSCMATCHCOUNT'>some</span> element(s)</span>";

    function setupToolbar(){
	var toolbar=make("div","sscapp ssctoolbar",SSC.toolbar_text,"SSCTOOLBAR");
	var input=toolbar.querySelector('input');
	addListener(input,"keydown",selector_keydown);
	document.body.appendChild(toolbar);}
    
    function showCloud(){
	if (!(SSC.cloud)) SSC.updateCloud();
	addClass(document.body,"sscSHOWCLOUD");}
    function hideCloud(){
	dropClass(document.body,"sscSHOWCLOUD");}
    function toggleCloud(){
	if (!(SSC.cloud)) SSC.updateCloud();
	if (hasClass(document.body,"sscSHOWCLOUD"))
	    dropClass(document.body,"sscSHOWCLOUD");
	else addClass(document.body,"sscSHOWCLOUD");}

    function hideCloudDelayed(){
	setTimeout(hideCloud,500);}
    SSC.showCloud=showCloud;
    SSC.hideCloud=hideCloud;
    SSC.toggleCloud=toggleCloud;

    function selector_keydown(evt){
 	evt=evt||event;
	var kc=evt.keyCode;
	var target=evt.target||evt.srcElement;
	if (kc===RETURN) {
	    var spec=target.value;
	    var nodes=document.querySelectorAll(spec);
	    if (nodes.length===0) {
		SSC.message("No elements match <tt>{{spec}}</tt>",{spec: spec});}
	    else {
		SSC.select(spec,true);}}}

    /* Keyboard interaction */

    var CKEY=0x43;
    var TAB=0x09;
    var RETURN=0x0d;
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
	    SSC.Dialog.close();
	    dropClass(document.body,"sscSHOWCLOUD");
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
	    if (max<0) SSC.Dialog("No matches for selector!");
	    else if (typeof index === "number") {
		if (evt.shiftKey) {
		    if (index<=0) SSC.Dialog("No more matches",false,4);
		    else SSC.focus(index-1);}
		else if (index>=max)
		    SSC.Dialog("No more matches",false,4);
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
	    var input=document.getElementById("SSCINPUT");
	    input.focus();}
	else return;
	cancel(evt);}
    SSC.window_keydown=window_keydown;

    function window_click(evt){
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
    SSC.window_click=window_click;
    
    // Referencing SSC.nodeclick let's it be overriden by apps using SSC
    addListener(window,"load",function(){
	setupToolbar();
	var hash=(location)&&(location.hash);
	if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
	if ((hash)&&($(hash).length)) {
	    SSC.enable(); SSC.select(hash);}
	if (SSC.hasOwnProperty("onclick"))
	    addListener(window,"click",SSC.onclick);
	else addListener(window,"click",window_click);
    	if (SSC.hasOwnProperty("onkey"))
	    addListener(window,"keydown",SSC.onkey);
	else addListener(window,"keydown",window_keydown);});})();

