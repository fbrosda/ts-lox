.PHONY: all run build clean copy_scheme_files

all: run 

run:
	node bin/index.js

build: copy_scheme_files
	npm i
	npx tsc --build src/tsconfig.json

watch: copy_scheme_files
	npm i
	npx tsc --build src/tsconfig.json --watch

copy_scheme_files:
	mkdir -p bin/scheme
	cp src/scheme/*.scm bin/scheme

clean:
	rm -rf bin/

distclean: clean
	rm -rf node_modules/
