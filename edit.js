SSC.Editor=(function(){

    var edit_element_template=
	"<div class='title'>Edit Element</div>"+
	"<select class='ssceditlevel'>\n</select>\n"+
	"<input class='sscspecinput' TYPE='TEXT' NAME='SPEC''/>\n"+
	"<input class='sscstyleinput' TYPE='TEXT' NAME='STYLE'/>\n"+
	"<select class='sscselectors'>\n</select>\n"+
	"<select class='sscreclass'>\n</select>\n"+
	"<table class='sscattributes'>\n</table>\n"+
	"<button>Edit Content</button>\n";

    var edit_selection_template=
	"<textarea name='SSCSELECTION'>{{content}}</textarea>\n"+
	"<div class='choices'>\n"+
	"<button value='CANCEL'>Cancel</button>\n"+
	"<button value='OK'>OK</button>\n"+
	"</div>";

    var edit_content_template=
	"<div class='title'>Edit HTML content</div>"+
	"<select class='ssceditlevel'>\n</select>\n"+
	"<textarea></textarea>\n";

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

    /* When editing a node, you have the option of editing it or any
       of its parents.  The particular parent is the 'level' of the
       edit. */

    /* This just updates the selectbox in the dialog and
       updates the state variable. */
    function setEditLevel(node,dialog){
	if (!(dialog)) dialog=SSC.Editor.dialog;
	if (!(dialog)) return;
	var id=getID(node);
	var option=document.querySelector("[VALUE='"+id+"']");
	if (!(option)) {
	    SSC.Message("Invalid edit node "+getSignature(node));
	    return false;}
	option.selected=true;
	SSC.Editor.node=node;
	return true;}

    function select_edit_level(evt){
	evt=evt||event;
	var target=evt.target||evt.srcElement;
	var dialog=SSC.Editor.dialog;
	if (!(dialog)) {return;/*error*/}
	var idvalue=target.value;
	var value=document.getElementById(idvalue);
	if (!(value)) {return;/*error*/}
	setEditLevel(value,dialog);
	if (hasClass(dialog,"ssceditcontent"))
	    setEditContent(value,dialog);
	else if (hasClass(dialog,"ssceditelement"))
	    setEditElement(value,dialog);
	else {}}

    /* Making edit dialogs */
    
    function makeEditContentDialog(node){
	var dialog=SSC.Dialog(
	    SSC.edit_content_template||edit_content_template,false,
	    {classname: "ssceditcontent"});
	var selectbox=dialog.querySelector(".sscselectlevel");
	initLevelSelector(node,selectbox);
	setEditContent(dialog,node);
	return dialog;}

    var edit_element_template=
	"<select class='ssceditlevel'>\n</select>\n"+
	"<input class='sscspecinput' TYPE='TEXT' NAME='SPEC''/>\n"+
	"<input class='sscstyleinput' TYPE='TEXT' NAME='STYLE'/>\n"+
	"<select class='sscselectors'>\n</select>\n"+
	"<select class='sscreclass'>\n</select>\n"+
	"<table class='sscattributes'>\n</table>\n"+
	"<button>Edit Content</button>\n";

    function makeEditElementDialog(node){
	var dialog=SSC.Dialog(
	    SSC.edit_element_template||edit_element_template,false,
	    {classname: "ssceditelement"});
	var selectbox=dialog.querySelector(".sscselectlevel");
	initLevelSelector(node,selectbox);
	var specinput=dialog.querySelector(".sscspecinput");
	addListener(specinput,"keydown",edit_specinput);
	var styleinput=dialog.querySelector(".sscstyleinput");
	addListener(styleinput,"keydown",edit_styleinput);
	var selectors=dialog.querySelector(".sscselectors");
	addListener(selectors,"change",selectors_changed);
	var reclasser=dialog.querySelector(".sscreclass");
	addListener(reclasser,"change",reclasser_changed);
	var doeditcontent=dialog.querySelector(".sscdoeditcontent");
	addListener(doeditcontent,"click",doeditcontent);
	var attributes=dialog.querySelector("sscattributes");
	addListener(attributes,"onkeydown",edit_attribute);
	return dialog;}

    function makeEditSelectionDialog(node,selection){
	var dialog=SSC.Dialog(
	    SSC.edit_selection_template||edit_selection_template,
	    {selection: "ssceditselection"});
	var choices=dialog.querySelector(".choices");
	addListener(choices,"click",selection_edit_done);
	return dialog;}

    function initLevelSelector(node,selectbox){
	if (!(selectbox)) selectbox=make("select","ssclevel","\n","SSCSELECTLEVEL");
	var scan=node, getID=SSC.getID;
	while ((scan)&&(scan.nodeType===1)&&(scan!==document.body)) {
	    var id=getID(scan); var sig=getSignature(node,true);
	    var option=make("OPTION",false,sig);
	    option.name=id; option.value=id; 
	    if (scan===node) option.selected=true;
	    selectbox.appendChild(option); selectbox.appendChild(text("\n"));
	    scan=scan.parentNode;}
	var selectbox=editbox.querySelector("select");
	var i=0, lim=options.length;
	addListener(selectbox,"change",select_edit_level);
	return selectbox;}
    
    /* Setting dialogs for particular nodes */

    function setEditContent(node,dialog){
	var textarea=dialog.querySelector("TEXTAREA");
	textarea.value=node.innerHTML;}

    function setEditElement(node,dialog){
	var spec=dialog.querySelector(".sscspecinput");
	spec.value=getSignature(node);
	var styletext=(node.style.cssText).trim();
	var styleinput=dialog.querySelector(".sscstyleinput");
	if (styletext) {
	    styleinput.value=styletext;
	    styleinput.style.display='block';}
	else {
	    styleinput.value='';
	    styleinput.style.display='none';}
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
	var attribtable=dialog.querySelector(".sscattribs");
	attribtable.innerHTML="";
	var attributes=node.attributes;
	if (attributes) {
	    i=0; var n_attribs=attributes.length;
	    while (i<n_attribs) {
		var attrib=attributes[i++];
		var tr=make("TR"), th=make("TH",false,attrib.name);
		var input=make("INPUT"); input.type="TEXT"; input.value=attrib.value;
		addListener(input,"keydown",change_attribute);
		var td=make("TD",false,input);
		tr.appendChild(th); tr.appendChild(td);
		attribtable.appendChild(tr);}}
	var new_name=make("INPUT"); {
	    new_name.type="TEXT"; new_name.value=""; new_name.placeholder="Add attrib";}
	var new_value=make("INPUT"); {
	    new_value.type="TEXT"; new_value.value=""; new_value.placeholder="value";}
	attributes.appendChild(
	    make("TR",false,make("TH",false,new_name)));
	attributes.appendChild(make("TD",false,new_value));}

    /* Edit functions */

    /* Setting the current dialog */
    function setDialog(newdialog,closefn){
	if (SSC.dialog) {
	    var dialog=SSC.dialog;
	    SSC.dialog=false;
	    if (SSC.closedialog) {
		var closefn=SSC.closedialog;
		SSC.closedialog=false;
		closefn(dialog);}
	    if (dialog.parentNode)
		dialog.ParentNode.removeChild(dialog);}
	SSC.dialog=newdialog;
	if (closefn) SSC.closedialog=closefn;
	if (newdialog) document.body.appendChild(newdialog);}

    /* Return Editor state and methods */
    return {node: false, base: false, dialog: false};})();
