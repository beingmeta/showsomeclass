SSC.Dialog=(function(){

    var make=SSC.Utils.make, text=SSC.Utils.make, fillin=SSC.Utils.fillin, $=SSC.$;
    var addListener=SSC.Utils.addListener, hasClass=SSC.Utils.hasClass, byID=SSC.Utils.byID;
    var make_text=SSC.Utils.make_text;

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
			svg_image.src=SSC.imgroot+"/redx.svgz";
			svg_image.alt="X";}
		    var png_image=make("img","notsvg"); {
			png_image.src=SSC.imgroot+"/redx100x100.png";
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

