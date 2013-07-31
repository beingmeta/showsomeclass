SSC.Dialog=(function(){

    var make=SSC.make, text=SSC.make, fillin=SSC.fillin, $=SSC.$;
    var addListener=SSC.addListener, hasClass=SSC.hasClass, byID=SSC.byID;
    var make_text=SSC.make_text;

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
	    opts.timeout=d/3; opts.finale=(2*d)/3;}
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
		    var svg_image=make("img","svg"); {
			svg_image.src=SSC.default_root+"/redx.svgz";
			svg_image.alt="X";}
		    var png_image=make("img","notsvg"); {
			png_image.src=SSC.default_root+"/redx100x100.png";
			png_image.alt="X";}
		    var close_button=make("div","close button"); {
			close_button.appendChild(svg_image);
			close_button.appendChild(png_image);
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
	addListener(box.querySelectorAll(
	    "div.button.close,button.close,button[value='CLOSE']"),
		    "click",close);
	addListener(box.querySelectorAll("div.button.keep,button.keep"),
		    "click",keep);
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
	    arg=byID(string)
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
	    arg=byID(string)
	else if ((arg.target)||(arg.srcElement))
	    arg=((arg.target)||(arg.srcElement));
	else {}
	if (arg.nodeType) arg=getDialog(arg);
	else return;
	if (!(arg)) return;
	else if (arg===closing) {
	    arg.style.removeProperty('opacity');
	    if (closing_delay) {clearTimeout(closing_delay); closing_delay=false;}
	    if (closing_fader) {clearInterval(closing_fader); closing_fader=false;}
	    closing_opacity=Dialog.opts.init_opacity||0.9;
	    arg.style.setProperty('opacity',closing_opacity,'!important');
	    arg.className=arg.className+" keep";}
	else {}}

    SSC.Message=function(text_arg,data,opts){
	var text=text_arg;
	if (typeof text === "string")  {
	    if (data) text=fillin(text,data);}
	else if (text.template) text=fillin(text);
	else {}
	var livebox=byID("SSCMESSAGEBOX");
	if (livebox) {
	    if (text.nodeType) livebox.appendChild(text);
	    else if (typeof text === "string")
		livebox.appendChild(make_text(text));
	    else livebox.appendChild(make_text(""+text));}
	else SSC.Dialog(text,false,opts||6000);};

    Dialog.close=close; Dialog.keep=keep;
    Dialog.opts={};

    return Dialog;})();

