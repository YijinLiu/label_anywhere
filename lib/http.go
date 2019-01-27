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
	"sort"
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
	mux.HandleFunc("/del_img", h.DelImage)
	mux.HandleFunc("/get_ann", h.GetAnnotation)
	mux.HandleFunc("/get_img", h.GetImage)
	mux.HandleFunc("/list_dir", h.ListDir)
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
		var objects []string
		if !fi.IsDir() {
			if !fi.Mode().IsRegular() || !isImageFile(fi.Name()) {
				continue
			}
			if ann, err := readAnnotationXmlFile(
				annotationXmlFile(filepath.Join(absDir, fi.Name()))); err != nil {
				if !os.IsNotExist(err) {
					logging.Vlog(0, err)
				}
			} else {
				objects = uniqueObjectNames(ann.Objects)
			}
		}
		result.Items = append(result.Items, FolderItem{
			Name:    fi.Name(),
			IsDir:   fi.IsDir(),
			Objects: objects,
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
	if p := h.getImagePath(w, r); p != "" {
		http.ServeFile(w, r, p)
	}
}

func (h *Handler) DelImage(w http.ResponseWriter, r *http.Request) {
	if p := h.getImagePath(w, r); p != "" {
		if err := delFile(p); err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		if err := delFile(annotationXmlFile(p)); err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		h.removeFromCache(r.FormValue("parent"), r.FormValue("name"))
	}
}

func (h *Handler) GetAnnotation(w http.ResponseWriter, r *http.Request) {
	if p := h.getImagePath(w, r); p != "" {
		var ann *Annotation
		var err error
		if ann, err = readAnnotationXmlFile(annotationXmlFile(p)); err != nil {
			if os.IsNotExist(err) {
				if f, nerr := os.Open(p); nerr != nil {
					err = nerr
				} else {
					defer f.Close()
					if img, _, nerr := image.Decode(f); nerr != nil {
						err = nerr
					} else {
						ann = &Annotation{}
						ann.Filename = filepath.Base(p)
						rect := img.Bounds()
						ann.Size = &ImageSize{
							Width:  uint32(rect.Max.X - rect.Min.X),
							Height: uint32(rect.Max.Y - rect.Min.Y),
							Depth:  3, // assume it's 3
						}
					}
				}
			}
		}
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else if err := ReplyWithJson(&ann, w, r); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (h *Handler) PostAnnotation(w http.ResponseWriter, r *http.Request) {
	if p := h.getImagePath(w, r); p != "" {
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
		xmlFile := annotationXmlFile(p)
		if len(ann.Objects) == 0 {
			if err := os.Remove(xmlFile); err != nil {
				http.Error(w, err.Error(), http.StatusUnauthorized)
			}
			h.removeFromCache(r.FormValue("parent"), r.FormValue("name"))
		} else if xmlData, err := xml.Marshal(&ann); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else if err := ioutil.WriteFile(xmlFile, xmlData, 0600); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		} else {
			h.updateCache(r.FormValue("parent"), r.FormValue("name"),
				uniqueObjectNames(ann.Objects))
		}
	}
}

func (h *Handler) getImagePath(w http.ResponseWriter, r *http.Request) string {
	if parent, name := r.FormValue("parent"), r.FormValue("name"); parent == "" || name == "" {
		http.Error(w, `missing parameter "parent" or "name"`, http.StatusBadRequest)
	} else if p, err := filepath.EvalSymlinks(filepath.Join(h.root, parent, name)); err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
	} else if !strings.HasPrefix(p, h.root) {
		http.Error(w, "not authorized", http.StatusUnauthorized)
	} else if !isImageFile(p) {
		http.Error(w, `not image`, http.StatusBadRequest)
	} else {
		return p
	}
	return ""
}

func (h *Handler) removeFromCache(parent, name string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if content := h.cache[parent]; content != nil {
		for i, item := range content.Items {
			if item.Name == name {
				l := len(content.Items) - 1
				for j := i; j < l; j++ {
					content.Items[j] = content.Items[j+1]
				}
				content.Items = content.Items[:l]
				break
			}
		}
	} else {
		logging.Vlog(0, "Unknown folder: ", parent)
	}
}

func (h *Handler) updateCache(parent, name string, objs []string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if content := h.cache[parent]; content != nil {
		for _, item := range content.Items {
			if item.Name == name {
				item.Objects = objs
				return
			}
		}
		logging.Vlogf(0, "Unknown image %s/%s", parent, name)
	} else {
		logging.Vlog(0, "Unknown folder: ", parent)
	}
}

func annotationXmlFile(imgFile string) string {
	return strings.TrimSuffix(imgFile, filepath.Ext(imgFile)) + ".xml"
}

func readAnnotationXmlFile(xmlFile string) (*Annotation, error) {
	var ann Annotation
	if file, err := os.Open(xmlFile); err != nil {
		return nil, err
	} else {
		defer file.Close()
		if xmlData, err := ioutil.ReadAll(file); err != nil {
			return nil, err
		} else if err = xml.Unmarshal(xmlData, &ann); err != nil {
			return nil, err
		}
	}
	return &ann, nil
}

func delFile(file string) error {
	return os.Rename(file, file+".deleted")
}

func isImageFile(name string) bool {
	switch strings.ToLower(filepath.Ext(name)) {
	case ".jpeg", ".jpg", ".png", ".gif":
		return true
	}
	return false
}

func uniqueObjectNames(objs []*Object) []string {
	var names []string
	if len(objs) > 0 {
		for _, obj := range objs {
			names = append(names, obj.Name)
		}
		sort.Strings(names)
		i := 1
		for j := 1; j < len(names); j++ {
			if names[j] != names[j-1] {
				if i != j {
					names[i] = names[j]
				}
				i++
			}
		}
		names = names[:i]
	}
	return names
}
