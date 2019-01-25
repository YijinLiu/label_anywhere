package lib

import (
	"context"
	"crypto/tls"
	"net"
	"net/http"

	"github.com/YijinLiu/label_anywhere/resources"
)

type Server struct {
	httpServer *http.Server
}

func NewServer(addr string, tlsCfg *tls.Config) (*Server, error) {
	mux := http.NewServeMux()
	resources.Install(mux)
	httpServer := &http.Server{
		Addr:    addr,
		Handler: mux,
	}

	if listener, err := net.Listen("tcp", addr); err != nil {
		return nil, err
	} else if tlsCfg != nil {
		go httpServer.Serve(tls.NewListener(listener, tlsCfg))
	} else {
		go httpServer.Serve(listener)
	}
	return &Server{httpServer}, nil
}

func (s *Server) Close() error {
	return s.httpServer.Shutdown(context.Background())
}
