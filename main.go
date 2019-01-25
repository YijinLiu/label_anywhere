package main

import (
	"flag"
	"os"
	"os/signal"
	"syscall"

	"github.com/YijinLiu/label_anywhere/lib"
	"github.com/YijinLiu/logging"
)

var (
	addrFlag = flag.String("addr", ":8080", "")
)

func main() {
	flag.Parse()

	server, err := lib.NewServer(*addrFlag, nil)
	if err != nil {
		logging.Fatal(err)
	}
	logging.Printf("Serving @%s ...", *addrFlag)
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, os.Kill, syscall.SIGTERM)
	sig := <-c
	logging.Vlogf(0, "Received signal: '%s', exiting ...", sig)
	if err := server.Close(); err != nil {
		logging.Vlog(-1, err)
	}
	logging.Close()
}
