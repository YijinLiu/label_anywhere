Label Anywhere
==============
This is a simple browser based image label tool. It aims to minimize mouse clicks and be mobile
friendly.

To use:
<pre>
go get github.com/YijinLiu/label_anywhere
bin/label_anywhere --dir=PATH_TO_IMAGES --addr=":8080" -obj-list-file=OBJ_LIST_FILE
</pre>
Then open http://hostname:8080/label.html in browser.

Keyboard shortcuts:

Shortcut | what does it do
---------|----------------
PageDown | Next image
PageUp   | Previous image
Space    | Generate a default object
Delete   | Delete the active object
Arrow    | Move the active object
Ctrl+Arrow | Increase the size of the active object
Shift+Arrow | Decrease the size of the active object

For developers, after code changes, run
<pre>
make -f src/github.com/YijinLiu/label_anywhere/Makefile
</pre>
