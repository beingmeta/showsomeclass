SSC.Editor=(function(){

    var edit_element_template=
	"<div class='title'>Edit Element</div>"+
	"<input class='sscspecinput' TYPE='TEXT' NAME='SPEC''/>\n"+
	"<input class='sscstyleinput' TYPE='TEXT' NAME='STYLE'/>\n"+
	"<select class='sscparents'>\n</select>\n"+
	// "<select class='sscselectors'>\n</select>\n"+
	// "<select class='sscreclass'>\n</select>\n"+
	"<table class='sscattributes'>\n</table>\n"+
	"<div class='buttons'>\n"+
	"\t<button value='UNWRAP'>Unwrap</button>\n"+
	"\t<button value='DELETE'>Delete</button>\n"+
	"\t<button value='CONTENT'>Content</button>\n"+
	"</div>\n"+
	"<select class='sscchildren'>\n</select>\n";

    var edit_selection_template=
	"<textarea name='SSCSELECTION'>{{content}}</textarea>\n"+
	"<div class='buttons'>\n"+
	"\t<button value='CANCEL'>Cancel</button>\n"+
	"\t<button value='OK'>OK</button>\n"+
	"\t<button value='WRAP'>Wrap</button>\n"+
	"</div>\n";

    var edit_content_template=
	"<div class='title'>Edit HTML content</div>"+
	"<textarea></textarea>\n"+
	"<div class='buttons'>\n"+
	"\t<button value='CANCEL'>Cancel</button>\n"+
	"\t<button value='DONE'>Done</button>\n"+
	"</div>\n";

    var reclass_elements_template=
	"<div class='title'>Change all</div>\n"+
	"<table class='sscreclass'>\n"+
	"\t<tr><th>{{count}}</th><td>{{spec}}</td></tr>\n"+
	"\t<tr><th rows='2'>to</th><td><input TYPE='TEXT' NAME='NEWSPEC' VALUE='{{simplespec}}'/></td></tr>\n"+
	"\t<tr><td><select class='sscreclass'></select></td></tr>\n"+
	"</table>\n"+
	"<div class='buttons'>\n"+
	"\t<button value='CANCEL'>Cancel</button>\n"+
	"\t<button value='CHANGE'>Change</button>\n"+
	"</div>\n";

    /* Copying an array (or array-like object, such as a NodeList) into a new array. */

    function copy(input){
	var output=new Array(input.length);
	var i=0, lim=input.length;
	while (i<lim) {output[i]=input[i]; i++;}
	return output;}

    /* Adjusting nodes to match a new selector. */

    // Note that we don't do attributes yet 
    function adjustNode(node,spec){
	var parsed=(spec.trim()).split(/([.])/), tag=parsed[0];
	var absolute=[], adds=[], drops=[];
	var k=1, len=parsed.length; while (k<len) {
	    var class=parsed[k++];
	    if (class[0]==='-') drops.push(class.slice(1));
	    else if (class[0]==='+') adds.push(class.slice(1));
	    else absolute.push(class);}
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
	var dialog=SSC.Dialog(
	    SSC.edit_content_template||edit_content_template,false,
	    {classname: "ssceditcontent",title: getSignature(node)});
	var textarea=dialog.querySelector("TEXTAREA");
	textarea.value=node.innerHTML;
	return dialog;}

    function makeEditElementDialog(node){
	var dialog=SSC.Dialog(
	    SSC.edit_element_template||edit_element_template,false,
	    {classname: "ssceditelement"});
	var specinput=dialog.querySelector(".sscspecinput");
	specinput.value=getSignature(node,false);
	addListener(specinput,"keydown",ee_specinput);

	var styletext=(node.style.cssText).trim();
	var styleinput=dialog.querySelector(".sscstyleinput");
	if (styletext) {
	    styleinput.value=styletext;
	    addListener(styleinput,"keydown",ee_styleinput);}
	else dialog.removeChild(styleinput);

	var up=dialog.querySelector('.sscparents');
	var scan=node; while (scan) {
	    var sig=getSignature(scan), id=getID(scan);
	    var popt=make("OPTION",false,sig); popt.value=sig;
	    up.appendChild(popt);
	    scan=scan.parentNode;}
	addListener(up,"onchange",ee_selected);
	
	var down=dialog.querySelector('.sscchildren'), n_opts=0;
	if (node.childNodes) {
	    var children=node.childNodes;
	    var k=0; var n_children=children.length;
	    while (k<n_children) {
		var child=children[k++];
		if (child.nodeType!==1) continue;
		var id=, sig=;
		var copt=make("OPTION",false,getSignature(child,true));
		copt.value=getID(child);
		down.appendChild(copt);
		n_opts++;}}
	if (n_opts===0) dialog.removeChild(down);
	else addListener(down,"onchange",ee_selected);
	
	/*
	var selectors=dialog.querySelector(".sscselectors");
	addListener(selectors,"change",selectors_changed);
	var selectbox=dialog.querySelector('.sscselectors');
	var selectors=
	    ((node.className)?
	     (SSC.possibleSelectors(node.tagName,node.className.split(/\s+/))):
	     [node.tagName]);
	selectors.sort(function(s1,s2){return s1.length-s2.length;});
	var i=0, n_selectors=selectors.length;
	while (i<n_selectors) {
	    var selector=selectors[i++];
	    var option=make("OPTION",false,selector); option.value=selector;
	    selectbox.appendChild(option);}
	*/

	// var reclasser=dialog.querySelector(".sscreclass");
	// addListener(reclasser,"change",reclasser_changed);

	var buttons=dialog.querySelector(".sscbuttons");
	addListener(buttons,"click",ee_buttonclick);

	var attribtable=dialog.querySelector(".sscattribs"); {
	    var attributes=node.attributes;
	    if (attributes) {
		i=0; var n_attribs=attributes.length;
		while (i<n_attribs) {
		    var attrib=attributes[i++]; var name=attrib.name;
		    if ((name==='ID')||(name==='CLASS')||(name==='STYLE')) continue;
		    var tr=make("TR"), th=make("TH",false,name);
		    var input=make("INPUT"); input.type="TEXT"; {
			input.value=attrib.value; input.sscattribname=name;
			addListener(input,"keydown",ee_attrib);}
		    tr.appendChild(th); tr.appendChild(make("TD",false,input));
		    attribtable.appendChild(tr);}}
	    var new_name=make("INPUT"); {
		new_name.type="TEXT";
		new_name.name="NEWATTRIB";
		new_name.value="";
		new_name.placeholder="add attrib";}
	    var new_value=make("INPUT"); {
		new_value.type="TEXT";
		new_name.name="NEWVALUE";
		new_value.value=""; new_value.placeholder="value";
		addListener(new,"keydown",ee_attrib);}
	    var row=make("TR",false,make("TH",false,new_name));
	    row.appendChild(make("TD",false,new_value));
	    attributes.appendChild(row);}
	return dialog;}

    function makeEditSelectionDialog(node,selection){
	var dialog=SSC.Dialog(
	    SSC.edit_selection_template||edit_selection_template,
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
	var dialog=SSC.Dialog(
	    SSC.edit_content_template||edit_content_template,false,
	    {classname: "sscreclasselements",
	     simplespec: SSC.stripregex(selector),
	     count: selected.length,
	     spec: selector});
	dialog.sscselector=selector;
	return dialog;}

    /* Edit handlers */

    function ee_specinput(evt){
	evt=evt||event;
	var kc=evt.keyCode;
	if (kc===RETURN) {
	    var target=evt.target||evt.srcElement;
	    if ((target)&&(target.value)) {
		var node=adjustNode(SSC.Editor.node);
		if (node) SSC.Editor.node=node;
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
		target.style.display='none';}
	    else SSC.Editor.node.style=newstyle;
	    cancel(evt);
	    return;}}
    function ee_buttonclick(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	while (button) {
	    if (evt.tagName==='BUTTON') break;
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
	    var node=SSC.Editor.node;
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
	    var name=target.sscattribname;
	    var value=target.value.trim();
	    if (!(name)) { /* New attribute */
		var dialog=getDialog(target);
		var attrib_input=
		    dialog.querySelector("INPUT[NAME='NEWATTRIB']");
		if ((attrib_input)&&(attrib_input.value))
		    name=attrib_input.value;
		else {
		    SSC.Message("You need to name the attribute");
		    cancel(evt);
		    return;}}
	    if (value)
		node.setAttribute(name,value);
	    else {
		node.removeAttribute(name,value);
		var row=target;
		while (row) {
		    if (row.tagName==='TR') break;
		    else row=row.parentNode;}
		if ((row)&&(row.parentNode))
		    row.parentNode.removeChild(row);}
	    cancel(evt);}}

    function ec_buttonclick(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	while (button) {
	    if (evt.tagName==='BUTTON') break;
	    else button=button.parentNode;}
	if (!(button)) return;
	if (button.value==='DONE') {
	    var dialog=getDialog(button);
	    var input=dialog.querySelector('TEXTAREA');
	    SSC.Editor.node.innerHTML=input.value;
	    SSC.Dialog.close(SSC.getDialog(button));}
	else if (button.value==='CANCEL') {
	    SSC.Dialog.close(SSC.getDialog(button));}
	else {}}

    function rc_buttonclick(evt){
	evt=evt||event;
	var button=evt.target||evt.srcElement;
	while (button) {
	    if (evt.tagName==='BUTTON') break;
	    else button=button.parentNode;}
	if (!(button)) return;
	if (button.value==='CHANGE') {
	    var dialog=getDialog(button);
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
	    SSC.Dialog.close(SSC.getDialog(button));}
	else if (button.value==='CANCEL') {
	    SSC.Dialog.close(SSC.getDialog(button));}
	else {}}

    /* Setting dialogs for particular nodes */


    /* Edit functions */

    function Editor(arg,dialog){
	var node=false, selector=false;
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
	else {
	    SSC.Message("Not sure what to edit: "+arg+"?");
	    return;}
	var current=SSC.Editor.dialog;
	if (current) {
	    var closefn=SSC.Editor.closefn;
	    SSC.Editor.dialog=false;
	    SSC.Editor.closefn=false;
	    SSC.Editor.node=false;
	    closefn(current);
	    SSC.Dialog.close(current);}
	if (SSC.Editor.node) SSC.Editor.node=false;
	if (node) SSC.Editor.node=node;
	else if (selector) SSC.select(selector);
	else {}
	if (!(dialog)) {
	    if (node)
		SSC.Editor.dialog=dialog=makeEditElementDialog(node);
	    else if (selector)
		SSC.Editor.dialog=dialog=makeReclassDialog(selector);
	    else {}}
	else SSC.Editor.dialog=dialog;}

    Editor.node=false; Editor.dialog=false;

    function editor_click(evt){
	evt=evt||event;
	if (evt.shiftKey) {
	    var node=evt.target||evt.srcElement;
	    while (node) {
		if (node.nodeType===1) {
		    cancel(evt);
		    return Editor(node);}
		else node=node.parentNode;}
	    return false;}
	else return SSC.window_click(evt);}
    SSC.onclick=editor_click;

    return Editor;})();
