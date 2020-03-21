.PHONY: all run build clean

all: run 

run:
	node bin/index.js

build:
	npm i
	npx tsc --build src/tsconfig.json

watch:
	npm i
	npx tsc --build src/tsconfig.json --watch

clean:
	rm -rf bin/

distclean: clean
	rm -rf node_modules/
