// A simple tool to generate dependency Makefile for .proto and .js files.

package main

import (
	"bufio"
	"flag"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/YijinLiu/logging"
)

var (
	outputFlag = flag.String("output", "", "")
	pbDirFlag  = flag.String("pb-dir", "src/pb", "")
	jsDirFlag  = flag.String("js-dir", "src/resources/js", "")

	jsProvideRe = regexp.MustCompile("^goog.provide[(]'(.+)'[)];$")
	jsRequireRe = regexp.MustCompile("^goog.require[(]'(.+)'[)];$")
	pbImportRe  = regexp.MustCompile(`^import "(.+)";$`)
)

func main() {
	flag.Parse()

	var output io.Writer
	if of := *outputFlag; of != "" {
		if file, err := os.OpenFile(of, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600); err != nil {
			logging.Vlog(-1, err)
		} else {
			output = file
			defer file.Close()
		}
	}
	if output == nil {
		output = os.Stdout
	}

	var errors int

	// Parse files to get dependencies.
	providedBy := map[string]string{}
	requiresMap := map[string][]string{}
	for _, f := range flag.Args() {
		var js, pb bool
		switch filepath.Ext(f) {
		case ".proto":
			pb = true
		case ".js":
			js = true
		default:
			logging.Vlog(-1, "Unknown file type: ", f)
			continue
		}
		var scanner *bufio.Scanner
		if fh, err := os.Open(f); err != nil {
			logging.Vlog(-1, err)
			continue
		} else {
			scanner = bufio.NewScanner(fh)
			defer fh.Close()
		}

		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if pb {
				if matches := pbImportRe.FindStringSubmatch(line); matches != nil {
					requiresMap[f] = append(requiresMap[f], filepath.Join(*pbDirFlag, matches[1]))
				}
			} else if js {
				if matches := jsProvideRe.FindStringSubmatch(line); matches != nil {
					name := matches[1]
					if old, found := providedBy[name]; found {
						logging.Vlogf(0, "'%s' is provided by both '%s' and '%s'.\n", name, old, f)
						errors++
					} else {
						providedBy[name] = f
					}
				} else if matches := jsRequireRe.FindStringSubmatch(line); matches != nil {
					requiresMap[f] = append(requiresMap[f], matches[1])
				}
			}
		}
	}

	// Generate dependencies for every file.
	for _, f := range flag.Args() {
		var base string
		var js, pb bool
		switch filepath.Ext(f) {
		case ".proto":
			pb = true
			base = strings.TrimSuffix(f, ".proto")
		case ".js":
			if !filepath.HasPrefix(f, *jsDirFlag) {
				continue
			}
			js = true
			base = strings.TrimSuffix(f, ".js")
		}

		deps := requiresMap[f]
		for i := 0; i < len(deps); i++ {
			dep := deps[i]
			var moreDeps []string
			if pb {
				moreDeps = requiresMap[dep]
			} else if js {
				if p, found := providedBy[dep]; found {
					moreDeps = requiresMap[p]
				} else {
					logging.Vlogf(0, "%s, which is needed by %s, is not provided by any file!\n",
						dep, f)
					errors++
				}
			}
			for _, d := range moreDeps {
				found := false
				for _, o := range deps {
					if d == o {
						found = true
						break
					}
				}
				if !found {
					deps = append(deps, d)
				}
			}
		}

		for _, dep := range deps {
			var line string
			if pb {
				line = fmt.Sprintf("%s.pb.go %s.pb.js: %s\n", base, base, dep)
			} else if js {
				if p, found := providedBy[dep]; found {
					line = fmt.Sprintf("%s.min.js: %s\n", base, p)
				} else {
					continue
				}
			}
			if _, err := io.WriteString(output, line); err != nil {
				logging.Vlog(-1, err)
			}
		}
	}

	if errors > 0 {
		logging.Vlogf(-1, "Total %d errors.\n", errors)
		os.Exit(1)
	}
}