SSC.Editor=(function(){

    var make=SSC.make, make_text=SSC.make_text;
    var text=SSC.text, fillin=SSC.fillin;
    var hasClass=SSC.hasClass, addClass=SSC.addClass;
    var dropClass=SSC.dropClass;
    var addListener=SSC.addListener, cancel=SSC.cancel;
    var getID=SSC.getID, getSignature=SSC.getSignature, byID=SSC.byID;
    var Dialog=SSC.Dialog, getDialog=SSC.getDialog;

    var TAB=0x09;
    var RETURN=0x0d;
    var ESCAPE=0x1b;

    /* Copying an array (or array-like object, such as a NodeList) into a new array. */

    function copy(input){
	var output=new Array(input.length);
	var i=0, lim=input.length;
	while (i<lim) {output[i]=input[i]; i++;}
	return output;}

    function getParents(node){
	var parents=[]; var scan=node.parentNode, body=document.body;
	while (scan) {
	    if (scan===body) break;
	    else if (scan.nodeType===1) parents.push(scan);
	    scan=scan.parentNode;}
	return parents;}
    function getChildren(node){
	var children=node.childNodes;
	if ((children)&&(children.length)) {
	    var results=[]; var i=0, n=children.length;
	    while (i<n) {
		var child=children[i++];
		if (child.nodeType===1) results.push(child);}
	    return results;}
	else return [];}

    /* Adjusting nodes to match a new selector. */

    // Note that we don't do attributes yet 
    function adjustNode(node,spec){
	var parsed=(spec.trim()).split(/[.]/), tag=parsed[0];
	var absolute=[], adds=[], drops=[];
	var k=1, len=parsed.length; while (k<len) {
	    var c=parsed[k++];
	    if (c[0]==='-') drops.push(c.slice(1));
	    else if (c[0]==='+') adds.push(c.slice(1));
	    else absolute.push(c);}
	if (((adds.length)||(drops.length))&&(absolute.length)) {
	    // You can't set the signature and then edit it in the same spec
	    SSC.Message("It doesn't make sense to set the signature and edit "+
			"it in the same specification.");
	    return false;}
	// Change the tag if needed
	if ((tag)&&(node.tagName.toLowerCase()!==tag.toLowerCase())) {
	    // Some implementations don't let you set .tagName,
	    //  so we make a new element and do a replace
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
	if (absolute.length)
	    node.className=absolute.join(" ").trim();
	else if ((adds.length)||(drops.length)) {
	    var current=node.className;
	    if (!(current)) node.className=adds.join(" ");
	    else {
		var classes=current.split(/\s+/);
		var new_classes=add;
		var k=0, n_classes=classes.length;
		while (k<n_classes) {
		    var c=classes[k++];
		    if (!((drops.indexOf(c))||(classes.indexOf(c))))
			new_classes.push(c);}
		node.className=new_classes.join(" ").trim();}}
	else {}
	return node;}

    /* Making edit dialogs */
    
    function makeEditContentDialog(node){
	var dialog=SSC.Dialog(SSC.Templates.editcontent,
			      {signature: getSignature(node,true),
			       imgroot: SSC.default_root},
			      {classname: "ssceditcontent"});
	var textarea=dialog.querySelector("TEXTAREA");
	textarea.value=node.innerHTML;
	var done_button=dialog.querySelector("BUTTON.done");
	addListener(done_button,"click",ec_done);
	return dialog;}

    function makeEditElementDialog(node){
	var parents=getParents(node);
	var children=getChildren(node);
	var selectors=
	    ((node.className)?
	     (SSC.possibleSelectors(
		 node.tagName,node.className.split(/\s+/))):
	     [node.tagName]);

	var dialog=SSC.Dialog(SSC.Templates.editelement,
			      {nparents: parents.length,
			       nchildren: children.length,
			       imgroot: SSC.default_root},
			      {classname: "ssceditelement", noclose: true,
			       nparents: parents.length, nchildren: children.length,
			       nselectors: selectors.length});
	var specinput=dialog.querySelector(".sscspecinput");
	specinput.value=getSignature(node,true);
	addListener(specinput,"keydown",ee_specinput);

	var styletext=(node.style.cssText).trim();
	var styleinput=dialog.querySelector(".sscstyleinput");
	if (styletext) {
	    styleinput.value=styletext;
	    addListener(styleinput,"keydown",ee_styleinput);}
	else dialog.removeChild(styleinput);

	var up=dialog.querySelector('.sscparents');
	if (parents.length) {
	    var p=0, n_parents=parents.length; while (p<n_parents) {
		var parent=parents[p++];
		var popt=make("OPTION",false,getSignature(parent,true));
		popt.value=getID(parent);
		up.appendChild(popt);}
	    addListener(up,"change",ee_selected);}
	else dialog.removeChild(up);
	
	var down=dialog.querySelector('.sscchildren'), n_opts=0;
	if (children.length) {
	    var c=0, n_children=children.length; while (c<n_children) {
		var child=children[c++];
		var copt=make("OPTION",false,getSignature(child,true));
		copt.value=getID(child);
		down.appendChild(copt);}
	    addListener(down,"change",ee_selected);}
	else dialog.removeChild(down);
	
	// var reclasser=dialog.querySelector(".sscreclass");
	// addListener(reclasser,"change",reclasser_changed);

	var buttons=dialog.querySelector(".buttons");
	addListener(buttons,"click",ee_buttonclick);

	var attribtable=dialog.querySelector(".sscattribs"); {
	    var attributes=node.attributes;
	    if (attributes) {
		i=0; var n_attribs=attributes.length;
		while (i<n_attribs) {
		    var attrib=attributes[i++]; var name=attrib.name;
		    if ((name==='id')||(name==='class')||
			(name==='style'))
			continue;
		    var tr=make_attrib_row(name,attrib.value);
		    attribtable.appendChild(tr);}}
	    attribtable.appendChild(make_attrib_row(false,false));}
	return dialog;}

    function make_attrib_row(name,value){
	var tr=make("TR"), th;
	if (name) {
	    tr.setAttribute('NAME',name);
	    th=make("TH",false,name);}
	else {
	    var ainput=make("INPUT"); {
		ainput.type="TEXT"; ainput.name="NEW__ATTRIB";
		ainput.placeholder="attribute";
		ainput.value="";}
	    tr.setAttribute('NAME',"NEW__NEW");
	    th=make("TH",false,ainput);}
	var input=make("INPUT"); {
	    input.type="TEXT";
	    if (name) {
		input.name=name;
		input.value=value||"";}
	    else {
		input.placeholder="value";
		input.name="NEW__VALUE";
		input.value="";}
	    addListener(input,"keydown",ee_attrib);}
	tr.appendChild(th); tr.appendChild(make("TD",false,input));
	return tr;}

    function makeEditSelectionDialog(node,selection){
	var dialog=SSC.Dialog(SSC.Templates.editselection,
			      {imgroot: SSC.default_root},
			      {selection: "ssceditselection"});
	var choices=dialog.querySelector(".choices");
	addListener(choices,"click",es_buttonclick);
	return dialog;}

    function makeReclassElementsDialog(selector){
	var selected;
	if (!(selector)) {
	    selector=SSC.selector();
	    selected=SSC.selected();}
	else selected=SSC.$(selector);
	var dialog=SSC.Dialog(SSC.Templates.reclass,
			      {simplespec: SSC.stripregex(selector),
			       count: selected.length,spec: selector,
			       imgroot: SSC.default_root},
			      {classname: "sscreclass"});
	var newspec=dialog.querySelector(".sscnewspec");
	addListener(newspec,"keydown",rc_keydown);
	var button=dialog.querySelector("button[value='CHANGE']");
	addListener(button,"click",rc_done);
	dialog.sscselector=selector;
	return dialog;}

    function reclass_selector(evt){
	makeReclassElementsDialog(SSC.selector());}

    /* Edit handlers */

    function set_editnode(node){
	if (SSC.Editor.node) dropClass(SSC.Editor.node,"sscEDITING");
	SSC.Editor.node=node;}

    function ee_specinput(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    if ((target)&&(target.value)) {
		var node=adjustNode(SSC.Editor.node);
		set_editnode(node);
		setEditElement(node,SSC.Editor.dialog);}
	    cancel(evt);}}
    function ee_styleinput(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    if (!(target)) {cancel(evt); return;}
	    var newstyle=target.value.trim();
	    if ((!(newstyle))||(newstyle.length===0)) {
		SSC.Editor.node.style='';
		target.style.display='none__none';}
	    else SSC.Editor.node.style=newstyle;
	    cancel(evt);
	    return;}}
    function ee_buttonclick(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	while (button) {
	    if (button.tagName==='BUTTON') break;
	    else button=button.parentNode;}
	if (!(button)) return;
	if (button.value==='CLOSE')
	    SSC.Dialog.close(SSC.getDialog(button));
	else if (button.value==='UNWRAP') {
	    var node=SSC.Editor.node;
	    var frag=document.createDocumentFragment();
	    var parent=node.parentNode;
	    if (node.childNodes) {
		var children=node.childNodes, copied=[];
		var i=0, n_children=children.length;
		while (i<n_children) copied.push(children[i++]);
		i=0; while (i<n_children) frag.appendChild(copied[i++]);
		node.parentNode.insertBefore(frag,node);}
	    parent.removeChild(node);
	    Editor(parent,makeEditElementDialog(parent));
	    SSC.Dialog.close(SSC.getDialog(button));}
	else if (button.value==='CONTENT') {
	    Editor(SSC.Editor.node,makeEditContentDialog(SSC.Editor.node));}
	else if (button.value==='DELETE') {
	    var node=SSC.Editor.node; var blank=text("");
	    if (node.parentNode) 
		node.parentNode.replaceChild(blank,node);
	    SSC.Dialog.close(SSC.getDialog(button));}
	else {}}
    function ee_attrib(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    var node=SSC.Editor.node;
	    var name=target.name;
	    var value=target.value.trim();
	    var dialog=getDialog(target);
	    var table=dialog.querySelector("table");
	    var todrop=false;
	    if (name==="NEW__VALUE") { /* New attribute */
		var name_input=
		    dialog.querySelector("INPUT[NAME='NEW__ATTRIB']");
		if ((name_input)&&(name_input.value))
		    name=name_input.value;
		else {
		    SSC.Message("You need to name the attribute");
		    cancel(evt);
		    return;}}
	    if (value) {
		node.setAttribute(name,value);
		table.appendChild(make_attrib_row(name,value));
		if (target.name==="NEW__VALUE") {
		    todrop=dialog.querySelector("tr[NAME='NEW__NEW']");
		    if ((todrop)&&(todrop.parentNode))
			todrop.parentNode.removeChild(todrop);
		    table.appendChild(make_attrib_row(false,false));}}
	    else {
		node.removeAttribute(name);
		todrop=dialog.querySelector("tr[NAME='"+name+"']");
		if ((todrop)&&(todrop.parentNode))
		    todrop.parentNode.removeChild(todrop);}
	    cancel(evt);}}
    function ee_selected(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var targetid=target.value;
	var goto=document.getElementById(targetid);
	if (goto) {
	    cancel(evt); return Editor(goto);}}

    function ec_done(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	var dialog=getDialog(button);
	var input=dialog.querySelector('TEXTAREA');
	SSC.Editor.node.innerHTML=input.value;
	SSC.Dialog.close(SSC.getDialog(button));}

    function es_done(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	var input=dialog.querySelector(".sscselection");
	var wrapinput=dialog.querySelector('.sscwrapper');
	var selection=SSC.Editor.selection;
	var oldnode=selection.startnode;
	var oldtext=oldnode.nodeValue;
	var newtext=oldtext.slice(0,selection.startoff)+input.value+
	    oldtext.slice(selection.endoff);
	var wrapper=wrapinput.value.trim();
	if ((!(wrapper))||(wrapper.length===0)) 
	    oldnode.parentNode.replaceChild(text(newtext),oldnode);
	else {
	    var spec=wrapper.split(".");
	    var newtag=spec[0]||"span";
	    var classname=spec.slice(1).join(" ");
	    var newelt=make(newtag,classname,newtext);
	    oldnode.parentNode.replaceChild(newelt,oldnode);}
	SSC.Editor.selection=false;
	Dialog.close(dialog);
	SSC.Editor.dialog=false;}
    function es_keydown(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    cancel(evt); return es_done();}}

    function rc_done(evt){
	var target=((evt.nodeType)?(evt):
		    ((evt.target)||(evt.srcElement)));
	var dialog=getDialog(target);
	var input=dialog.querySelector('INPUT');
	var newspec=input.value.trim();
	var selected=SSC.selected();
	var i=0, n_selected=selected.length;
	while (i<n_selected) {
	    var sel=selected[i++];
	    if (newspec.length===0) {
		var crumb=make_text("");
		sel.parentNode.replaceChild(crump,sel);}
	    else adjustNode(sel,newspec);}
	setTimeout(function(){SSC.select(newspec,true);},100);
	SSC.Dialog.close(dialog);}

    function rc_keydown(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {cancel(evt); rc_done(evt);}}

    /* Setting dialogs for particular nodes */


    /* Edit functions */

    function Editor(arg,dialog){
	var node=false, selector=false, selection=false;
	if (arg.nodeType) node=arg;
	else if ((typeof arg === "string")&&
		 (document.getElementById(arg)))
	    node=document.getElementById(arg);
	else if (typeof arg === "string") {
	    var candidates=SSC.$(arg);
	    if (candidates.length===0) {
		SSC.Message("Not sure what to edit: "+arg+"?");
		return;}
	    else if (candidates.length===1) 
		node=candidates[0];
	    else selector=arg;}
	else if (arg instanceof Selection) {
	    selection=arg;}
	else {
	    SSC.Message("Not sure what to edit: "+arg+"?");
	    return;}
	set_editnode(false);
	SSC.Editor.selection=false;
	var current_dialog=SSC.Editor.dialog;
	if (current_dialog) {
	    SSC.Editor.dialog=false;
	    SSC.Dialog.close(current_dialog);}
	if (node) set_editnode(node);
	else set_editnode(false);
	if (selector) SSC.select(selector);
	if (selection) SSC.Editor.selection=
	    {startnode: selection.anchorNode, startoff: selection.anchorOffset,
	     endnode: selection.focusNode, endoff: selection.focusOffset};
	else SSC.Editor.selection=false;
	if (!(dialog)) {
	    if (node)
		SSC.Editor.dialog=dialog=makeEditElementDialog(node);
	    else if (selector)
		SSC.Editor.dialog=dialog=makeReclassDialog(selector);
	    else {}}
	else SSC.Editor.dialog=dialog;
	if (node) SSC.select(getSignature(node));}

    Editor.node=false; Editor.dialog=false;

    function editor_click(evt){
	evt=evt||event;
	var selection=window.getSelection();
	if ((selection)&&(!(evt.shiftKey))&&
	    ((selection.anchorNode!==selection.focusNode)||
	     (selection.anchorOffset!==selection.focusOffset))) {
	    if (selection.anchorNode===selection.focusNode) {
		var dialog=SSC.Dialog(SSC.Templates.simpleselection,
				      {selection:selection.toString(),
				       imgroot: SSC.default_root},
				      {classname: "ssceditselection",
				       noclose: true});
		var textinput=dialog.querySelector('.sscselection');
		addListener(textinput,"keydown",es_keydown);
		var wrapinput=dialog.querySelector('.sscwrapper');
		addListener(wrapinput,"keydown",es_keydown);
		Editor(selection,dialog);}
	    return;}
	var target=evt.target||evt.srcElement;
	var scan=target;
	while (scan) {
	    if (hasClass(scan,"sscapp")) return;
	    else if ((!(evt.ctrlKey))&&
		     (((target.tagName==="A")&&(target.href))||
		      (target.onclick)|| (target.tagName==='INPUT')))
		return;
	    else if (scan===document.body) break;
	    else scan=scan.parentNode;}
	if (!(scan)) return; else scan=target;
	while (scan.nodeType!==1) scan=scan.parentNode;
	if (!(scan)) return;
	if (hasClass(scan,"sscSELECTED")) SSC.focus(scan);
	var spec=scan.tagName;
	if (scan.className) {
	    var norm=(scan.className.replace(/\bssc\w+\b/g,"")).trim();
	    var classes=norm.split(/\s+/);
	    if (classes.length) spec=spec+"."+classes.join(".");}
	if (evt.shiftKey) Editor(scan);
	SSC.select(spec,false,true);
	addClass(document.body,"sscTOOLBAR");}
    SSC.onclick=editor_click;

    function setupEditor(){
	var svg_image=make("img","button svg"); {
	    svg_image.src=fillin("{{imgroot}}/changemarkup.svgz",
				 {imgroot:SSC.default_root});
	    svg_image.alt="=&gt;";}
	var png_image=make("img","button notsvg"); {
	    png_image.src=fillin("{{imgroot}}/changemarkup100x100.png",
				 {imgroot:SSC.default_root});
	    png_image.alt="=&gt;";}
	var button=make("span","reclass");
	button.appendChild(svg_image); button.appendChild(png_image);
	addListener(button,"click",reclass_selector);
	var buttons=byID("SSCTOOLBARBUTTONS");
	buttons.insertBefore(button,buttons.firstChild);}
    SSC.onload=setupEditor;

    return Editor;})();
