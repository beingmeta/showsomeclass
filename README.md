Show Some Class (SSC)
=====================

The **Show Some Class** (SSC) library is a lightweight tool for
exploring and understanding how CSS classes are *used* within a
document as well as how they're defined.  It's especially useful with
documents with messy tangles of too many CSS classes.  These are often
produced by automatic programs such as OCR engines or the HTML
exporters of WYSIWYG editors.

SSC consists of a Javascript and a CSS file which you can embed in a
source HTML file.  Once embedded, they allow you to search for and
highlight elements which match a particular CSS selector and
(optionally) contain text matching a regular expression.  The matched
elements appear normally and the other elements are partially
transparent (allowing you to see the context of the items which
match).  You can tab forward and back through the selected items to
see the places where the selector and regex have matched.

Alternatively, you can also toggle on a **collapsed** view which hides
all unselected items or a **reduced** view which makes their displayed
font smaller.

SSC uses the hash fragment of the current location to indicate the
selector being used.  Selectors are largely as specified in CSS but a
trailing regex (between forward slashes) filters the results to those
whose text contains matches to the regex.

Clicking on the document text uses the class signature of the clicked
item as a selector.  The other functionality is currently available
through keyboard commands:

* `Tab` and `Shift-Tab` move forwards and backwards through selected elements;
* `Escape` gets you out of whatever mode you're in;
* `C` toggles the *collapsed* view;
* `R` toggles the *reduced* view;
* `A` opens up a *cloud view* of all the classes and selectors used in
  the document.
* `Enter` opens up the SSC toolbar with an input field for editing or
  entering a new selector.

I'm also working on SSCEdit, a lightweight tool built on SSC for
making global changes to class usage as well as editing HTML documents
in place.


