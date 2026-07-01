run:
	npm run dev

lint:
	npm run lint

test:
	npm run test

test-watch:
	npm run test:watch

install-hooks:
	mkdir -p .git/hooks && ln -sf ../.githooks/pre-commit .git/hooks/pre-commit

install:
	npm install

reset:
	git fetch origin main
	git checkout -B main origin/main

.PHONY: run lint test test-watch install install-hooks reset
