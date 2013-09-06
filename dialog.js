/* -*- Mode: Javascript; -*- */

/* ################# showsomelcass/dialog.js ###################### */

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

SSC.Dialog=(function(){

    var make=SSC.Utils.make, text=SSC.Utils.make, fillin=SSC.Utils.fillin, $=SSC.$;
    var addListener=SSC.Utils.addListener, hasClass=SSC.Utils.hasClass, byID=SSC.Utils.byID;
    var make_text=SSC.Utils.make_text, getParent=SSC.Utils.getParent;

    function getDialog(elt){
        if ((!(elt.nodeType))&&((elt.target)||(elt.srcElement)))
            elt=((elt.target)||(elt.srcElement));
        return getParent(elt,"sscdialog");}
    SSC.getDialog=getDialog;

    /* Creating a dialog */

    function Dialog(text,data,opts){
        if (typeof text === "string")  {
            if (data) text=fillin(text,data);}
        if (typeof opts === "number") {
            // Assume it's seconds, convert to msecs
            if (opts<100) opts=opts*1000;
            // Divide the delay between wait and finale
            opts={wait: opts/2,finale: opts/2};}
        else if ((!(opts))&&(data)) opts=data;
        else {}
        if (!((opts.hasOwnProperty("timeout"))||
              (opts.hasOwnProperty("wait"))||
              (opts.hasOwnProperty("finale"))))
            opts.keep=true;
        else if ((opts.hasOwnProperty("wait"))&&
                 (opts.hasOwnProperty("finale"))) {}
        else if (opts.hasOwnProperty("timeout")) {
            var timeout=opts.timeout;
            if (opts.hasOwnProperty("wait")) 
                opts.finale=timeout-opts.wait;
            else if (opts.hasOwnProperty("finale"))
                opts.wait=timeout-opts.finale;
            else {
                opts.wait=timeout/3; opts.finale=(2*timeout)/3;}}
        else {}
        // Convert from seconds to milliseconds
        if ((opts.wait)&&(opts.wait<100)) opts.wait=opts.wait*1000;
        if ((opts.finale)&&(opts.finale<100)) opts.finale=opts.finale*1000;
        var classname="sscdialog sscapp";
        if (opts.classname) {
            var custom=opts.classname.trim();
            if (custom.search(/\bsscdialog\b/)<0)
                custom="sscdialog "+custom;
            if (custom.search(/\bsscapp\b/)<0)
                custom="sscapp "+custom;
            classname=custom.replace(/\s+/g," ");}
        var box=make("div",classname,text);
        document.body.appendChild(box);
        if (opts.keep) box.className=box.className+" keep";
        // We do this "old school" with an interval, rather than using
        //  CSS transitions, because the selective display CSS uses
        //  !important opacity definitions which get in the way of the
        //  transitions.
        if (((opts.timeout)||(opts.wait)||(opts.keep))&&
            (!(opts.modal))&&(!(opts.keep))) {
            setupHeader(box,data,opts);
            startClosing(box,opts);}
        SSC.Utils.setupListeners(box,opts);
        return box;}

    function setupHeader(box,data,opts){
        var header=make("div","sscdialogtitle");
        var svg_image=make("img","svg"); {
            svg_image.src=SSC.imgroot+"/redx.svgz";
            svg_image.alt="X";}
        var png_image=make("img","notsvg"); {
            png_image.src=SSC.imgroot+"/redx100x100.png";
            png_image.alt="X";}
        var close_button=make("div","close button"); {
            close_button.appendChild(svg_image);
            close_button.appendChild(png_image);}
        var keep_button=make("DIV","keep button","Keep");
        header.appendChild(close_button);
        header.appendChild(keep_button);
        if (opts.title)
            header.appendChild(make_text(fillin(opts.title),data));
        if (box.firstChild)
            box.insertBefore(header,box.firstChild);
        else box.appendChild(header);
        return header;}

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
            arg=byID(string);
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
            arg=byID(string);
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

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
