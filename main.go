package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/tls"
	"flag"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/YijinLiu/label_anywhere/lib"
	"github.com/YijinLiu/logging"
)

var (
	addrFlag        = flag.String("addr", ":8080", "")
	dirFlag         = flag.String("dir", "", "The image dir.")
	objListFileFlag = flag.String("obj-list-file", "", "")
	logDirFlag      = flag.String("log-dir", "", "Write log to this dir if not empty.")
)

func main() {
	flag.Parse()

	if logDir := *logDirFlag; logDir != "" {
		if err := logging.RedirectTo(logDir); err != nil {
			logging.Vlog(0, err)
		}
	}

	addr, dir := *addrFlag, *dirFlag
	if addr == "" || dir == "" {
		logging.Fatal("Please provide --addr and --dir")
	}
	var objs []string
	if f := *objListFileFlag; f != "" {
		var err error
		if objs, err = readLines(f); err != nil {
			logging.Vlog(0, err)
		}
	}
	handler, err := lib.NewHandler(dir, objs)
	if err != nil {
		logging.Fatal(err)
	}
	var tlsCfg *tls.Config
	// TODO: Support TLS.
	httpServer := &http.Server{
		Addr:    addr,
		Handler: handler,
	}
	if listener, err := net.Listen("tcp", addr); err != nil {
		logging.Fatal(err)
	} else if tlsCfg != nil {
		go httpServer.Serve(tls.NewListener(listener, tlsCfg))
	} else {
		go httpServer.Serve(listener)
	}
	logging.Printf("Serving @%s ...", addr)
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, os.Kill, syscall.SIGTERM)
	sig := <-c
	logging.Vlogf(0, "Received signal: '%s', exiting ...", sig)
	if err := httpServer.Shutdown(context.Background()); err != nil {
		logging.Vlog(-1, err)
	}
	logging.Close()
}

func readLines(file string) ([]string, error) {
	fileContent, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}
	s := bufio.NewScanner(bytes.NewReader(fileContent))
	var lines []string
	for s.Scan() {
		lines = append(lines, strings.TrimSpace(s.Text()))
	}
	return lines, nil
}
