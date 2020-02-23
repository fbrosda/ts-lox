.PHONY: all run build clean

all: build 

build:
	npm i
	npx tsc

run:
	node bin/index.js

clean:
	rm -rf bin/

distclean: clean
	rm -rf node_modules/
