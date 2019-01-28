package lib

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"net/http"

	"github.com/YijinLiu/logging"
)

const (
	CONTENT_TYPE_JAVASCRIPT = "application/javascript; charset=utf-8"
	CONTENT_TYPE_JSON       = "application/json; charset=utf-8"
)

type FolderItem struct {
	Name    string   `json:"name"`
	IsDir   bool     `json:"isDir"`
	Objects []string `json:"objects"`
}

type FolderContent struct {
	Path  string        `json:"path"`
	Items []*FolderItem `json:"items"`
}

type ImageSize struct {
	Width  uint32 `json:"width" xml:"width"`
	Height uint32 `json:"height" xml:"height"`
	Depth  uint32 `json:"depth" xml:"depth"`
}

type BoundingBox struct {
	Xmin uint32 `json:"xmin" xml:"xmin"`
	Ymin uint32 `json:"ymin" xml:"ymin"`
	Xmax uint32 `json:"xmax" xml:"xmax"`
	Ymax uint32 `json:"ymax" xml:"ymax"`
}

type Object struct {
	Name   string       `json:"name" xml:"name"`
	Bndbox *BoundingBox `json:"bndbox,omitempty" xml:"bndbox,omitempty"`
}

type Annotation struct {
	XMLName  xml.Name   `xml:"annotation"`
	Filename string     `json:"filename" xml:"filename"`
	Size     *ImageSize `json:"size,omitempty" xml:"size,omitempty"`
	Objects  []*Object  `json:"objects,omitempty" xml:"object,omitempty"`
}

type JsonError struct {
	ErrMsg string `json:"errMsg"`
}

func ReplyWithJsonError(httpCode int, err string, w http.ResponseWriter, r *http.Request) error {
	w.WriteHeader(httpCode)
	return ReplyWithJson(&JsonError{ErrMsg: err}, w, r)
}

func ReplyWithJson(data interface{}, w http.ResponseWriter, r *http.Request) error {
	body, err := json.Marshal(data)
	if err != nil {
		logging.Fatal("Failed to marshal json: ", err)
	}
	// If there is a callback parameter, it's JSONP request
	// (https://en.wikipedia.org/wiki/JSONP).
	if cbName := r.FormValue("callback"); len(cbName) > 0 {
		w.Header().Add("Content-Type", CONTENT_TYPE_JAVASCRIPT)
		body = []byte(fmt.Sprintf("%s(%s)", cbName, string(body)))
	} else {
		w.Header().Add("Content-Type", CONTENT_TYPE_JSON)
	}
	_, err = w.Write(body)
	return err
}
