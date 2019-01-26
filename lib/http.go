package lib

import (
	"encoding/json"
	"encoding/xml"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io/ioutil"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/YijinLiu/label_anywhere/resources"
	"github.com/YijinLiu/logging"
)

type Handler struct {
	mux   *http.ServeMux
	root  string
	mu    sync.RWMutex
	cache map[string]*FolderContent
}

func NewHandler(root string) (*Handler, error) {
	root, err := filepath.Abs(root)
	if err != nil {
		return nil, err
	}
	root, err = filepath.EvalSymlinks(root)
	if err != nil {
		return nil, err
	}
	if !strings.HasSuffix(root, "/") {
		root += "/"
	}
	mux := http.NewServeMux()
	h := &Handler{
		mux:   mux,
		root:  root,
		cache: make(map[string]*FolderContent),
	}
	resources.Install(mux)
	mux.HandleFunc("/list_dir", h.ListDir)
	mux.HandleFunc("/get_image", h.GetImage)
	mux.HandleFunc("/get_ann", h.GetAnnotation)
	mux.HandleFunc("/post_ann", h.PostAnnotation)
	return h, nil
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	logging.Vlog(3, r.URL.String())
	h.mux.ServeHTTP(w, r)
}

func (h *Handler) ListDir(w http.ResponseWriter, r *http.Request) {
	parent, name := r.FormValue("parent"), r.FormValue("name")
	var absDir string
	if parent == "" || name == "" {
		absDir = h.root
	} else {
		var err error
		absDir, err = filepath.EvalSymlinks(filepath.Join(h.root, parent, name))
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		if !strings.HasPrefix(absDir, h.root) {
			http.Error(w, "not authorized", http.StatusUnauthorized)
			return
		}
	}
	dir := filepath.Join(parent, name)
	if dir == "" {
		dir = "/"
	}
	if content, err := h.listDir(dir, absDir, r.FormValue("refresh") != ""); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
	} else if err := ReplyWithJson(content, w, r); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *Handler) listDir(dir, absDir string, refresh bool) (*FolderContent, error) {
	if !refresh {
		if content := h.cachedDir(dir); content != nil {
			return content, nil
		}
	}
	file, err := os.Open(absDir)
	defer file.Close()
	fis, err := file.Readdir(0)
	if err != nil {
		return nil, err
	}
	var result FolderContent
	result.Path = dir
	for _, fi := range fis {
		if !fi.IsDir() && !fi.Mode().IsRegular() {
			continue
		}
		result.Items = append(result.Items, FolderItem{
			Name:  fi.Name(),
			IsDir: fi.IsDir(),
		})
	}
	h.mu.Lock()
	h.cache[dir] = &result
	h.mu.Unlock()
	return &result, nil
}

func (h *Handler) cachedDir(dir string) *FolderContent {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.cache[dir]
}

func (h *Handler) GetImage(w http.ResponseWriter, r *http.Request) {
	parent, name := r.FormValue("parent"), r.FormValue("name")
	if parent == "" || name == "" {
		http.Error(w, `missing parameter "parent" or "name"`, http.StatusBadRequest)
		return
	}
	p, err := filepath.EvalSymlinks(filepath.Join(h.root, parent, name))
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(p, h.root) {
		http.Error(w, "not authorized", http.StatusUnauthorized)
		return
	}
	if contentType := resources.GuessContentType(p); !strings.HasPrefix(contentType, "image/") {
		http.Error(w, `not image`, http.StatusBadRequest)
		return
	}
	http.ServeFile(w, r, p)
}

func (h *Handler) GetAnnotation(w http.ResponseWriter, r *http.Request) {
	p := r.FormValue("path")
	if p == "" {
		http.Error(w, `missing parameter "path"`, http.StatusBadRequest)
		return
	}
	p, err := filepath.EvalSymlinks(filepath.Join(h.root, p))
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(p, h.root) {
		http.Error(w, "not authorized", http.StatusUnauthorized)
		return
	}
	if contentType := resources.GuessContentType(p); !strings.HasPrefix(contentType, "image/") {
		http.Error(w, `not image`, http.StatusBadRequest)
		return
	}
	var ann Annotation
	xmlFile := strings.TrimSuffix(p, filepath.Ext(p)) + ".xml"
	file, err := os.Open(xmlFile)
	if err != nil {
		if os.IsNotExist(err) {
			if f, err := os.Open(p); err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
				return
			} else {
				defer f.Close()
				if img, _, err := image.Decode(f); err != nil {
					http.Error(w, err.Error(), http.StatusUnauthorized)
					return
				} else {
					ann.Filename = filepath.Base(p)
					rect := img.Bounds()
					ann.Size = &ImageSize{
						Width:  uint32(rect.Max.X - rect.Min.X),
						Height: uint32(rect.Max.Y - rect.Min.Y),
						Depth:  3, // assume it's 3
					}
				}
			}
		} else {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
	} else {
		defer file.Close()
		xmlData, err := ioutil.ReadAll(file)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		if err := xml.Unmarshal(xmlData, &ann); err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
	}
	if err := ReplyWithJson(&ann, w, r); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (h *Handler) PostAnnotation(w http.ResponseWriter, r *http.Request) {
	p := r.FormValue("path")
	if p == "" {
		http.Error(w, `missing parameter "path"`, http.StatusBadRequest)
		return
	}
	p, err := filepath.EvalSymlinks(filepath.Join(h.root, p))
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	if !strings.HasPrefix(p, h.root) {
		http.Error(w, "not authorized", http.StatusUnauthorized)
		return
	}
	if contentType := resources.GuessContentType(p); !strings.HasPrefix(contentType, "image/") {
		http.Error(w, `not image`, http.StatusBadRequest)
		return
	}

	jsonData, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	var ann Annotation
	if err := json.Unmarshal(jsonData, &ann); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	xmlFile := strings.TrimSuffix(p, filepath.Ext(p)) + ".xml"
	if len(ann.Objects) == 0 {
		if err := os.Remove(xmlFile); err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		}
	} else if xmlData, err := xml.Marshal(&ann); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else if err := ioutil.WriteFile(xmlFile, xmlData, 0600); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
