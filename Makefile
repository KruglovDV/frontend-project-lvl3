install: install-deps

install-deps:
	npm ci

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

lint:
	npx eslint .

publish:
	npm publish

build:
	npx webpack

start-dev:
	npx webpack-dev-server

.PHONY: test
