SHELL:=/bin/bash

ROOT_DIR:=$(shell readlink -f $(dir $(lastword $(MAKEFILE_LIST)))/../../../..)
BIN_DIR:=$(ROOT_DIR)/bin
BUILD_TOOLS_DIR:=$(ROOT_DIR)/build_tools
SRC_DIR:=$(ROOT_DIR)/src/github.com/YijinLiu/label_anywhere
RES_DIR:=$(SRC_DIR)/resources

GO:=GOPATH=$(ROOT_DIR) go

default: $(BIN_DIR)/label_anywhere

$(BIN_DIR)/label_anywhere: $(RES_DIR)/handler.go \
                           $(RES_DIR)/resources.go \
                           $(RES_DIR)/tag.go \
                           $(SRC_DIR)/lib/http.go \
                           $(SRC_DIR)/lib/schema.go \
                           $(SRC_DIR)/main.go
	cd $(ROOT_DIR) ; $(GO) install github.com/YijinLiu/label_anywhere

clean:
	rm -rf $(BIN_DIR) $(RES_DIR)/*.min.js $(RES_DIR)/*.min.css

distclean: clean
	rm -rf $(BUILD_TOOLS_DIR)

$(ROOT_DIR)/src/github.com/YijinLiu/logging:
	cd $(ROOT_DIR) ; $(GO) get github.com/YijinLiu/logging

$(ROOT_DIR)/src/github.com/jteeuwen/go-bindata:
	cd $(ROOT_DIR) ; $(GO) get github.com/jteeuwen/go-bindata

$(ROOT_DIR)/src/github.com/stretchr/testify:
	cd $(ROOT_DIR) ; $(GO) get github.com/stretchr/testify

GO_BINDATA:=$(BIN_DIR)/go-bindata
$(GO_BINDATA): $(ROOT_DIR)/src/github.com/jteeuwen/go-bindata
	cd $(ROOT_DIR) ; $(GO) install github.com/jteeuwen/go-bindata/go-bindata

$(RES_DIR)/tag.go: $(RES_DIR)/draggable.js \
                   $(RES_DIR)/label.css \
                   $(RES_DIR)/label.js
	@ echo -e "\e[0;92mGenerating $@\e[0m ..."
	@ tar c $^ 2>/dev/null | md5sum -b | sed -E 's/^(\S*) .*$$/package resources\nconst Tag = "\1"/' > $@

$(RES_DIR)/resources.go: $(RES_DIR)/label.html \
                         $(RES_DIR)/label.min.js \
                         $(RES_DIR)/label.min.css \
                         $(RES_DIR)/third_party/angularjs-1.6.4.min.js \
                         $(RES_DIR)/third_party/bootstrap-3.3.7.min.css \
                         $(RES_DIR)/third_party/fabric-2.4.6.min.js \
                         $(RES_DIR)/third_party/font_awesome_4.6.2 \
                         $(RES_DIR)/third_party/hammer-2.0.8.min.js | $(GO_BINDATA)
	cd $(RES_DIR) ; $(GO_BINDATA) -o $@ -pkg=resources -prefix=$(RES_DIR) $^


GEN_JS_DEPS:=$(BIN_DIR)/gen_js_deps
$(GEN_JS_DEPS): $(ROOT_DIR)/src/github.com/YijinLiu/label_anywhere/resources/gen_js_deps/main.go \
                $(ROOT_DIR)/src/github.com/YijinLiu/logging
	$(GO) install github.com/YijinLiu/label_anywhere/resources/gen_js_deps


CLOSURE_LIBRARY_DIR:=/usr/local/closure-library/v20170409
CLOSURE_JS_SRCS:=$(CLOSURE_LIBRARY_DIR)/closure/goog/base.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/array/array.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/asserts/asserts.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/debug/error.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/dom/nodetype.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/events/eventtype.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/labs/useragent/browser.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/labs/useragent/device.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/labs/useragent/engine.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/labs/useragent/platform.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/labs/useragent/util.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/object/object.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/reflect/reflect.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/string/string.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/string/stringformat.js \
                 $(CLOSURE_LIBRARY_DIR)/closure/goog/useragent/useragent.js

JS_SRCS:=$(RES_DIR)/draggable.js \
         $(RES_DIR)/label.js \
         $(CLOSURE_JS_SRCS)

$(RES_DIR)/js_deps.mk: $(JS_SRCS) $(GEN_JS_DEPS)
	@ echo -e "\e[0;92mGenerating $@\e[0m ..."
	@ $(GEN_JS_DEPS) --output=$@ $(JS_SRCS) || rm $@

-include $(RES_DIR)/js_deps.mk

CLOSURE_COMPILER:=$(BUILD_TOOLS_DIR)/closure-compiler-v20170409.jar
$(CLOSURE_COMPILER):
	mkdir -p $(BUILD_TOOLS_DIR)
	wget -O $@ "https://drive.google.com/uc?export=download&id=1kAnWk5_4xZNCYPcUVSEbkw_CikH9Hqv0"

JS_COMPILATION_LEVEL?=ADVANCED

$(RES_DIR)/%.min.js: $(RES_DIR)/%.js $(RES_DIR)/extern.js | $(CLOSURE_COMPILER)
	@ echo -e "\e[0;92mCompiling $@\e[0m ..."
	@ java -jar $(CLOSURE_COMPILER) \
	    --angular_pass \
	    --compilation_level=$(JS_COMPILATION_LEVEL) \
	    --define goog.DEBUG=false \
	    --externs=$(RES_DIR)/extern.js \
	    --externs=$(RES_DIR)/js_externs/angular-1.5-http-promise_templated.js \
	    --externs=$(RES_DIR)/js_externs/angular-1.5-q_templated.js \
	    --externs=$(RES_DIR)/js_externs/angular-1.5.js \
	    --externs=$(RES_DIR)/js_externs/angular_ui_router.js \
	    --externs=$(RES_DIR)/js_externs/fabric.ext.js \
	    --externs=$(RES_DIR)/js_externs/ui-bootstrap.js \
	    --process_closure_primitives \
	    --output_wrapper="(function(){%output%})();" \
	    --warning_level=VERBOSE \
	    --entry_point=$(or $(ENTRY_POINT/$*),$*.App) \
	    --js_output_file=$@ $(JS_SRCS) || rm -f $@


YUI_COMPRESSOR_VERSION:=2.4.8
YUI_COMPRESSOR:=$(BUILD_TOOLS_DIR)/yuicompressor-$(YUI_COMPRESSOR_VERSION).jar
$(YUI_COMPRESSOR):
	mkdir -p $(BUILD_TOOLS_DIR)
	cd $(BUILD_TOOLS_DIR) ; wget "https://github.com/yui/yuicompressor/releases/download/v$(YUI_COMPRESSOR_VERSION)/yuicompressor-$(YUI_COMPRESSOR_VERSION).jar"

COMPRESS_CSS:=java -jar $(YUI_COMPRESSOR) --type css

$(RES_DIR)/label.min.css: $(RES_DIR)/label.css | $(YUI_COMPRESSOR)
	@ echo -e "\e[0;92mCompiling $@\e[0m ..."
	@ cat $^ > $@.tmp
	@ $(COMPRESS_CSS) $@.tmp -o $@
	@ rm $@.tmp
