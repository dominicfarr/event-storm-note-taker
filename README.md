# event-storm-note-taker

[![CI](https://github.com/dominicfarr/event-storm-note-taker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dominicfarr/event-storm-note-taker/actions/workflows/ci.yml)

## Development setup

You need:

- [Node.js](https://nodejs.org/) 22 or later (`.nvmrc` holds the major version CI uses)
- [uv](https://docs.astral.sh/uv/)
- pre-commit: `uv tool install pre-commit==4.7.0` (the version CI uses; bump both together)
- shellcheck: `brew install shellcheck`, or `uv tool install shellcheck-py`

Then install the npm packages (the hooks run eslint, prettier, svelte-check and vitest from `node_modules`), and the hooks for both the `pre-commit` and `commit-msg` stages:

```sh
npm ci
pre-commit install --install-hooks
```

The Scribe transcribes with [whisper.cpp](https://github.com/ggml-org/whisper.cpp):

```sh
brew install whisper.cpp
mkdir -p ~/models/whisper
curl -L -o ~/models/whisper/ggml-small.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.en.bin
cp .env.example .env   # then adjust the paths if yours differ
```

Run the app on localhost with `npm run dev`. It starts `whisper-server` too, with the model in `WHISPER_MODEL`, and stops it on exit. Sessions are kept in `EVENTSTORM_HOME` (`~/EventStorm` by default). Use Chrome: the page asks the browser for 16 kHz microphone audio, which Firefox may refuse. `npm test`, `npm run check`, `npm run lint` and `npm run build` run the same checks as CI.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the commit message format, and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the development practices.
