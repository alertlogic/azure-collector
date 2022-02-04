.PHONY: all
all: test

deps: node_modules

node_modules:
	npm install

.PHONY: compile
compile: deps
	npm run lint

.PHONY: test
test: compile
	npm run test

.PHONY: clean
clean:
	rm -f test/report.xml
	rm -f package-lock.json
	rm -rf coverage
	rm -rf node_modules
