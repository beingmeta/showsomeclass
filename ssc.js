/* -*- Mode: Javascript; -*- */

/* ################# showsomelcass/ssc.js ###################### */

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

var SSC=(function(){

    var imgroot="https://static.sbooks.net/showsomeclass/g";
    var Utils={};

    /* Event functions */

    function addListener(node,evtype,handler){
        if (!(node)) return;
        else if (typeof node==="string")
            node=document.getELementById(node);
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
    Utils.addListener=addListener;

    function cancel(evt){
        if (evt.preventDefault) evt.preventDefault();
        else evt.returnValue=false;
        evt.cancelBubble=true;}
    Utils.cancel=cancel;

    /* Key codes */

    var CKEY=Utils.CKEY=0x43;
    var SKEY=Utils.SKEY=0x4b;
    var OPENBRACE=Utils.OPENBRACE=0x7B;
    var CLOSEBRACE=Utils.CLOSEBRACE=0x7D;
    var HKEY=Utils.SKEY=0x48;
    var TAB=Utils.TAB=0x09;
    var RETURN=Utils.RETURN=0x0d;
    var SPACE=Utils.SPACE=0x0a;
    var ESCAPE=Utils.ESCAPE=0x1b;
    var PLUS=Utils.PLUS=187;
    var MINUS=Utils.MINUS=189;
    var QMARK=Utils.QMARK=191;
    var ASTERISK=Utils.ASTERISK=56;
        
    /* DOM utilities */

    function byID(id){return document.getElementById(id);}
    Utils.byID=byID;

    function bySpec(elt,spec,all){
        if (all)
            return elt.querySelectorAll(spec);
        else return elt.querySelector(spec);}
    Utils.bySpec=bySpec;

    /* Assigning temporary IDs */

    var tmpid_count=1;
    /* Track them so we can temporarily remove them */
    var tmpid_elts=[];

    function getID(node){
        if (node.id) return node.id;
        var newid="sscTMP"+(tmpid_count++);
        // This is very unlikely, but let's be obsessive
        while (byID(newid)) newid="sscTMP"+(tmpid_count++);
        node.id=newid;
        tmpid_elts.push(node);
        return node.id;}
    Utils.getID=getID;
    Utils.tmpid_elts=tmpid_elts;

    /* Fillin in text templates */

    function fillin(data,text){ /* Filling in templates */
        if (typeof data === "string") {
            var tmp=data; data=text; text=tmp;}
        if ((!(text))&&(data)&&(data.template)) text=data.template;
        // Maybe a warning?
        if (typeof text !== "string") return;
        var substs=text.match(/{{\w+}}/gm);
        if (substs) {
            var i=0, n=substs.length; while (i<n) {
                var match=substs[i++];
                var prop=match.slice(2,-2);
                var val=((data.hasOwnProperty(prop))&&(data[prop]));
                if (val) text=
                    text.replace(new RegExp(match,"gm"),val.toString());}}
        return text;}
    Utils.fillin=fillin;

    /* Making DOM nodes */

    function make(tag,classname,content,data,opts){
        var elt=document.createElement(tag);
        if (!(opts)) opts=data;
        if (classname) elt.className=classname;
        if (!(content)) {}
        else if ((typeof content === "string")&&(opts))
            elt.innerHTML=fillin(content,data);
        else if (typeof content === "string")
            elt.innerHTML=content;
        else if (content.nodeType)
            elt.appendChild(content);
        else elt.innerHTML=fillin(content);
        if (opts) {
            var match=false, ex;
            if (opts.id) elt.id=opts.id;
            if (opts.title) elt.title=opts.title;
            if (opts.href) elt.href=opts.href;
            if (opts.name) elt.name=opts.name;
            if (opts.src) elt.src=opts.src;
            if (opts.alt) elt.alt=opts.alt;
            setupListeners(elt,opts);}
        return elt;}
    Utils.make=make;

    function make_text(input){
        if (typeof input === "string")
            return document.createTextNode(input);
        else return document.createTextNode(fillin(input));}
    var text=make_text;
    Utils.make_text=Utils.text=text;

    var events_pat=/^(click|keyup|keydown|keypress|change|touchstart|touchmove|touchend|mousedown|mouseup|mousemove|focus|blur)$/;
    var spec_events_pat=
        /^([^:]+):(click|keyup|keydown|keypress|change|touchstart|touchmove|touchend|mousedown|mouseup|mousemove|focus|blur)$/;

    function setupListeners(node,opts){
        var match=false, ex=false;
        for (var key in opts) if (opts.hasOwnProperty(key)) {
            if (events_pat.exec(key))
                addListener(node,key,opts[key]);
            else if ((match=spec_events_pat.exec(key))) {
                var elts=node.querySelectorAll(match[1]);
                addListener(elts,match[2],opts[key]);}
            else {}}
        return node;}
    Utils.setupListeners=setupListeners;

    /* Manipulating node classes */

    var whitespace_pat=/(\s)+/;
    var trimspace_pat=/^(\s)+|(\s)+$/;
    var classpats={};
    /* Returns a Regex for matching a delimited class name */
    function classPat(name){
        var rx=new RegExp("\\b"+name+"\\b","g");
        classpats[name]=rx;
        return rx;}
    Utils.classPat=classPat;
    function addClass(elt,classname){
        if (typeof elt === "string") elt=byID(elt);
        if (!(elt)) return;
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
        if (typeof elt === "string") elt=byID(elt);
        if (!(elt)) return;
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
        if (typeof elt === "string") elt=byID(elt);
        if (!(elt)) return;
        var current=elt.className, pat=classPat(classname);
        if (!(current)) return false;
        else if (current===classname) return true;
        else if (current.search(pat)>=0) return true;
        else return false;}

    function getParent(elt,classname){
        var body=document.body;
        if (typeof elt === "string") elt=byID(elt);
        if (!(elt)) return false;
        else if (!(elt.nodeType)) return false;
        else while (elt) {
            if (elt===body) return false;
            else if ((elt.nodeType===1)&&(hasClass(elt,classname)))
                break;
            else elt=elt.parentNode;}
        return elt||false;}

    Utils.addClass=addClass; Utils.dropClass=dropClass;
    Utils.hasClass=hasClass; Utils.getParent=getParent;

    /* Getting node signatures */

    function getSignature(node,attribs){
        var classname=node.className.replace(/\bssc\w+/g,"").trim();
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
    Utils.getSignature=getSignature;

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
        var match=hybrid_pattern.exec(spec), sel=false, rx=false;
        if (match) {
            sel=match[1];
            rx=new RegExp(match[2].replace(/\\\//g,"/"),match[3]||"mig");}
        else sel=spec;
        var candidates=document.querySelectorAll(sel), output=[];
        var i=0, lim=candidates.length;
        while (i<lim) {
            var node=candidates[i++];
            if (getParent(node,"sscapp")) {}
            else if (getParent(node,"sscmarker")) {}
            else if (!(rx)) output.push(node);
            else if (hasText(node,rx)) output.push(node);}
        return output;}
    
    /* Stripping out the regex part of a hybrid pattern */
    function simplespec(spec){return spec.replace(/\/[^\/]+\//,"");}
    
    /* The state of the selector app. This is also maintained on the
     * SSC object itself. */

    // The CSS selector itself
    var selector=false;
    // The nodes it matches
    var selected=[];
    // Which of those nodes, if any, is the application focus
    var focus=false;
    // The index of the focus in selected.  This is helpful for
    //  tabbing forward and backward in the sequence.
    var focus_index=false;
    // The 'real title' used in constructing new document titles
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
        var wrappers=copy(document.querySelectorAll(".sscWRAPPER"));
        var selected=copy(document.querySelectorAll(".sscSELECTED"));
        var toolbar=document.getElementById("SSCTOOLBAR");
        if (toolbar) addClass(toolbar,"noinput");
        dropClass(wrappers,"sscWRAPPER");
        dropClass(selected,"sscSELECTED");
        selector=false;
        if (SSC.display) SSC.display.innerHTML="";
        selected=[];
        if ((!(real_title))&&(document.title))
            real_title=document.title||"";
        document.title="(showsomeclass) "+real_title;}

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

    /* Selectively display all the nodes matching a spec, update the
       state variables and properties for the app.  The *force*
       argument does it's work even if the spec matches the current
       selector.
    */
    function select(spec,force){
        if (!(spec)) clear();
        else if ((spec===selector)&&(!(force))) return;
        else clear();
        if (!(spec)) {disable(); return;}
        var toolbar=document.getElementById("SSCTOOLBAR");
        if (toolbar) dropClass(toolbar,"noinput");
        var nodes=$(spec);
        var i=0, lim=nodes.length;
        enable(); addClass(document.body,"ssc__TOOLBAR");
        while (i<lim) show(nodes[i++]);
        document.title=spec+" (x"+nodes.length+") "+real_title;
        var input=byID("SSCINPUT"), count=byID("SSCMATCHCOUNT");
        var styleinfo=byID("SSCSTYLEINFO");
        if (input) {
            input.value=spec; input.defaultValue=spec;
            if (toolbar) dropClass(toolbar,"modified");
            input.title="matches "+nodes.length+" elements";}
        if (count) count.innerHTML=""+nodes.length;
        if (styleinfo) {
            var rules=SSC.getStyleInfo(spec);
            if (rules.length===0)
                styleinfo.innerHTML="No matching rules found";
            else styleinfo.innerHTML="";
            var r=0, n_rules=rules.length;
            while (r<n_rules) {
                var rule=rules[r++]; var p=make("p"); var body=rule.indexOf('{');
                p.appendChild(make("strong",false,rule.slice(0,body).trim()));
                p.appendChild(text(" { "));
                var clauses=rule.slice(body+1), semi=clauses.indexOf(';');
                while (semi>0) {
                    p.appendChild(make("span","prop",(clauses.slice(0,semi)).trim()+";"));
                    p.appendChild(text(" "));
                    clauses=clauses.slice(semi+1);
                    semi=clauses.indexOf(';');}
                p.appendChild(text(clauses));
                styleinfo.appendChild(p);}}
        selector=spec;
        selected=nodes;
        if (lim) SSC.focus(nodes[0]);
        window.location.hash="#"+spec;}

    function getOffsetTop(node){
        var off=0; var scan=node;
        while (scan) {
            if (scan.nodeType===1) {
                off=off+scan.offsetTop;}
            scan=scan.offsetParent;}
        return off;}

    /* The FOCUS is used for moving back and forth through the
       selected nodes. */
    function setFocus(node,index){
        if ((node)&&(typeof index!=="number"))
            index=selected.indexOf(node);
        if (byID("SSCMATCHINDEX")) byID("SSCMATCHINDEX").innerHTML=""+(index+1);
        if (focus) dropClass(focus,"sscFOCUS");
        if (node) addClass(node,"sscFOCUS");
        focus=node; focus_index=index;
        if (!(focus)) {}
        else {
            var node_top=getOffsetTop(focus);
            var node_height=focus.offsetHeight;
            var scroll_top=window.scrollY;
            var scroll_height=window.innerHeight;
            if ((node_top<(scroll_top+100))||
                (node_top>(scroll_top+scroll_height)))
                window.scrollTo(0,node_top-100);
            else if (((node_top+node_height)>(scroll_top+scroll_height))&&
                     (node_height<(scroll_height-150))) 
                window.scrollTo(0,(node_top-scroll_height+150)+node_height);
            else {}}}
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
        $: $, simplespec: simplespec,
        Templates: {}, Handlers: {}, Inits: {},
        Utils: Utils, imgroot: imgroot};})();

SSC.updateSelectors=(function(){
    
    var make=SSC.Utils.make, text=SSC.Utils.text, fillin=SSC.Utils.fillin;
    var addListener=SSC.Utils.addListener, byID=SSC.Utils.byID;
    
    function countSelectors(root){
        var counts={}, all=[];
        if (!(root)) root=document.body;
        // Gather all selectors, with frequency counts
        scandom(root,counts,all);
        // Sort by frequency, then length
        all.sort(function(x,y){
            var cx=counts[x], cy=counts[y];
            if (cx===cy) {
                if (x.search(y)>=0) return 1;
                else if (y.search(x)>=0) return -1;
                else return y.length-x.length;}
            else return cy-cx;});
        if (all.length>1) {
            // Remove some redundant entries
            var i=1, lim=all.length;
            var cur=all[0], reduced=[cur];
            var curcount=counts[cur];
            while (i<lim) {
                var sel=all[i++], count=counts[sel];
                if ((count!==curcount)||
                    (cur.search(new RegExp(sel.replace(".","\\.")+"\\b"))<0))
                    reduced.push(sel); cur=sel; curcount=count;}
            counts._all=reduced;}
        else counts._all=all;
        return counts;}
    SSC.countSelectors=countSelectors;

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

    function scandom(node,counts,all){
        var tag=node.tagName; var classname=node.className;
        // Ignore yourself
        if (classname.search(/\bsscapp\b/g)>=0) return;
        classname=classname.replace(/\bssc\w+/g,"");
        classname=classname.replace(/\bsbookauto\w*/g,"");
        classname=classname.trim();
        // Split up classnames
        var classes=(((classname)&&(classname.length))?
                     (classname.split(/\s+/)):[]);
        // Generate applicable selectors
        var selectors=possibleSelectors(tag,classes);
        // Increase the counts for applicable selectors
        var k=0, klim=selectors.length;
        while (k<klim) {
            var sel=selectors[k++];
            if (counts.hasOwnProperty(sel)) counts[sel]++;
            else {counts[sel]=1; all.push(sel);}}
        // Descend the DOM
        if (node.childNodes) {
            var children=node.childNodes;
            var c=0, clim=children.length; while (c<clim) {
                var child=children[c++];
                if (child.nodeType===1) scandom(child,counts,all);}}}

    function updateSelectors(counts,dropbox){
        if (!(counts)) counts=SSC.countSelectors(document.body);
        var all=counts._all; var options=[];
        if (dropbox) dropbox.innerHTML="";
        var i=0, lim=all.length; while (i<lim) {
            var sel=all[i++]; var count=counts[sel];
            var label=((count===1)?(" (one element)"):(" ("+count+" elements)"));
            var option=make("OPTION",false,sel+label);
            option.value=sel; options.push(option);
            if (dropbox) dropbox.appendChild(option);}
        counts._options=options;
        return counts;}

    return updateSelectors;})();

SSC.getStyleInfo=(function(){

    function getRules(sel,results,seen){
        var sheets=document.styleSheets; var i=0, n_sheets=sheets.length;
        var pat=((sel.indexOf('.')>=0)?
                 (new RegExp(sel.replace(".","\\.")+"\\b","gi")):
                 (new RegExp(sel+"[ ,\n]","gi")));
        if (!(results)) results=[];
        while (i<n_sheets) {
            var sheet=sheets[i++];
            if (!(sheet.rules)) continue;
            var rules=sheet.rules; var j=0, n_rules=rules.length;
            while (j<n_rules) {
                var rule=rules[j++], text=rule.cssText;
                if (text.search(/.ssc\w+/g)>=0) continue;
                if (text.search(pat)>=0) {
                    var norm=text.replace(/\s+/g," ");
                    if (seen[norm]) continue; else seen[norm]=norm;
                    results.push(text);}}}
        return results;}

    function getStyleInfo(selector){
        if (selector.indexOf('/')>=0)
            selector=selector.slice(0,selector.indexOf('/'));
        var parsed=selector.split(".");
        var selectors=SSC.possibleSelectors(
            ((parsed[0]!=="")&&(parsed[0])),parsed.slice(1));
        selectors.sort(function(x,y){return x.length-y.length;});
        var results=[], seen={};
        var i=0, lim=selectors.length;
        while (i<lim) getRules(selectors[i++],results,seen);
        return results;}

    getStyleInfo.getRules=getRules;

    return getStyleInfo;})();

(function(){
    var markers={};
    var getID=SSC.Utils.getID;
    var make=SSC.Utils.make;
    var addListener=SSC.Utils.addListener;
    var getSignature=SSC.Utils.getSignature;
    
    function addMarker(node,marker,after){
        var id=getID(node);
        var current=markers[id];
        if (current) current.push(marker);
        else markers[id]=[marker];
        marker.setAttribute("forid",id);
        marker.id=id+"_"+((after)?("AFTER"):("BEFORE"));
        var parent=node.parentNode;
        if (after) {
            if (node.nextSibling)
                parent.insertBefore(marker,node.nextSibling);
            else parent.appendChild(marker);}
        else parent.insertBefore(marker,node);}
    
    function clearMarkers(node){
        var id=getID(node);
        var current=markers[id];
        if (current) {
            var i=0, lim=current.length;
            while (i<lim) {
                var marker=current[i++];
                var parent=marker.parentNode;
                parent.removeChild(marker);}
            markers[id]=[];}}

    function marker(classname,text,node){
        var title=text;
        if (node) {
            var sig=getSignature(node);
            text="<strong>"+text+"</strong>&nbsp;&nbsp;"+"<tt>"+sig+"</tt>";
            title=title+" "+sig;}
        else text="<strong>"+text+"</strong>";
        var m=make("div","sscmarker "+classname,text);
        m.title=title;
        return m;}

    function addMarkerAfter(node,classname,text){
        addMarker(node,marker(classname,text,node),true);}
    function addMarkerBefore(node,classname,text){
        addMarker(node,marker(classname,text,node),false);}

    function addMarkers(node){
        clearMarkers(node);
        var style=window.getComputedStyle(node);
        if (style.pageBreakBefore==='always') {
            addMarkerBefore(node,"sscforcebreakbefore","force break before");}
        if (style.pageBreakBefore==='avoid') {
            addMarkerBefore(node,"sscavoidbreakbefore","avoid break before");}
        if (style.pageBreakAfter==='always') {
            addMarkerAfter(node,"sscforcebreakafter","force break after");}
        if (style.pageBreakAfter==='avoid') {
            addMarkerAfter(node,"sscavoidbreakafter","avoid break after");}
        if (style.pageBreakInside==='avoid') {
            addMarkerAfter(node,"sscavoidbreakinsideafter","avoid break inside");
            addMarkerBefore(node,"sscavoidbreakinsidebefore","avoid break inside");}}
    SSC.addMarkers=addMarkers;
    
    function gatherAllElements(root,into){
        if (root.nodeType!==1) return;
        var classname=root.className;
        if (classname.search(/(sscapp|sscmarker)/gi)>=0)
            return;
        into.push(root);
        if ((root.childNodes)&&(root.childNodes.length)) {
            var children=root.childNodes;
            var i=0, lim=children.length; while (i<lim) {
                var child=children[i++];
                if (child.nodeType===1) gatherAllElements(child,into);}}}

    function addAllMarkers(){
        var elements=[]; gatherAllElements(document.body,elements);
        var i=0, lim=elements.length;
        function step(){
            var started=(new Date()).getTime();
            while ((i<lim)&&((((new Date()).getTime())-started)<100)) 
                addMarkers(elements[i++]);
            if (i<lim) setTimeout(step,50);}
        step();}
                
    addListener(window,"load",addAllMarkers);})();

/* These two templates (for the toolbar and help text) are cut and pasted
   from ssctoolbar.js and sschelp.js, which are automatically generated
   from the corresponding HTML files.  */

SSC.Templates.ssctoolbar=
    "<div id=\"SSCTOOLBARBUTTONS\">\n"+
    "  <button class=\"image scanup\"\n"+
    "          title=\"Go to the previous selected element (shortcut: Shift-Tab)\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/uparrow_white.svgz\" alt=\"Prev\"/>\n"+
    "    <img class=\"notsvg\"\n"+
    "         src=\"{{imgroot}}/uparrow_white100h.png\" alt=\"Prev\"/>\n"+
    "  </button>\n"+
    "  <button class=\"image scandown\"\n"+
    "          title=\"Go to the next selected element (shortcut: Tab)\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/downarrow_white.svgz\" alt=\"Next\"/>\n"+
    "    <img class=\"notsvg\"\n"+
    "         src=\"{{imgroot}}/downarrow_white100h.png\" alt=\"Next\"/>\n"+
    "  </button>\n"+
    "  <button class=\"image showrules\"\n"+
    "          title=\"Show some of the CSS style rules for this selector (shortcut: the 'S' key)\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/stylebraces.svgz\"\n"+
    "         alt=\"Rules\"/>\n"+
    "    <img class=\"notsvg\"\n"+
    "         src=\"{{imgroot}}/stylebraces100x100.png\"\n"+
    "         alt=\"Rules\"/>\n"+
    "  </button>\n"+
    "  <button class=\"image markers\"\n"+
    "          title=\"Show/hide markup markers\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/eye_ondark.svgz\" alt=\"Markers\"/>\n"+
    "    <img class=\"notsvg\" src=\"{{imgroot}}/eye_ondark100x100.png\"\n"+
    "         alt=\"Markers\"/>\n"+
    "  </button>\n"+
    "  <button class=\"image help\" id=\"SSCHELPBUTTON\"\n"+
    "          title=\"Show help (shortcut: the '?' key)\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/help.svgz\" alt=\"Help\"/>\n"+
    "    <img class=\"notsvg\" src=\"{{imgroot}}/help100x100.png\" alt=\"Help\"/>\n"+
    "  </button>\n"+
    "  <button class=\"image hide\">\n"+
    "    <img class=\"svg\" src=\"{{imgroot}}/redx.svgz\"\n"+
    "         title=\"Hide this toolbar\"\n"+
    "         alt=\"Hide\"/>\n"+
    "    <img class=\"notsvg\" src=\"{{imgroot}}/redx100x100.png\"\n"+
    "         alt=\"Hide\"/>\n"+
    "  </button>\n"+
    "</div>\n"+
    "<div class=\"combobox\">\n"+
    "  <input type=\"TEXT\" id=\"SSCINPUT\" NAME=\"SELECTOR\"\n"+
    "         placeholder=\"a CSS selector\"/>\n"+
    "  <select id=\"SSCDROPBOX\" class=\"dropbox\"></select>\n"+
    "</div>\n"+
    "<span class=\"text matchphrase\" id=\"SSCMATCHPHRASE\"\n"+
    "      title=\"Tab/Shift-Tab to move among matches\">\n"+
    "  match#<span id=\"SSCMATCHINDEX\">#</span> of\n"+
    "  <span id=\"SSCMATCHCOUNT\">some</span>\n"+
    "</span>\n"+
    "<span class=\"text inputhelp\" id=\"SSCINPUTHELP\">\n"+
    "  enter a CSS selector (like <samp>P.<em>class</em></samp>)\n"+
    "</span>\n"+
    "<div class=\"styleinfo\" id=\"SSCSTYLEINFO\"></div>\n"+
    "<!--\n"+
    "    /* Emacs local variables\n"+
    "    ;;;  Local variables: ***\n"+
    "    ;;;  indent-tabs-mode: nil ***\n"+
    "    ;;;  End: ***\n"+
    "    */\n"+
    "  -->\n"+
    "";

SSC.Templates.sschelp=
    "<button class=\"image close\">\n"+
    "  <img src=\"{{imgroot}}/redx.svgz\" class=\"svg\"/>\n"+
    "  <img src=\"{{imgroot}}/redx100x100.png\" class=\"notsvg\"/>\n"+
    "</button>\n"+
    "<div class=\"helpcontent\">\n"+
    "  <p><dfn>Show Some Class</dfn> (<abbrev>SSC</abbrev>) exposes how CSS\n"+
    "    classes are applied to a document.</p>\n"+
    "  <p>The <dfn>current selector</dfn> is displayed and changed using the\n"+
    "    text box in the upper left corner.</p>\n"+
    "  <p><dfn>Matching elements</dfn> are highlighted; surrounding\n"+
    "    elements are faded.</p>\n"+
    "  <p>The <dfn>selector</dfn> can be any CSS selector\n"+
    "    (e.g <samp>P.class</samp>), optionally followed by a regular\n"+
    "    expression (e.g. <samp>/pattern/</samp>) matched against element\n"+
    "    content.</p>\n"+
    "  <p><strong>Move among matches</strong> with the <kbd>Tab</kbd>\n"+
    "    and <kbd>Shift-Tab</kbd> keys or the <span class=\"nowrap\">arrow (\n"+
    "    <img src=\"{{imgroot}}/uparrow_white.svgz\" class=\"intext svg\"/>\n"+
    "    <img src=\"{{imgroot}}/uparrow_white100h.png\" class=\"intext\n"+
    "    notsvg\"/> <img src=\"{{imgroot}}/downarrow_white.svgz\"\n"+
    "    class=\"intext svg\"/>\n"+
    "    <img src=\"{{imgroot}}/downarrow_white100h.png\" class=\"intext\n"+
    "    notsvg\"/>) icons.</span></p>\n"+
    "  <p><strong>See <em>(some)</em> style rules</strong> for the current\n"+
    "    selector with <span class=\"nowrap\">the <kbd>S</kbd> key</span> or <span class=\"nowrap\">the\n"+
    "    <img src=\"{{imgroot}}/stylebraces.svgz\" class=\"intext svg\"/>\n"+
    "    <img src=\"{{imgroot}}/stylebraces100x100.png\" class=\"intext\n"+
    "    notsvg\"/> icon.</span></p>\n"+
    "  <p><strong>Click an element</strong> to set the\n"+
    "    <em>current selector</em> from its tag and classes.</p>\n"+
    "  <p><strong>Hide the toolbar</strong> with the <kbd>Escape</kbd> key or\n"+
    "    the <img src=\"{{imgroot}}/redx.svgz\" class=\"intext svg\"/>\n"+
    "    <img src=\"{{imgroot}}/redx100x100.png\" class=\"intext notsvg\"/>\n"+
    "    icon.</p>\n"+
    "  <p><strong>Get it back</strong> with the <kbd>Enter</kbd> key\n"+
    "    or by “clicking” the top of the screen.</p>\n"+
    "</div>\n"+
    "<!--\n"+
    "    /* Emacs local variables\n"+
    "    ;;;  Local variables: ***\n"+
    "    ;;;  indent-tabs-mode: nil ***\n"+
    "    ;;;  End: ***\n"+
    "    */\n"+
    "  -->\n"+
    "\n"+
    "\n"+
    "";

(function(){
    var make=SSC.Utils.make, text=SSC.Utils.make, fillin=SSC.Utils.fillin;
    var hasClass=SSC.Utils.hasClass, addClass=SSC.Utils.addClass;
    dropClass=SSC.Utils.dropClass, getParent=SSC.Utils.getParent;
    var addListener=SSC.Utils.addListener, cancel=SSC.Utils.cancel;
    var bySpec=SSC.Utils.bySpec, byID=SSC.Utils.byID;
    var RETURN=SSC.Utils.RETURN, ESCAPE=SSC.Utils.ESCAPE, TAB=SSC.Utils.TAB;
    var OPENBRACE=SSC.Utils.OPENBRACE, CLOSEBRACE=SSC.Utils.CLOSEBRACE;
    var QMARK=SSC.Utils.QMARK;
    var imgroot=SSC.imgroot;

    var $=SSC.$;

    /* Using the URL hash as a selector */

    function selectHash() {
        var hash=(location)&&(location.hash);
        if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
        SSC.select(hash);}

    addListener(window,"hashchange",selectHash);

    /* The application toolbar */

    function setupToolbar(){
        var toolbar=make("div","sscapp ssctoolbar noinput",
                         SSC.Templates.toolbar||SSC.Templates.ssctoolbar,
                         {imgroot: SSC.imgroot},
                         SSC.Inits.toolbar);
        var dropbox=bySpec(toolbar,"SELECT"); {
            SSC.selectors=SSC.updateSelectors(false,dropbox);}
        var tapzone=make("div","sscapp",false,
                         {id: "SSCTAPZONE",click: showToolbar});
        document.body.appendChild(toolbar);
        document.body.appendChild(tapzone);}

    function showToolbar(evt){
        evt=evt||event;
        SSC.enable();
        addClass(document.body,"ssc__TOOLBAR");
        cancel(evt);}
    function hideToolbar(){
        dropClass("SSCTOOLBAR","showstyle");
        dropClass(document.body,"ssc__TOOLBAR");}
    SSC.showToolbar=showToolbar; SSC.hideToolbar=hideToolbar;

    /* Toolbar event handlers */

    function toggleStyleInfo(){
        if (hasClass("SSCTOOLBAR","showstyle"))
            dropClass("SSCTOOLBAR","showstyle");
        else if (SSC.selector())
            addClass("SSCTOOLBAR","showstyle");}

    function sscinput_focus(){
        sscinput_complete();
        dropClass("SSCTOOLBAR","showstyle");
        addClass("SSCTOOLBAR","focused");}
    function sscinput_blur(){dropClass("SSCTOOLBAR","focused");}

    function sscinput_keydown(evt){
        evt=evt||event;
        var kc=evt.keyCode;
        var target=evt.target||evt.srcElement;
        if (kc===RETURN) {
            var spec=target.value;
            SSC.select(spec,true);
            target.blur();
            cancel(evt);}
        else if (kc===ESCAPE) {
            target.blur(); cancel(evt);}
        else {
            setTimeout(sscinput_complete,50);}}
    
    var selector_complete_string=false;
    function sscinput_complete(){
        var input=byID("SSCINPUT"), dropbox=byID("SSCDROPBOX");
        var toolbar=((input)&&(getParent(input,"sscapp")));
        var prefix=selector_prefix(input.value);
        if (input.value===input.defaultValue) {
            if (toolbar) dropClass(toolbar,"modified");
            dropClass(input,"modified");}
        else {
            if (toolbar) addClass(toolbar,"modified");
            addClass(input,"modified");}
        if (prefix===selector_complete_string) return;
        else selector_complete_string=prefix;
        var selectors=SSC.selectors||
            (SSC.selectors=SSC.updateSelectors());
        var all=selectors._all, options=selectors._options;
        var frag=document.createDocumentFragment();
        var i=0, lim=options.length, matches=0;
        prefix=prefix.toLowerCase();
        if (prefix.length===0) while (i<lim) {
            frag.appendChild(options[i++]);}
        else while (i<lim) {
            var sel=all[i].toLowerCase();
            if ((prefix[0]==='.')?
                (sel.search(prefix)>=0):
                (sel.search(prefix)===0)) {
                frag.appendChild(options[i]); matches++;}
            i++;}
        dropbox.innerHTML="";
        if (matches>7) dropbox.size=7; else dropbox.size=matches+1;
        dropbox.appendChild(frag);}

    function selector_selected(evt){
        evt=evt||event;
        var target=evt.target||evt.srcElement;
        var input=byID("SSCINPUT");
        if (target.value) {
            var text=input.value.trim();
            var comma=text.lastIndexOf(',');
            if (comma<0) SSC.select(target.value);
            else SSC.select(text.slice(0,comma)+','+target.value);
            input.blur();}}
    function selector_prefix(string){
        string=string.trim();
        var comma=string.lastIndexOf(',');
        if (comma<0) return string;
        else return string.slice(comma+1);}

    function scan_forward(evt) {
        var index=SSC.focusIndex();
        var max=SSC.selected().length-1;
        if (max<0) {}
        else if (typeof index === "number") {
            if (index>=max) {}
            else if (index<0) SSC.focus(0);
            else SSC.focus(index+1);}
        else SSC.focus(0);
        if (evt) cancel(evt);}
    SSC.Handlers.scan_forward=scan_forward;

    function scan_backward(evt) {
        var index=SSC.focusIndex();
        var max=SSC.selected().length-1;
        if (max<0) {}
        else if (typeof index === "number") {
            if (index<=0) {}
            else if (index>max)
                SSC.focus(max);
            else SSC.focus(index-1);}
        else SSC.focus(max);
        if (evt) cancel(evt);}
    SSC.Handlers.scan_backward=scan_backward;

    /* Window event handlers */

    var usekeys=[TAB,ESCAPE,RETURN,OPENBRACE,QMARK];
    var commands=SSC.commands={};

    function window_keydown(evt){
        evt=evt||event;
        var key=evt.keyCode;
        var target=evt.target||evt.srcElement;
        if ((usekeys.indexOf(key)<0)&&(!(commands[key])))
            return;
        if ((evt.ctrlKey)||(evt.metaKey)||(evt.altKey)||(evt.altGraphKey))
            return;
        if ((target)&&
            ((target.tagName==='INPUT')||(target.tagName==='TEXTAREA')))
            return;
        if (key===OPENBRACE) {
            if (hasClass(document.body,"ssc__TOOLBAR")) {
                if (hasClass("SSCTOOLBAR","showstyle"))
                    dropClass("SSCTOOLBAR","showstyle");
                else addClass("SSCTOOLBAR","showstyle");}
            else {
                addClass("SSCTOOLBAR","showstyle");
                addClass(document.body,"ssc__TOOLBAR");}}
        else if (key===ESCAPE) {
            var changed=false;
            // Close any windows which are up
            dropClass("SSCTOOLBAR","showstyle");
            dropClass(document.body,"ssc__TOOLBAR");
            if (!(SSC.isenabled())) SSC.enable();
            else {
                if (SSC.focus()) {SSC.focus(false); changed=true;}
                if (!(changed)) {
                    SSC.select(false);
                    SSC.disable();}}}
        else if (key===TAB) {
            if (evt.shiftKey) scan_backward(evt);
            else scan_forward(evt);}
        else if (key===RETURN) {
            addClass(document.body,"ssc__TOOLBAR");
            if (evt.shiftKey) {
                var input=byID("SSCINPUT");
                if (input) input.focus();}}
        else if (key===QMARK) toggleHelp();
        else if (commands[key]) {
            (commands[key])(evt);}
        else return;
        cancel(evt);}
    SSC.window_keydown=window_keydown;

    function window_click(evt){
        evt=evt||event;
        var selection=window.getSelection();
        if ((selection)&&
            ((selection.anchorNode!==selection.focusNode)||
             (selection.anchorOffset!==selection.focusOffset)))
            return;
        var target=evt.target||evt.srcElement;
        var scan=target;
        while (scan) {
            if (hasClass(scan,"sscapp")) return;
            else if (hasClass(scan,"sscmarker")) return;
            else if ((target.tagName==="A")&&(target.href)) return;
            else if (scan===document.body) break;
            else scan=scan.parentNode;}
        if (!(scan)) return; else scan=target;
        while (scan.nodeType!==1) scan=scan.parentNode;
        if (!(scan)) return;
        if ((evt.shiftKey)&&(scan.parentNode)) scan=scan.parentNode;
        if (hasClass(scan,"sscSELECTED")) {
            SSC.focus(scan);
            return;}
        var spec=scan.tagName;
        if ((scan.className)&&(scan.className.length)) {
            var norm=(scan.className.replace(/\bssc\w+\b/g,"")).trim();
            var classes=norm.split(/\s+/);
            if ((classes.length===1)&&
                (classes[0].length===0))
                classes=[];
            if (classes.length) spec=spec+"."+classes.join(".");}
        SSC.select(spec,true);}
    SSC.window_click=window_click;
    
    function toggleHelp(){
        if (hasClass(document.body,"ssc_SHOWHELP"))
            dropClass(document.body,"ssc_SHOWHELP");
        else addClass(document.body,"ssc_SHOWHELP");}
    function hideHelp(evt){
        if (hasClass(document.body,"ssc_SHOWHELP"))
            dropClass(document.body,"ssc_SHOWHELP");
        cancel(evt);}
    SSC.toggleHelp=toggleHelp;
    SSC.hideHelp=hideHelp;

    function toggleMarkers(){
        if (hasClass(document.body,"ssc_HIDEMARKERS"))
            dropClass(document.body,"ssc_HIDEMARKERS");
        else addClass(document.body,"ssc_HIDEMARKERS");}
    function hideMarkers(){
        addClass(document.body,"ssc_HIDMARKERS");}
    SSC.toggleMarkers=toggleMarkers;
    SSC.hideMarkers=hideMarkers;

    SSC.Inits.toolbar={
        id: "SSCTOOLBAR",
        "input:keydown": sscinput_keydown,
        "input:focus": sscinput_focus,
        "input:blur": sscinput_blur,
        "select:change": selector_selected,
        ".markers:click": toggleMarkers,
        ".help:click": toggleHelp,
        ".hide:click": hideToolbar,
        ".showrules:click": toggleStyleInfo,
        ".scanup:click": scan_backward,
        ".scandown:click": scan_forward};

    function setupHelp(){
        var elt=make("div","sscapp sschelp",
                     SSC.Templates.helptext||SSC.Templates.sschelp,
                     {id: "SSCHELP",click: toggleHelp,
                      "button.help:click": hideHelp,
                      imgroot: imgroot});
        document.body.appendChild(elt);}

    // Referencing SSC.nodeclick let's it be overriden by apps using SSC
    function loadSSC(){
        if (SSC.prelaunch) {
            var prelaunchfn=SSC.prelaunch; SSC.prelaunch=false;
            setTimeout(function(){
                prelaunchfn(); SSC.prelaunch=false;
                setTimeout(loadSSC,50);},50);
            return;}
        setupToolbar();
        setupHelp();
        var hash=(location)&&(location.hash);
        if ((hash)&&(hash[0]==="#")) hash=hash.slice(1);
        if (SSC.hasOwnProperty("onclick"))
            addListener(window,"click",SSC.onclick);
        else addListener(window,"click",window_click);
        if (SSC.hasOwnProperty("onselect"))
            addListener(window,"select",SSC.select);
        if (SSC.hasOwnProperty("onkey"))
            addListener(window,"keydown",SSC.onkey);
        else addListener(window,"keydown",window_keydown);
        if ((hash)&&($(hash).length)) {SSC.enable(); SSC.select(hash);}
        if (SSC.selected().length)
            setTimeout(function(){
                SSC.focus((SSC.selected())[0]);},
                       200);
        addClass(document.body,"ssc__TOOLBAR");
        if (!(SSC.donthelp))
            addClass(document.body,"ssc_SHOWHELP");
        if (SSC.postlaunch) {
            var postlaunch=SSC.postlaunch; SSC.postlaunch=false;
            setTimeout(postlaunch,50);}}
    
    addListener(window,"load",loadSSC);})();

/* Emacs local variables
   ;;;  Local variables: ***
   ;;;  indent-tabs-mode: nil ***
   ;;;  End: ***
*/
