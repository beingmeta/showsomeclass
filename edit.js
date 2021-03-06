/* -*- Mode: Javascript; -*- */

/* ################# showsomelcass/edit.js ###################### */

/* Copyright (C) 2012-2015 beingmeta, inc.

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

    function close_editor(){
        if (SSC.Editor.dialog) {
            SSC.Dialog.close(SSC.Editor.dialog);
            SSC.Editor.dialog=false;}
        SSC.Editor.node=false;
        SSC.Editor.base=false;
        SSC.Editor.selection=false;
        SSC.Editor.selected=false;}

    /* Adjusting nodes to match a new selector. */

    // Note that we don't do attributes yet 
    function adjustNode(node,spec,orig){
        var gotid=((/#[^.#\[ ]+/g).exec(spec)), tag=false, classes=[];
        if (gotid) gotid=gotid[0];
        if (gotid) spec=spec.replace((/#[^.#\[ ]+/g),"");
        var parsed=(spec.trim()).split(/[.]/);
        if (parsed.length===0)
            tag=node.tagName;
        else if (parsed[0]) {
            tag=parsed[0];
            classes=parsed.slice(1);}
        else {
            tag=node.tagName;
            classes=parsed;}
        // Change the tag if needed
        if ((tag)&&(node.tagName.toLowerCase()!==tag.toLowerCase())) {
            // Some implementations don't let you set .tagName,
            //  so we make a new element and do a replace
            var fresh=document.createElement(tag);
            if (node.className) fresh.className=node.className;
            if (node.id) fresh.id=node.id;
            if (node.title) fresh.title=node.title;
            if ((node.style)&&(node.style.cssText))
                fresh.setAttribute("style",node.style.cssText);
            var attribs=node.attributes;
            var i=0, n_attribs=attribs.length;
            while (i<n_attribs) {
                var attrib=attribs[i++];
                if ((['id','class','title','style'].indexOf(
                    attrib.name.toLowerCase()))<0)
                    fresh.setAttribute(attrib.name,attrib.value);}
            var children=copy(node.childNodes);
            var j=0, n_children=children.length;
            while (j<n_children) fresh.appendChild(children[j++]);
            node.parentNode.replaceChild(fresh,node);
            node=fresh;}
        node.className=((classes.length)?(classes.join(" ")):(""));
        if (gotid) node.id=gotid;
        return node;}

    function morphNode(node,newtag,adds,drops){
        // Change the tag if needed
        if (newtag) {
            // Some implementations don't let you set .tagName,
            //  so we make a new element and do a replace
            var fresh=document.createElement(newtag);
            if (node.className) fresh.className=node.className;
            if (node.id) fresh.id=node.id;
            if (node.title) fresh.title=node.title;
            if ((node.style)&&(node.style.cssText))
                fresh.setAttribute("style",node.style.cssText);
            var attribs=node.attributes;
            var i=0, n_attribs=attribs.length;
            while (i<n_attribs) {
                var attrib=attribs[i++];
                if ((['id','class','title','style'].indexOf(
                    attrib.name.toLowerCase()))<0)
                    fresh.setAttribute(attrib.name,attrib.value);}
            var children=copy(node.childNodes);
            i=0; var n_children=children.length;
            while (i<n_children) fresh.appendChild(children[i++]);
            node.parentNode.replaceChild(fresh,node);
            node=fresh;}
        var classname=node.className;
        if (!(classname))
            node.className=adds.join(" ");
        else {
            var j=0, lim=drops.length;
            while (j<lim) {
                var drop=drops[j++];
                if (!(classname)) {}
                else if (classname===drop) classname="";
                else {
                    var drop_pat=new RegExp(
                        "(^"+drop+" |"+" "+drop+" |"+" "+drop+"$)",
                        "g");
                    classname=classname.replace(drop_pat," ");}}
            j=0; lim=adds.length;
            while (j<lim) {
                var add=adds[j++];
                if (!(classname)) classname=add;
                else if (classname.indexOf(" ")<0)
                    classname=classname+" "+add;
                else {
                    var has_pat=new RegExp(
                        "(^"+add+" |"+" "+add+" |"+" "+add+"$)",
                        "g");
                    if (classname.search(has_pat)<0)
                        classname=classname+" "+add;}}
            if (classname)
                classname=classname.replace(/\s+/," ").trim();}
        node.className=classname;
        return node;}

    /* Select spec combo box */
    function classinput_keydown(evt){
        evt=evt||window.event;
        var kc=evt.keyCode;
        var target=evt.target||evt.srcElement;
        if (kc===RETURN) {}
        else if (kc===ESCAPE) {
            target.blur(); cancel(evt);}
        else {
            var box=getParent(target,"classcombobox");
            setTimeout(classinput_complete,50,box);}}
    
    function classinput_complete(box){
        var input=box.querySelector("INPUT"), dropbox=box.querySelector("SELECT");
        var prefix=selector_prefix(input.value);
        var current_prefix=box.getAttribute("data-completed")||"";
        if (prefix===current_prefix) return;
        else box.getAttribute("data-completed",prefix);
        var favorites=SSC.favorites;
        var frag=document.createDocumentFragment();
        var i=0, lim=options.length, matches=0;
        if (prefix.length===0) while (i<lim) {
            frag.appendChild(favorites[i++].cloneNode(true));}
        else while (i<lim) {
            var fave=favorites[i++];
            var value=fave.value;
            if (value.search(prefix)===0) {
                frag.appendChild(fave.cloneNode());
		matches++;}}
        dropbox.innerHTML="";
        if (matches>7) dropbox.size=7; else dropbox.size=matches+1;
        dropbox.appendChild(frag);}

    function classinput_selected(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        var box=getParent(target,"classcombobox");
        var input=box.querySelector("INPUT");
        if (target.value) {
            input.value=target.value;
            classinput_complete(box);}}

    /* Edit Element dialog */
    
    function makeEditElementDialog(node,base){
        var parents=getParents(node||base);
        var children=getChildren(node);

        var dialog=SSC.Dialog(SSC.Templates.editelement,
                              {signature: getSignature(node,true),
                               imgroot: SSC.imgroot},
                              SSC.Inits.editelement);
        var spec_input=dialog.querySelector("INPUT.sscspecinput");
        var styleinfo=getComputedStyle(node);
        if (spec_input) {
            if (styleinfo.display==='inline')
                spec_input.setAttribute("list","INLINESTYLES");
            else if (styleinfo.display==='block')
                spec_input.setAttribute("list","BLOCKSTYLES");}
        
        var styletext=(node.style.cssText).trim();
        var styleinput=dialog.querySelector(".sscstyleinput");
        if (styletext) {
            styleinput.value=styletext;
            addListener(styleinput,"keydown",ee_styleinput);}
        else dialog.removeChild(styleinput);

        var related=dialog.querySelector('.sscrelated'), add_node=true, n=0;
        if (parents.length) {
            var p=parents.length-1;
            while (p>=0) {
                var parent=parents[p--];
                var popt=make("OPTION",false,"@ "+getSignature(parent,true));
                popt.value=getID(parent);
                if (parent===node) {
                    popt.selected=true; add_node=false;}
                related.appendChild(popt); n++;}}
        if (add_node) {
            var opt=make("OPTION",false,"@ "+getSignature(node,true));
            opt.value=getID(node);
            opt.selected=true; related.appendChild(opt); n++;}
        if (children.length) {
            var c=0, n_children=children.length; while (c<n_children) {
                var child=children[c++];
                var prefix=((child===SSC.Editor.base)?("@ *> "):(" @ > "));
                var copt=make("OPTION",false,prefix+getSignature(child,true));
                copt.value=getID(child);
                if (child===SSC.Editor.base) addClass(copt,"sscbase");
                related.appendChild(copt);n++;}}
        if (n<=1) {
            var nav=dialog.querySelector(".sscdomnav");
            nav.parentNode.removeChild(nav);}
        
        addListener(related,"change",ee_selected);
        
        // var reclasser=dialog.querySelector(".sscreclass");
        // addListener(reclasser,"change",reclasser_changed);
        var shown_attribs=0;
        var attribtable=dialog.querySelector(".sscattribs"); {
            var attributes=node.attributes;
            if (attributes) {
                i=0; var n_attribs=attributes.length;
                while (i<n_attribs) {
                    var attrib=attributes[i++]; var name=attrib.name;
                    if ((name==='class')||(name==='style'))
                        continue;
                    var tr=make_attrib_row(name,attrib.value);
                    attribtable.appendChild(tr);
                    shown_attribs++;}}
            if ((shown_attribs>0)&&(shown_attribs<4))
                addClass(dialog,"ssceditattrib");
            attribtable.appendChild(make_attrib_row(false,false));}
        return dialog;}

    var fixed_row=
        "<th>{{attribname}}</th>"+
        ("<td><input TYPE='TEXT' NAME='{{attribname}}' "+
         "VALUE='{{attribval}}'/></td>>");
    var new_row="<tr name='NEW__NEW'>"+
        ("<th><input TYPE='TEXT' NAME='NEW__ATTRIB'"+
         "VALUE='' placeholder='new attribute'/></th>\n")+
        ("<td><input TYPE='TEXT' NAME='NEW__VALUE' "+
         "VALUE='' placeholder='new attribute value'/></td>\n")+
        "</tr>";

    function make_attrib_row(name,value){
        if (name)
            return make("tr",false,fixed_row,
                        {attribname: name,attribval:value},
                        {name: name, "td input:keydown": ee_attrib});
        else return make("tr",false,new_row,
                         {"td input:keydown": ee_attrib,name: "NEW_NEW"});}

    /* Edit Element handlers */
    
    function ee_specinput(evt){
        evt=evt||window.event;
        var kc=evt.keyCode;
        if (kc===ESCAPE) {close_editor(); return;}
        else if (kc===RETURN) {
            var target=evt.target||evt.srcElement;
            if ((target)&&(target.value)) {
                var node=adjustNode(SSC.Editor.node,target.value);
                SSC.Dialog.close(SSC.Editor.dialog);
                set_editnode(false);}
            cancel(evt);}}
    function ee_ok(evt){
        evt=evt||window.event;
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
        if ((styleinput)&&(typeof styleinput.value == "string"))
            node.setAttribute("style",styleinput.value);
        SSC.Dialog.close(SSC.Editor.dialog);
        set_editnode(false);
        cancel(evt);}
    function ee_styleinput(evt){
        evt=evt||window.event;
        var kc=evt.keyCode;
        if (kc===ESCAPE) {close_editor(); return;}
        else if (kc===RETURN) {
            var target=evt.target||evt.srcElement;
            if (!(target)) {cancel(evt); return;}
            var newstyle=target.value.trim();
            if ((!(newstyle))||(newstyle.length===0)) {
                SSC.Editor.node.style='';
                target.style.display='none';}
            else SSC.Editor.node.style=newstyle;
            cancel(evt);
            return;}}
    function ee_expand(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        if (dialog) addClass(dialog,"sscexpanded");}
    function ee_contract(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        if (dialog) dropClass(dialog,"sscexpanded");}
    function ee_buttonclick(evt){
        evt=evt||window.event;
        var button=evt.target||evt.srcElement;
        while (button) {
            if (button.tagName==='BUTTON') break;
            else button=button.parentNode;}
        if (!(button)) return;
        if (button.value==='CLOSE')
            SSC.Dialog.close(SSC.getDialog(button));
        else if (button.value==='ATTRIBS') {
            var dialog=SSC.getDialog(button);
            if (hasClass(dialog,"ssceditattribs"))
                dropClass(dialog,"ssceditattribs");
            else {
                var input=bySpec(dialog,"input[name='NEW__ATTRIB']");
                addClass(dialog,"ssceditattribs");
                if (input) input.focus();}}
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
            Editor(parent);
            SSC.Dialog.close(SSC.getDialog(button));}
        else if (button.value==='CONTENT') {
            Editor(SSC.Editor.node,makeEditContentDialog(SSC.Editor.node));}
        else if (button.value==='DELETE') {
            var dnode=SSC.Editor.node; var blank=text("");
            if (dnode.parentNode) 
                dnode.parentNode.replaceChild(blank,dnode);
            SSC.Dialog.close(SSC.getDialog(button));}
        else {}}
    function ee_attrib(evt){
        evt=evt||window.event;
        var kc=evt.keyCode;
        var target=evt.target||evt.srcElement;
        if (kc===ESCAPE) {close_editor(); return;}
        else if (kc===RETURN) {
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
                    var row=target; while (row) {
                        if (row.tagName==='TR') break;
                        else row=row.parentNode;}
                    if ((row)&&(row.parentNode))
                        row.parentNode.removeChild(row);
                    table.appendChild(make_attrib_row(false,false));}}
            else {
                node.removeAttribute(name);
                todrop=dialog.querySelector("tr[NAME='"+name+"']");
                if ((todrop)&&(todrop.parentNode))
                    todrop.parentNode.removeChild(todrop);}
            cancel(evt);}
        else addClass(target,"sscmodified");}
    function ee_selected(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        var targetid=target.value;
        var gotoelt=document.getElementById(targetid);
        if (gotoelt) {
            cancel(evt); return Editor(gotoelt);}}


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
        var textarea=bySpec(dialog,"TEXTAREA");
        var html=node.innerHTML;
        if ((html.indexOf('<')<0)&&(!(preserveSpace(node))))
            html=html.replace(/\s+/g,' ');
        textarea.value=html;
        return dialog;}

    function ec_done(evt){
        evt=evt||window.event;
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
        if (SSC.Editor.dialog) close_editor();
        var dialog=makeReclassElementsDialog(SSC.selector());
        document.body.appendChild(dialog);
        dropClass(document.body,"ssc_SHOWHELP");
        addClass(document.body,"ssc_RECLASS");
        SSC.Editor.dialog=dialog;}
    Editor.reclass_selector=reclass_selector;

    function specDiffs(selector,newspec,adds,drops){
        var newtag=false;
        var goal=newspec.split(".");
        var spec=selector.split(".");
        if ((goal.length)&&(goal[0]!=="")&&
            (goal[0].toLowerCase()!==spec[0].toLowerCase()))
            newtag=goal[0];
        if (goal.length===0) {
            var j=1; while (j<spec.length) drops.push(spec[j++]);
            return false;}
        goal=goal.slice(1);
        spec=spec.slice(1);
        var i=0, lim=goal.length; while (i<lim) {
            if (spec.indexOf(goal[i])<0) adds.push(goal[i]);
            i++;}
        i=0; lim=spec.length; while (i<lim){
            if (goal.indexOf(spec[i])<0) drops.push(spec[i]);
            i++;}
        return newtag;}

    function rc_done(evt){
        var target=((evt.nodeType)?(evt):
                    ((evt.target)||(evt.srcElement)));
        var dialog=getDialog(target);
        var input=dialog.querySelector('INPUT');
        var newspec=input.value.trim();
        var selector=SSC.selector();
        var selected=SSC.selected();
        var adds=[], drops=[], newtag=specDiffs(selector,newspec,adds,drops);
        var classrx=false;
        var i=0, n_selected=selected.length;
        while (i<n_selected) {
            var sel=selected[i++];
            morphNode(sel,newtag,adds,drops);}
        if (newspec.length)
            setTimeout(function(){SSC.select(newspec,true);},100);
        else setTimeout(function(){SSC.select(selector,true);},100);
        dropClass(document.body,"ssc_RECLASS");
        SSC.Dialog.close(dialog);}
    function rc_unwrap(evt){
        var target=((evt.nodeType)?(evt):
                    ((evt.target)||(evt.srcElement)));
        var dialog=getDialog(target);
        var selector=SSC.selector();
        var selected=SSC.selected();
        var i=0, n_selected=selected.length;
        while (i<n_selected) {
            var sel=selected[i++];
            var frag=document.createDocumentFragment();
            var children=copy(sel.childNodes);
            var j=0, n=children.length;
            while (j<n) frag.appendChild(children[j++]);
            sel.parentNode.replaceChild(frag,sel);}
        setTimeout(function(){SSC.select(selector,true);},100);
        dropClass(document.body,"ssc_RECLASS");
        SSC.Dialog.close(dialog);}

    function rc_keydown(evt){
        evt=evt||window.event;
        var kc=evt.keyCode;
        if (kc===ESCAPE) {close_editor(); return;}
        else if (kc===RETURN) {cancel(evt); rc_done(evt);}}

    SSC.Inits.reclass={
        classname: "sscreclass",
        ".sscnewspec:keydown": rc_keydown,
        "button.close:click":
        function (x) {SSC.Dialog.close(x); dropClass(document.body,"ssc_RECLASS");},
        "button[value='UNWRAP']:click": rc_unwrap,
        "button[value='CHANGE']:click": rc_done};
    
    /* Edit selection */

    function make_selection_editor(range){
        var startnode=range.startnode, endnode=range.endnode;
        var template, inside, init;
        if ((startnode===endnode)&&(range.normstring.length<80)) {
            inside=getHTML(range);
            template=SSC.Templates.textedit;
            init=SSC.Inits.textedit;}
        else {
            inside=false;
            template=SSC.Templates.bigtextedit;
            init=SSC.Inits.bigtextedit||SSC.Inits.textedit;}
        var mergespec=getMergeSpec(range);
        var dialog=SSC.Dialog(template,
                              {imgroot: SSC.imgroot,selection: inside,
                               mergespec:(mergespec||"")},
                              init);
        if (startnode!==endnode) addClass(dialog,"sschtml");
        if (!(inside)) {
            addClass(dialog,"sscbigtext");
            var textarea=bySpec(dialog,'TEXTAREA');
            textarea.value=getHTML(range);}
        return dialog;}

    var ssc_internal_pat=
        /ssc[ABCDEFGHIJKLMNOPQRSTUVWXYZ_]/g;

    function getMergeSpec(range){
        var tag=false, block=false, classes="", use_id=false;
        var start=range.startnode, end=range.endnode, scan=start;
        while (scan) {
            if (scan.nodeType!==1) {scan=scan.nextSibling; continue;}
            var classname=scan.className, id=scan.id;
            var classvec=((classname)?(classname.split(" ")):([]));
            if ((!(use_id))&&(id)&&(id.search("tmp")!==0)) use_id=id;
            if ((tag)&&(block)) {}
            else {
                var style=window.getComputedStyle(scan);
                if (style.display!=='inline') {
                    block=true; tag=scan.tagName;}
                else if (!(tag)) tag=scan.tagName;}
            var i=0, lim=classvec.length;
            while (i<lim) {
                var cl=classvec[i++];
                if (cl.search(ssc_internal_pat)===0) continue;
                else if (classes.search(new RegExp("\\."+cl+"\\b","gi"))<0)
                    classes=classes+"."+cl;}
            if (scan===end) break;
            else scan=scan.nextSibling;}
        if (!(tag)) return false;
        else if ((use_id)&&(classes.length))
            return tag+classes+"#"+use_id;
        else return tag+classes;}

    function preserveSpace(node){
        while (node) {
            if (node.nodeType===1) break;
            else node=node.parentNode;}
        if (!(node)) return true;
        var style=window.getComputedStyle(node);
        var ws=style.whiteSpace;
        return (!((ws==='normal')||(ws==='nowrap')));}

    function safeRange(selection){
        var normstring=selection.toString().replace(/\s+/g," ");
        if ((selection.anchorNode===selection.focusNode)||
            ((selection.anchorNode.parentNode)===
             (selection.focusNode.parentNode)))
            return {startnode: selection.anchorNode,
                    startoff: selection.anchorOffset,
                    endnode: selection.focusNode,
                    endoff: selection.focusOffset,
                    normstring: normstring};
        else {
            var start=selection.anchorNode, end=selection.focusNode;
            var startoff=selection.anchorOffset, endoff=selection.focusOffset;
            var common=getCommon(start,end);
            while (start) {
                if (start.parentNode===common) break;
                else start=start.parentNode;}
            while (end) {
                if (end.parentNode===common) break;
                else end=end.parentNode;}
            if (start.nodeType!==3) startoff=false;
            if (end.nodeType!==3) endoff=false;
            /* Make sure you've got the order right before you make the
               range object. */
            var scan=start;
            while (scan) if (scan===end) break; else scan=scan.nextSibling;
            if (!(scan)) {
                var tmpnode=start, tmpoff=startoff;
                start=end; startoff=endoff;
                end=tmpnode; endoff=tmpoff;}
            return {startnode: start, startoff: startoff,
                    endnode: end, endoff: endoff,
                    normstring: normstring};}}

    /* This should get the HTML for a range, expanding the range if needed. */
    function getHTML(range){
        if (range.startnode===range.endnode) {
            var text=range.startnode.nodeValue.slice(
                range.startoff,range.endoff);
            if (!(preserveSpace(range.startnode)))
                return text.replace(/\s+/g,' ');
            else return text;}
        /* Find the common parent and include all the nodes enclosing
         * the selection. */
        else {
            var start=range.startnode, end=range.endnode;
            if (start.parentNode!==end.parentNode) {
                var common=getCommon(start,end);
                while (start) {
                    if (start.parentNode===common) break;
                    else start=start.parentNode;}
                while (end) {
                    if (end.parentNode===common) break;
                    else end=end.parentNode;}
                range.startnode=start; if (start.nodeType!==3) range.startoff=0;
                range.endnode=end; if (end.nodeType!==3) range.endoff=0;}
            var html="", scan=start;
            /* Get the nodes in the right order */
            while ((scan)&&(scan!==end)) scan=scan.nextSibling;
            if (!(scan)) {var tmp=start; start=end; end=tmp;}
            scan=start;
            if ((range.startoff)&&(scan.nodeType===3)) {
                html=scan.nodeValue.slice(range.startoff);
                scan=scan.nextSibling;}
            while (scan) {
                if (scan.nodeType===3) {
                    if ((scan===end)&&(range.endoff))
                        html=html+scan.nodeValue.slice(0,range.endoff);
                    else html=html+scan.nodeValue;}
                else if (scan.nodeType===1) html=html+scan.outerHTML;
                else {}
                if (scan===end) break;
                else scan=scan.nextSibling;}
            return html;}}

    function getCommon(start,end){
        var scan=start;
        while (scan) {
            if (hasParent(end,scan)) return scan;
            else scan=scan.parentNode;}
        return false;}

    function es_simple_replace(range,edited,tagname,classname){
        var oldnode=range.startnode;
        var parent=oldnode.parentNode;
        var oldtext=oldnode.nodeValue;
        var before=oldtext.slice(0,range.startoff);
        var after=oldtext.slice(range.endoff);
        if (tagname) {
            var frag=document.createDocumentFragment();
            frag.appendChild(make_text(before));
            frag.appendChild(make(tagname,classname,edited));
            frag.appendChild(make_text(after));
            parent.replaceChild(frag,oldnode);}
        else {
            var newtext=make_text(before+edited+after);
            oldnode.parentNode.replaceChild(newtext,oldnode);}
        SSC.Editor.selection=false;
        SSC.Editor.selected=false;
        SSC.Dialog.close(SSC.Editor.dialog);
        SSC.Editor.dialog=false;}

    function es_merge_children(node){
        if ((node.childNodes)&&(node.childNodes.length)) {
            var children=node.childNodes, elts=[], textnode=false;
            var i=0, lim=children.length;
            while (i<lim) elts.push(children[i++]);
            node.innerHTML="";
            i=0; lim=elts.length; while (i<lim) {
                var child=elts[i++];
                if (child.nodeType===3) {
                    if (textnode) {
                        var newtextnode=make_text(textnode.nodeValue+child.nodeValue);
                        node.replaceChild(newtextnode,textnode);
                        textnode=newtextnode;
                        continue;}
                    else {node.appendChild(child); textnode=child; continue;}}
                else if (child.nodeType!==1) {
                    node.appendChild(child); textnode=false; continue;}
                if (child.attributes) {
                    var attribs=child.attributes;
                    var a=0, n_attribs=attribs.length;
                    while (a<n_attribs) {
                        var attrib=attribs[a++];
                        if (!(node.getAttribute(attrib.name)))
                            node.setAttribute(attrib.name,attrib.value);}}
                if ((child.childNodes)&&(child.childNodes.length)) {
                    var grand=child.childNodes; var grandcopy=[];
                    var j=0, n=grand.length;
                    while (j<n) grandcopy.push(grand[j++]);
                    j=0; n=grandcopy.length;
                    while (j<n) {
                        var grandchild=grandcopy[j++];
                        if (grandchild.nodeType===3) {
                            if (textnode) {
                                var newtext=make_text(textnode.nodeValue+grandchild.nodeValue);
                                node.replaceChild(newtext,textnode);
                                textnode=newtext;
                                continue;}
                            else {node.appendChild(grandchild); textnode=grandchild;}}
                        else {
                            node.appendChild(grandchild);
                            textnode=false;}}}
                else node.appendChild(child);}}
        return node;}

    function es_extract_children(node){
        if ((node.childNodes)&&(node.childNodes.length)) {
            var children=node.childNodes, elts=[];
            var i=0, lim=children.length;
            while (i<lim) elts.push(children[i++]);
            var frag=document.createDocumentFragment();
            i=0; lim=elts.length; while (i<lim) frag.appendChild(elts[i++]);
            return frag;}
        else return false;}

    function removeRange(range){
        var startnode=range.startnode, scan=startnode;
        var endnode=range.endnode, insert_before=false;
        if (startnode===endnode) {
            if (startnode.nodeType===3) {
                var text=startnode.nodeValue;
                var parent=startnode.parentNode;
                var before=make_text(text.slice(0,range.startoff));
                var after=make_text(text.slice(range.endoff));
                parent.insertBefore(before,startnode);
                parent.replaceChild(after,startnode);
                return after;}
            else {
                var next=startnode.nextSibling;
                startnode.parentNode.removeChild(node);
                return next;}}
        else if ((range.startoff)&&(startnode.nodeType===3)) {
            // If the first node is a text node and our range is offset,
            //  replace it with a shorter version and move forward.
            var textstart=document.createTextNode(
                startnode.value.slice(0,range.startoff));
            startnode.parentNode.replaceChild(textstart,startnode);
            scan=textstart.nextSibling;}
        // Do the same with a final text node, and also figure
        // out where we'll insert our new node
        if ((range.endoff===0)&&(endnode.nodeType===3))
            insert_before=end_node;
        else if ((range.endoff)&&(endnode.nodeType===3)) {
            var textend=document.createTextNode(
                endnode.value.slice(range.endoff));
            endnode.parentNode.replaceChild(textend,endnode);
            insert_before=text_end;}
        else insert_before=endnode.nextSibling;
        // Proceed along the sibling chain, removing nodes
        // until you come to the insertion point
        var node_parent=scan.parentNode;
        while ((scan)&&(scan!==insert_before)) {
            var next_node=scan.nextSibling;
            node_parent.removeChild(scan);
            scan=next_node;}
        return insert_before;}

    function text_merge(before,after,parent){
        var combined=make_text(before.nodeValue+after.nodeValue);
        parent.replaceChild(combined,before);
        parent.removeChild(after);}

    function es_done(evt){
        evt=evt||window.event; var target=evt.target||evt.srcElement;
        var dialog=getDialog(target), range=SSC.Editor.selection;
        var textinput=dialog.querySelector("textarea[name='SELECTION']");
        var wrapinput=dialog.querySelector("input[name='WRAPSPEC']");
        var mergeinput=dialog.querySelector("input[name='MERGESPEC']");
        var dowrap=hasClass(dialog,"sscwrap"), domerge=hasClass(dialog,"sscmerge");
        var nodespec=
            ((dowrap)?(wrapinput.value.trim()):
             (domerge)?(mergeinput.value.trim()):
             (false));
        var nodetag=false, nodeclass=false;
        if (nodespec) {
            var parsed=nodespec.split(".");
            nodetag=parsed[0]||"span";
            nodeclass=parsed.slice(1).join(" ");}
        if ((range.startnode===range.endnode)&&(range.startnode.nodeType===3)) 
            es_simple_replace(range,textinput.value,nodetag,nodeclass);
        else {
            var parent=range.startnode.parentNode;
            if (nodetag) newnode=make(nodetag,nodeclass,"");
            else newnode=document.createElement(parent.tagName);
            newnode.innerHTML=textinput.value;
            if (domerge) newnode=es_merge_children(newnode);
            else if (dowrap) {}
            else newnode=es_extract_children(newnode);
            var insert_before=removeRange(range);
            var insert_after=((insert_before)?(insert_before.prevSibling):(parent.lastChild));
            // Now, insert the new node
            if (insert_before) parent.insertBefore(newnode,insert_before);
            else parent.appendChild(newnode);
            if ((insert_before)&&(insert_before.nodeType===3)&&
                (insert_before.prevSibling)&&
                (insert_before.prevSibling.nodeType===3))
                text_merge(insert_before.prevSibling,insert_before,parent);
            if ((insert_after)&&(insert_after.nodeType===3)&&
                (insert_after.nextSibling)&&
                (insert_after.nextSibling.nodeType===3))
                text_merge(insert_after,insert_after.nextSibling,parent);}
        SSC.Editor.selection=false;
        SSC.Editor.selected=false;
        SSC.Dialog.close(dialog);}

    function es_keydown(evt){
        var kc=evt.keyCode;
        if (kc===ESCAPE) {close_editor(); return;}
        else if (kc===RETURN) return es_done(evt);}
    function es_cancel(evt){
        evt=evt||window.event; var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        Dialog.close(dialog);
        cancel(evt);}
    function es_wrap_click(evt){
        evt=evt||window.event; var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        if (!(dialog)) return;
        else if (hasClass(dialog,"sscwrap"))
            dropClass(dialog,"sscwrap");
        else {
            var input=bySpec(dialog,"input[name='WRAPSPEC']");
            dropClass(dialog,"sscmerge");
            addClass(dialog,"sscwrap");
            if (input) input.focus();}
        cancel(evt);}
    function es_merge_click(evt){
        evt=evt||window.event; var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        if (!(dialog)) return;
        else if (hasClass(dialog,"sscmerge"))
            dropClass(dialog,"sscmerge");
        else {
            var input=bySpec(dialog,"input[name='MERGESPEC']");
            dropClass(dialog,"sscwrap");
            addClass(dialog,"sscmerge");
            if (input) input.focus();}
        cancel(evt);}

    SSC.Inits.textedit={
        classname: "sscapp ssctextedit",
        "button.ok:click": es_done,
        "button.wrap:click": es_wrap_click,
        "button.close:click": SSC.Dialog.close,
        "input[type='TEXT']:keydown": es_keydown,
        "textarea:keydown": es_keydown};
    SSC.Inits.bigtextedit={
        classname: "sscapp ssctextedit",
        "button.ok:click": es_done,
        "button.wrap:click": es_wrap_click,
        "button.merge:click": es_merge_click,
        "button.close:click": SSC.Dialog.close,
        "input[type='TEXT']:keydown": es_keydown};

    /* Setting up DATALISTs */

    var skip_css=SSC.skip_css;
    var inline_pat=/^(span|em|a|strong|i|b|cite|sup|sub|dfn)[.]/i;
    var block_pat=/^(p|div|blockquote|ul|li|ol)[.]/i;

    function addToDatalist(dl,val){
        var options=dl.querySelectorAll("OPTION");
        var i=0, n=options.length;
        while (i<n) {
            var option=options[i++];
            if (option.value===val) return;}
        var new_option=document.createElement("OPTION");
        new_option.value=val;
        dl.appendChild(new_option);}

    function setupDataLists(){
        var sheets=document.styleSheets;
        var i=0, n_sheets=sheets.length;
        var blocklist=document.getElementById("BLOCKSTYLES");
        var inlinelist=document.getElementById("INLINESTYLES");
        var styleguide=document.getElementById("STYLEGUIDE");
        var blockspecs={}, inlinespecs={};
        while (i<n_sheets) {
            var sheet=sheets[i++], href=sheet.href;
            if (!(sheet.rules)) continue;
            if ((href)&&(href.search(skip_css)>=0)) continue;
            var rules=sheet.rules; var j=0, n_rules=rules.length;
            while (j<n_rules) {
                var rule=rules[j++], seltext=rule.selectorText;
                if (!(seltext)) continue;
                var selectors=seltext.split(",");
                var k=0, n_selectors=selectors.length;
                while (k<n_selectors) {
                    var selector=selectors[k++];
                    if ((selector.indexOf('#')>=0)||
                        (selector.indexOf('[')>=0))
                        continue;
                    var clauses=selector.split(/\s+/g);
                    var c=0, n_clauses=clauses.length;
                    while (c<n_clauses) {
                        var clause=clauses[c++];
                        if (clause.indexOf('.')>=0) {
                            if (clause.search(inline_pat)===0)
                                addToDatalist(inlinelist,clause);
                            if (clause.search(block_pat)===0)
                                addToDatalist(blocklist,clause);
                            addToDatalist(styleguide,clause);}}}}}}

    /* Edit handlers */

    function set_editnode(node){
        if (SSC.Editor.node) {
            // SSC.Editor.node.contentEditable=false;
            dropClass(SSC.Editor.node,"sscEDITING");}
        var base=SSC.Editor.base;
        SSC.Editor.node=node;
        if (node) {
            // node.contentEditable=true;
            if (!((base)&&(hasParent(base,node))))
                SSC.Editor.base=node;}}

    function hasParent(node,parent){
        while (node) {
            if (node===parent) return true;
            else node=node.parentNode;}
        return false;}

    /* Edit functions */

    function Editor(arg,dialog){
        var node=false, selector=false, selection=false;
        dropClass(document.body,"ssc_SHOWSTYLE");
        var source=edit_source(arg);
        if (source) {
            var rootid=document.documentElement.getAttribute("data-sourceid");
            if ((source.getAttribute)&&
                (rootid!==source.getAttribute("data-sourceid"))) {
                alert("This node is externally sourced and cannot be edited");
                return;}}
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
        SSC.Editor.selected=false;
        var current_dialog=SSC.Editor.dialog;
        if (current_dialog) {
            SSC.Editor.dialog=false;
            SSC.Dialog.close(current_dialog);}
        if (node) {
            selector=getSignature(node);
            SSC.select(selector);
            set_editnode(node);}
        else {
            set_editnode(false);
            if (selector) SSC.select(selector);}
        if (selection) {
            var range=safeRange(selection);
            SSC.Editor.selection=range;
            if (range.startnode===range.endnode)
                SSC.Editor.node=range.startnode;
            else SSC.Editor.node=range.startnode.parentNode;
            SSC.Editor.selected=(new Date()).getTime();
            SSC.Editor.dialog=dialog=make_selection_editor(range);}
        else {
            SSC.Editor.selection=false;
            SSC.Editor.selected=false;}
        SSC.setFocus(node);
        if (!(dialog)) {
            if (node)
                SSC.Editor.dialog=dialog=makeEditElementDialog(
                    node,SSC.Editor.base);
            else if (selector)
                SSC.Editor.dialog=dialog=makeReclassDialog(
                    selector);
            else {}}
        else SSC.Editor.dialog=dialog;
        var input=bySpec(dialog,'.sscinitfocus');
        if (input) {
            input.focus();
            input.selectionStart=input.selectionEnd;}}

    function edit_source(arg){
        if (arg.nodeType) {
            var scan=arg; while (scan) {
                if ((scan.getAttribute)&&(scan.getAttribute("data-sourceid"))) 
                    return scan;
                else scan=scan.parentNode;}
            return false;}
        var results=[], src;
        if (arg.anchorNode) {
            src=edit_source(arg.anchorNode);
            if (src) results.push(src);}
        if (arg.focusNode) {
            src=edit_source(arg.focusNode);
            if (src) results.push(src);}
        if (results.length) return results;
        else return false;}

    // App state related fields
    Editor.node=false; Editor.base=false; Editor.dialog=false;

    function editor_click(evt){
        evt=evt||window.event;
        if ((SSC.Editor.selection)&&(SSC.Editor.selected)) {
            var now=(new Date()).getTime();
            if ((now-SSC.Editor.selected)<1000) {
                cancel(evt);
                return;}}
        var selection=window.getSelection();
        if ((selection)&&
            ((selection.anchorNode!==selection.focusNode)||
             (selection.anchorOffset!==selection.focusOffset))) {
            if (selection.anchorNode===selection.focusNode) {
                Editor(selection);}
            return;}
        var target=evt.target||evt.srcElement;
        var scan=target;
        while (scan) {
            if (hasClass(scan,"sscapp")) return;
            else if (hasClass(scan,"sscmarker")) return;
            else if ((!(evt.ctrlKey))&&
                     (((target.tagName==="A")&&(target.href))||
                      (target.onclick)|| (target.tagName==='INPUT')))
                return;
            else if (scan===document.body) break;
            else scan=scan.parentNode;}
        if (!(scan)) return; else scan=target;
        while (scan.nodeType!==1) scan=scan.parentNode;
        if (!(scan)) return;
        var spec=scan.tagName;
        if ((scan.className)&&(scan.className.length)) {
            var norm=(scan.className.replace(/\bssc\w+\b/g,"")).trim();
            var classes=norm.split(/\s+/);
            if ((classes.length===1)&&
                (classes[0].length===0))
                classes=[];
            if (classes.length) spec=spec+"."+classes.join(".");}
        SSC.select(spec,false,true);
        Editor(scan);
        if (hasClass(scan,"sscSELECTED")) SSC.focus(scan);
        addClass(document.body,"ssc__TOOLBAR");}
    SSC.onclick=editor_click;

    function editor_mouseup(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        if (getParent(target,"sscapp")) return;
        var sel=window.getSelection();
        if ((sel)&&
            ((sel.anchorNode!==sel.focusNode)||
             (sel.anchorOffset!==sel.focusOffset))) {
            Editor(window.getSelection());
            cancel(evt);}}

    /* Editing CSS */

    function renderEditableCSSRule(rule,i){
        var rule_id="SSCSTYLERULE"+i;
        var text, sel, body=false, addprop=false;
        var p=make("p","sscstylerule");
        if (typeof rule === "string") {
            text=rule;
            body=text.indexOf('{');
            sel=make("strong",false,text.slice(0,body).trim());}
        else {
            addprop=make("input","addprop");
            addprop.type="text"; addprop.value="";
            addListener(addprop,"keydown",css_addprop_onkey);
            addprop.setAttribute("placeholder","add property: value"); 
            p.appendChild(addprop);
            text=rule.cssText; p.id=rule_id;
            body=text.indexOf('{');
            sel=make("strong","selector",text.slice(0,body).trim());
            sel.setAttribute("contenteditable","true");
            addListener(sel,"keydown",css_selector_onkey);}
        p.appendChild(sel);
        p.appendChild(make_text(" { "));
        if (text.length>40)
            p.appendChild(document.createElement("BR"));
        var clauses=text.slice(body+1), semi=clauses.indexOf(';');
        while (semi>0) {
            var prop_text=clauses.slice(0,semi).trim();
            var colon=prop_text.indexOf(':');
            var propname=((colon>0)&&(prop_text.slice(0,colon).trim()));
            var propval=((colon>0)&&(prop_text.slice(colon+1).trim()));
            var prop=make("span","prop");
            prop.appendChild(make("span","propname",propname+":"));
            prop.appendChild(make_text(" "+propval+";"));
            if ((addprop)&&(propname)) {
                prop.setAttribute("data-propname",propname);
                prop.setAttribute("contenteditable","true");
                addListener(prop,"keydown",css_prop_onkey);}
            p.appendChild(prop);
            p.appendChild(make_text(" "));
            clauses=clauses.slice(semi+1);
            semi=clauses.indexOf(';');}
        p.appendChild(make_text(clauses));
        return p;}
    SSC.renderCSSRule=renderEditableCSSRule;

    var modified_stylesheets=[];
    function stylesheetModified(ss){
        var i=0, lim=modified_stylesheets.length;
        while (i<lim)
            if (ss===modified_stylesheets[i++]) return;
        modified_stylesheets.push(ss);}

    function update_selector(selector){
        var rulenode=selector;
        var selected_rules=SSC.rules();
        while (rulenode) {
            if ((rulenode.className)&&
                (rulenode.className.search(/\bsscstylerule\b/g)>=0))
                break;
            else rulenode=rulenode.parentNode;}
        if ((!(rulenode))||(!(rulenode.id))) return;
        var rulenum=parseInt(rulenode.id.slice("SSCSTYLERULE".length),10);
        var rule=selected_rules[rulenum];
        if ((!(rule))&&(typeof rule === "string")) return;
        rule.selectorText=selector.innerText;
        stylesheetModified(rule.parentStyleSheet);
        rulenode.parentNode.replaceChild(
            renderEditableCSSRule(rule,rulenum),
            rulenode);}
    function css_selector_onkey(evt){
        var target=evt.target||evt.srcElement;
        var kc=evt.keyCode;
        if (kc===13) {
            update_selector(target);
            target.blur();
            cancel(evt);}}

    function update_prop(prop){
        var rulenode=prop;
        var selected_rules=SSC.rules();
        while (rulenode) {
            if ((rulenode.className)&&
                (rulenode.className.search(/\bsscstylerule\b/g)>=0))
                break;
            else rulenode=rulenode.parentNode;}
        if ((!(rulenode))||(!(rulenode.id))) return;
        var rulenum=parseInt(rulenode.id.slice("SSCSTYLERULE".length),10);
        var rule=selected_rules[rulenum];
        if ((!(rule))&&(typeof rule === "string")) return;
        var proptext=prop.innerText;
        if (proptext.indexOf(';')>0)
            proptext=proptext.slice(0,proptext.indexOf(';'));
        proptext=proptext.trim();
        if (proptext.length===0) {
            if (prop.getAttribute("data-propname"))
                delete rule.style[prop.getAttribute("data-propname")];}
        else {
            var colon=proptext.indexOf(':');
            if (colon<=0) return;
            var propname=proptext.slice(0,colon).trim();
            var propval=proptext.slice(colon+1).trim();
            rule.style[propname]=propval;}
        stylesheetModified(rule.parentStyleSheet);
        rulenode.parentNode.replaceChild(
            renderEditableCSSRule(rule,rulenum),
            rulenode);}
    function css_prop_onkey(evt){
        var target=evt.target||evt.srcElement;
        var kc=evt.keyCode;
        if (kc===13) {
            update_prop(target);
            target.blur();
            cancel(evt);}}
    
    function css_addprop_onkey(evt){
        var selected_rules=SSC.rules();
        var target=evt.target||evt.srcElement;
        var kc=evt.keyCode, rulenode=target;
        if (kc!==13) return; else cancel(evt);
        while (rulenode) {
            if ((rulenode.className)&&
                (rulenode.className.search(/\bsscstylerule\b/g)>=0))
                break;
            else rulenode=rulenode.parentNode;}
        if ((!(rulenode))||(!(rulenode.id))) return;
        var rulenum=parseInt(rulenode.id.slice("SSCSTYLERULE".length),10);
        var rule=selected_rules[rulenum];
        if ((!(rule))&&(typeof rule === "string")) return;
        var proptext=target.value;
        if (proptext.indexOf(';')>0)
            proptext=proptext.slice(0,proptext.indexOf(';'));
        proptext=proptext.trim();
        if (proptext.length===0) {
            delete rule.style[prop.title];}
        else {
            var colon=proptext.indexOf(':');
            if (colon<=0) return;
            var propname=proptext.slice(0,colon).trim();
            var propval=proptext.slice(colon+1).trim();
            rule.style[propname]=propval;
            target.value="";}
        stylesheetModified(rule.parentStyleSheet);
        rulenode.parentNode.replaceChild(
            renderEditableCSSRule(rule,rulenum),
            rulenode);}

    function save_current(){
        var content=false;
        var html=document.querySelector('HTML');
        var elts=SSC.Utils.tmpid_elts;
        var cursel=SSC.selector();
        var focus=SSC.getFocus();
        var saved_ids={}, apps=[], crumbs=[];
        var matches=document.querySelectorAll('.sscapp,.sscmarker');
        var bodyclass=document.body.className;
	var app, crumb;
        var i=0, lim=matches.length; while (i<lim) {
            apps.push(matches[i++]);}
        i=0; while (i<lim) {
            app=apps[i]; crumb=make_text("");
            crumbs[i]=crumb;
            app.parentNode.replaceChild(crumb,app);
            i++;}
        var j=0, n_tmpids=elts.length;
        while (j<n_tmpids) {
            var elt=elts[j++]; var id=elt.id;
            if ((id)&&(id.search("sscTMP")===0)) {
                saved_ids[id]=elt;
                elt.id="";}}
        SSC.clear();
        document.body.className=
            bodyclass.replace(
                    /\b(_SSC|_SSCAPP|cxSSC|cxSSCAPP|ssc__\w+)\b/g,"").
            replace(/\s+/," ").trim();
        /* Update any modified style sheets */
        updateModifiedStyleSheets();
        markInjected();
        var docid=html.getAttribute("data-docid");
        if (docid)
            content="<html data-docid='"+docid+"'>\n"+html.innerHTML+"\n</html>";
        else content="<html>\n"+html.innerHTML+"\n</html>";
        /* Now reset things */
        document.body.className=bodyclass;
        SSC.select(cursel,true);
        if (focus) SSC.setFocus(focus);

        i=0; lim=apps.length; while (i<lim) {
            app=apps[i]; crumb=crumbs[i]; i++;
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

    function markInjected(){
        var scripts=document.getElementsByTagName("SCRIPT");
        var i=0, lim=scripts.length; while (i<lim) {
            var script=scripts[i++];
            if (!(script.getAttribute("data-original")))
                script.setAttribute("data-injected","yes");}
        var styles=document.getElementsByTagName("STYLE");
        i=0; lim=styles.length; while (i<lim) {
            var style=styles[i++];
            if (!(style.getAttribute("data-original")))
                style.setAttribute("data-injected","yes");}}

    function updateModifiedStyleSheets(){
        var i=0, n_sheets=modified_stylesheets.length;
        while (i<n_sheets) {
            var sheet=modified_stylesheets[i++];
            var sheet_elt=sheet.ownerNode;
            var sheet_text="";
            var rules=sheet.rules;
            var j=0, n_rules=rules.length;
            while (j<n_rules) {
                var rule=rules[j++];
                sheet_text=sheet_text+rule.cssText+"\n";}
            sheet_elt.innerHTML=sheet_text;}
        modified_stylesheets=[];}

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
        if (pubpoint) SSC.pubpoint=pubpoint;
        // We provide our own help interaction
        SSC.donthelp=true;}
    SSC.prelaunch=initpubpoint;
    function setupEditor(){
        setupDataLists();
        if (window.localStorage) {
            if (!(window.localStorage.getItem("sschidehelp")))
                addClass(document.body,"ssc_SHOWHELP");}
        else if (!(SSC.donthelp))
            addClass(document.body,"ssc_SHOWHELP");
        else {}
        addListener(document.body,"mouseup",editor_mouseup);
        SSC.commands[SSC.Utils.ASTERISK]=reclass_selector;
        if (!(SSC.pubpoint)) {
            var save_button=byID("SSCEDITSAVEBUTTON");
            if (save_button)
                save_button.parentNode.removeChild(save_button);}}
    SSC.postlaunch=setupEditor;

    SSC.Inits.toolbar[".reclass:click"]=function(evt){
        if (hasClass(document.body,"ssc_RECLASS")) {
            if (SSC.Editor.dialog) SSC.Dialog.close(SSC.Editor.dialog);
            dropClass(document.body,"ssc_RECLASS");}
        else reclass_selector(evt);};
    SSC.Inits.toolbar[".save:click"]=save_current;

    SSC.Templates.helptext=SSC.Templates.edithelp;

    function cancel_save(evt){
        evt=evt||window.event;
        var target=evt.target||evt.srcElement;
        var dialog=getDialog(target);
        SSC.Dialog.close(dialog);
        cancel(evt);}

    SSC.Inits.savedialog={
        "button[VALUE='CANCEL']:click": cancel_save,
        classname: "sscsavedialog"};

    return Editor;})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
