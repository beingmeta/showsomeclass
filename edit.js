/* -*- Mode: Javascript; -*- */

/* ################# showsomelcass/edit.js ###################### */

/* Copyright (C) 2012-2013 beingmeta, inc.

   This program comes with absolutely NO WARRANTY, including implied
   warranties of merchantability or fitness for any particular
   purpose.

   Use, modification, and redistribution of this program is permitted
   under either the GNU General Public License (GPL) Version 2 (or
   any later version) or under the GNU Lesser General Public License
   (version 3 or later).

   These licenses may be found at www.gnu.org, particularly:
   http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
   http://www.gnu.org/licenses/lgpl-3.0-standalone.html

*/
/* jshint browser: true */

SSC.Editor=(function(){

    var make=SSC.Utils.make, make_text=SSC.Utils.make_text;
    var text=SSC.Utils.text, fillin=SSC.Utils.fillin;
    var hasClass=SSC.Utils.hasClass, addClass=SSC.Utils.addClass;
    var dropClass=SSC.Utils.dropClass, getParent=SSC.Utils.getParent;
    var addListener=SSC.Utils.addListener, cancel=SSC.Utils.cancel;
    var getID=SSC.Utils.getID, getSignature=SSC.Utils.getSignature;
    var bySpec=SSC.Utils.bySpec, byID=SSC.Utils.byID;
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
	var gotid=((/#[^.#\[ ]+/g).exec(spec));
	if (gotid) gotid=gotid[0];
	if (gotid) spec=spec.replace((/#[^.#\[ ]+/g),"");
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

    /* Edit Element dialog */
    
    function makeEditElementDialog(node){
	var parents=getParents(node);
	var children=getChildren(node);

	var dialog=SSC.Dialog(SSC.Templates.editelement,
			      {nparents: parents.length,
			       nchildren: children.length,
			       signature: getSignature(node,true),
			       imgroot: SSC.imgroot},
			      SSC.Inits.editelement);
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

    var fixed_row="<th>{{attribname}}</th><td>{{attribval}}</td>>";
    var new_row="<tr name='NEW__NEW'>"+
	"<th><input TYPE='TEXT' NAME='NEW__ATTRIB' VALUE='' placeholder='new attribute'/></th>\n"+
	"<td><input TYPE='TEXT' NAME='NEW__VALUE' VALUE='' placeholder='new attribute'/></td></tr>";

    function make_attrib_row(name,value){
	if (name)
	    return make("tr",false,fixed_row,
			{attribname: name,attribval:value},
			{name: name, "td input:keydown": ee_attrib});
	else return make("tr",false,new_row,
			 {"td input:keydown": ee_attrib},{name: "NEW_NEW"});}

    /* Edit Element handlers */
    
    function ee_specinput(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    if ((target)&&(target.value)) {
		var node=adjustNode(SSC.Editor.node,target.value);
		SSC.Dialog.close(SSC.Editor.dialog);
		set_editnode(false);}
	    cancel(evt);}}
    function ee_ok(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var form=getParent(target,"ssceditelement");
	var specinput=bySpec(form,"input[name='SPEC']");
	var styleinput=bySpec(form,"input[name='STYLE']");
	var node=SSC.Editor.node;
	if (!(node)) {
	    SSC.Dialog.close(SSC.Editor.dialog);
	    cancel(evt);
	    return;}
	if ((specinput)&&(specinput.value)) 
	    node=adjustNode(node,specinput.value);
	if ((styleinput)&&(styleinput.value))
	    node.style=styleinput.value;
	SSC.Dialog.close(SSC.Editor.dialog);
	set_editnode(false);
	cancel(evt);}
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
    function ee_expand(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	if (dialog) addClass(dialog,"sscexpanded");}
    function ee_contract(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	if (dialog) dropClass(dialog,"sscexpanded");}
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


    SSC.Inits.editelement={
	"button.close:click": SSC.Dialog.close,
	"button.expand:click": ee_expand,
	"button.contract:click": ee_contract,
	"button.ok:click": ee_ok,
	"input[name='SPEC']:keydown": ee_specinput,
	"input[name='STYLE']:keydown": ee_styleinput,
	".buttons:click": ee_buttonclick,
	classname: "ssceditelement"};

    /* Edit Content dialog */

    function makeEditContentDialog(node){
	var dialog=SSC.Dialog(SSC.Templates.editcontent,
			      {signature: getSignature(node,true),
			       imgroot: SSC.imgroot},
			      SSC.Inits.editcontent);
	var textarea=bySpec(dialog,"TEXTAREA"); textarea.value=node.innerHTML;
	return dialog;}

    function ec_done(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	var dialog=getDialog(button);
	var input=dialog.querySelector('TEXTAREA');
	SSC.Editor.node.innerHTML=input.value;
	SSC.Dialog.close(SSC.getDialog(button));}

    SSC.Inits.editcontent={
	classname: "ssceditcontent",
	"button.done:click": ec_done,
	"button.close:click": SSC.Dialog.close};

    /* Reclass Dialog */

    function makeReclassElementsDialog(selector){
	var selected;
	if (!(selector)) {
	    selector=SSC.selector();
	    selected=SSC.selected();}
	else selected=SSC.$(selector);
	var dialog=SSC.Dialog(SSC.Templates.reclass,
			      {simplespec: SSC.simplespec(selector),
			       count: selected.length,spec: selector,
			       imgroot: SSC.imgroot},
			      SSC.Inits.reclass);
	dialog.sscselector=selector;
	return dialog;}

    function reclass_selector(evt){
	var dialog=makeReclassElementsDialog(SSC.selector());
	document.body.appendChild(dialog);}

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

    SSC.Inits.reclass={
	classname: "sscreclass",
	".sscnewspec:keydown": rc_keydown,
	"button.close:click": SSC.Dialog.close,
	"button[value='CHANGE']:click": rc_done};
    
    /* Edit selection */

    function make_selection_editor(range){
	var startnode=range.startnode, ntext=startnode.nodeValue;
	var endnode=range.endnode, ntext=startnode.nodeValue;
	var template, inside, init;
	if ((startnode===endnode)&&((range.endoff-range.startoff)<40)) {
	    inside=ntext.slice(range.startoff,range.endoff);
	    template=SSC.Templates.textedit;
	    init=SSC.Inits.textedit;}
	else {
	    inside=false;
	    template=SSC.Templates.bigtextedit;
	    init=SSC.Inits.bigtextedit||SSC.Inits.textedit;}
	var dialog=SSC.Dialog(template,
			      {imgroot: SSC.imgroot,selection: inside},
			      init);
	if (!(inside)) {
	    var textarea=bySpec(dialog,'TEXTAREA');
	    textarea.value=getHTML(range);}
	return dialog;}

    /* This should get the HTML for a range, expanding the range if needed. */
    function getHTML(range){
	if (range.startnode===range.endnode)
	    return range.startnode.nodeValue.slice(range.startoff,range.endoff);
	/* Find the common parent and include all the nodes enclosing the selection. */
	else return "";}

    function es_done(evt){
	evt=evt||event; var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	var textinput=dialog.querySelector("input[name='SELECTION']");
	var wrapinput=dialog.querySelector("input[name='WRAPPER']");
	var range=SSC.Editor.selection;
	var oldnode=range.startnode;
	var oldtext=oldnode.nodeValue;
	var newtext=textinput.value;
	var wrapper=wrapinput.value.trim();
	var newnode=false;
	if ((wrapper)&&(wrapper.length)) {
	    var parsed=wrapper.split(".");
	    var tag=parsed[0]||"span";
	    var classname=parsed.slice(1).join(" ");
	    newnode=make(tag,classname,newtext);}
	else newnode=make_text(newtext);
	var frag=document.createDocumentFragment();
	frag.appendChild(make_text(oldtext.slice(0,range.startoff)));
	frag.appendChild(newnode);
	frag.appendChild(make_text(oldtext.slice(range.endoff)));
	oldnode.parentNode.replaceChild(frag,oldnode);
	SSC.Editor.selection=false;
	SSC.Dialog.close(dialog);}
    function es_keydown(evt){
	var kc=evt.keyCode; if (kc===RETURN) return es_done(evt);}
    function es_cancel(evt){
	evt=evt||event; var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	Dialog.close(dialog);
	cancel(evt);}
    function es_wrap_click(evt){
	evt=evt||event; var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	if (!(dialog)) return;
	else if (hasClass(dialog,"sscwrap"))
	    dropClass(dialog,"sscwrap");
	else addClass(dialog,"sscwrap");
	cancel(evt);}

    SSC.Inits.textedit={
	classname: "ssctextedit",
	"button.ok:click": es_done,
	"button.wrap:click": es_wrap_click,
	"button.close:click": SSC.Dialog.close,
	"input[type='TEXT']:keydown": es_keydown};

    /* Edit handlers */

    function set_editnode(node){
	if (SSC.Editor.node) dropClass(SSC.Editor.node,"sscEDITING");
	SSC.Editor.node=node;}

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
	if (selection) {
	    var range={startnode: selection.anchorNode,
		       startoff: selection.anchorOffset,
		       endnode: selection.focusNode,
		       endoff: selection.focusOffset};
	    SSC.Editor.selection=range;
	    SSC.Editor.dialog=dialog=make_selection_editor(range);}
	else SSC.Editor.selection=false;
	if (!(dialog)) {
	    if (node)
		SSC.Editor.dialog=dialog=makeEditElementDialog(node);
	    else if (selector)
		SSC.Editor.dialog=dialog=makeReclassDialog(selector);
	    else {}}
	else SSC.Editor.dialog=dialog;
	var input=bySpec(dialog,'.sscinitfocus');
	if (input) input.focus();
	if (node) SSC.select(getSignature(node));}

    Editor.node=false; Editor.dialog=false;

    function editor_click(evt){
	evt=evt||event;
	var selection=window.getSelection();
	if ((selection)&&(!(evt.shiftKey))&&
	    ((selection.anchorNode!==selection.focusNode)||
	     (selection.anchorOffset!==selection.focusOffset))) {
	    if (selection.anchorNode===selection.focusNode) {
		Editor(selection);}
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
	addClass(document.body,"ssc__TOOLBAR");}
    SSC.onclick=editor_click;

    function save_current(){
	var content=false;
	var html=document.querySelector('HTML');
	var elts=SSC.Utils.tmpid_elts;
	var saved_ids={}, apps=[], crumbs=[];
	var matches=document.querySelectorAll('.sscapp');
	    var i=0, lim=matches.length; while (i<lim) {
		apps.push(matches[i++]);}
	    i=0; while (i<lim) {
		var app=apps[i];
		var crumb=make_text("");
		crumbs[i]=crumb;
		app.parentNode.replaceChild(crumb,app);
		i++;}
	    var j=0, n_tmpids=elts.length;
	    while (j<n_tmpids) {
		var elt=elts[j++]; var id=elt.id;
		if ((id)&&(id.search("sscTMP")===0)) {
		    saved_ids[id]=elt;
		    elt.id=null;}}
	    content="<html>\n"+html.innerHTML+"\n</html>";
	/* Now reset things */
	i=0, lim=apps.length; while (i<lim) {
	    var app=apps[i], crumb=crumbs[i]; i++;
	    crumb.parentNode.replaceChild(app,crumb);}
	for (var tmpid in saved_ids) {
	    if (saved_ids.hasOwnProperty(tmpid)) {
		saved_ids[tmpid].id=tmpid;}}
	/* Now open the save dialog */
	if (content) {
	    var dialog=SSC.Dialog(SSC.Templates.savedialog,
				  {pubpoint: SSC.pubpoint},
				  SSC.Inits.savedialog);
	    var source=bySpec(dialog,"input[NAME='NEWSOURCE']");
	    source.value=content;
	    if (SSC.dialog) SSC.Dialog.close(SSC.dialog);
	    SSC.dialog=dialog;
	    document.body.appendChild(dialog);
	    dialog.style.display='block';}}

    function initpubpoint(){
	var pubpoint=false;
	var head=document.querySelector("HEAD");
	var links=document.querySelectorAll("link");
	var i=0, lim=links.length; while (i<lim) {
	    var link=links[i++];
	    if (((link.rel==="SSC.pubpoint")||
		 (link.rel==="SBOOKS.pubpoint")||
		 (link.rel==="x-pubpoint")||
		 (link.rel==="pubpoint"))&&
		(link.href))
		pubpoint=link.href;}
	if (pubpoint) SSC.pubpoint=pubpoint;}
    SSC.prelaunch=initpubpoint;
    function setupEditor(){
	if (!(SSC.pubpoint)) {
	    var save_button=byID("SSCEDITSAVEBUTTON");
	    if (save_button)
		save_button.parentNode.removeChild(save_button);}}
    SSC.postlaunch=setupEditor;

    SSC.Inits.toolbar[".reclass:click"]=reclass_selector;
    SSC.Inits.toolbar[".save:click"]=save_current;

    function cancel_save(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var dialog=getDialog(target);
	SSC.Dialog.close(dialog);
	cancel(evt);}

    SSC.Inits.savedialog={
	"button[VALUE='CANCEL']:click": cancel_save,
	classname: "sscsavedialog"};

    return Editor;})();
