// This file defines Handler, which implements http.Handler. It serves an embedded resource
// (HTML, JS, CSS, etc.) as an HTTP file.

package resources

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"

	"github.com/YijinLiu/logging"
)

func Install(mux *http.ServeMux) {
	for _, r := range []FileResource{
		{"/css/bootstrap-3.3.7.min.css", "third_party/bootstrap-3.3.7.min.css", -1},
		{"/css/font-awesome-4.6.2.css", "third_party/font_awesome_4.6.2/font-awesome.css", -1},
		{"/font/fontawesome-webfont-v4.6.2.eot",
			"third_party/font_awesome_4.6.2/fontawesome-webfont.eot", -1},
		{"/font/fontawesome-webfont-v4.6.2.svg",
			"third_party/font_awesome_4.6.2/fontawesome-webfont.svg", -1},
		{"/font/fontawesome-webfont-v4.6.2.ttf",
			"third_party/font_awesome_4.6.2/fontawesome-webfont.ttf", -1},
		{"/font/fontawesome-webfont-v4.6.2.woff",
			"third_party/font_awesome_4.6.2/fontawesome-webfont.woff", -1},
		{"/font/fontawesome-webfont-v4.6.2.woff2",
			"third_party/font_awesome_4.6.2/fontawesome-webfont.woff2", -1},
		{"/js/angularjs-1.6.4.min.js", "third_party/angularjs-1.6.4.min.js", -1},
		{"/js/hammer-2.0.8.min.js", "third_party/hammer-2.0.8.min.js", -1},
		{"/css/label.min.css", "label.min.css", -1},
		{"/js/label.min.js", "label.min.js", -1},
		{"/label.html", "label.html", -1},
	} {
		mux.Handle(r.ServingPath, NewHandler(r))
	}
}

const MAX_CACHE_AGE_SECS = 365 * 24 * 60 * 60

type Handler struct {
	servingPath  string
	content      []byte
	contentType  string
	maxAgeInSecs int
}

type FileResource struct {
	ServingPath  string
	Path         string
	MaxAgeInSecs int
}

func NewHandler(fileRes FileResource) *Handler {
	content, err := Asset(fileRes.Path)
	if err != nil {
		logging.Fatalf("Failed to load '%s': %v", fileRes.Path, err)
	}
	maxAgeInSecs := fileRes.MaxAgeInSecs
	if maxAgeInSecs <= 0 {
		maxAgeInSecs = MAX_CACHE_AGE_SECS
	}
	return &Handler{fileRes.ServingPath, content, guessContentType(fileRes.Path), maxAgeInSecs}
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// This is needed because Golang HTTP server only does prefix match on request URI.
	if r.URL.Path != h.servingPath {
		w.WriteHeader(404)
		return
	}

	w.Header().Add("Cache-Control", fmt.Sprintf("public, max-age=%d", h.maxAgeInSecs))
	if len(h.contentType) > 0 {
		w.Header().Add("Content-Type", h.contentType)
	}
	w.Header().Add("Content-Length", strconv.Itoa(len(h.content)))
	if _, err := w.Write(h.content); err != nil {
		logging.Vlogf(-1, "Error in handling '%s': %v", r.URL, err)
	}
}

var knownExts = map[string]string{
	".css":  "text/css; charset=utf-8",
	".gif":  "image/gif; charset=utf-8",
	".htm":  "text/html; charset=utf-8",
	".html": "text/html; charset=utf-8",
	".ico":  "image/x-icon; charset=utf-8",
	".jpg":  "image/jpeg; charset=utf-8",
	".jpeg": "image/jpeg; charset=utf-8",
	".js":   "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png":  "image/png; charset=utf-8",
}

func guessContentType(fileName string) string {
	ext := filepath.Ext(fileName)
	return knownExts[ext]
}
