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

It writes the Stickies with `qwen3:8b` (about 5 GB), served by [Ollama](https://ollama.com) on its default port:

```sh
brew install ollama
brew services start ollama
ollama pull qwen3:8b
```

Run the app on localhost with `npm run dev`. It starts `whisper-server` too, with the model in `WHISPER_MODEL`, and stops it on exit. Sessions are kept in `EVENTSTORM_HOME` (`~/EventStorm` by default). Use Chrome: the page asks the browser for 16 kHz microphone audio, which Firefox may refuse. `npm test`, `npm run check`, `npm run lint` and `npm run build` run the same checks as CI.

## Re-running and scoring a Session

Re-run a Session's Recording through the Scribe without a browser. Each Run goes into a new `runs/<run>/` folder in the Session's folder and leaves earlier Runs alone:

```sh
npm run scribe -- 2026-11-12-ordering-a-takeaway [--model ollama:qwen3:8b]
```

It replays the stored transcript, not the audio, so it tests the Scribe alone. It hears one transcript line at a time, so two Runs with the same Model give the Scribe the same calls.

To score a Run, write the Session's **Expected List** first: `expected.txt` in the Session's folder, with the Domain Events the Domain Expert would have put on the wall, one per line, in domain order. Blank lines are skipped. A line may give other acceptable wordings after a `|`:

```text
Restaurant Chosen
Order Paid | Payment Made
Driver Assigned
```

Then score the Run:

```sh
npm run score -- 2026-11-12-ordering-a-takeaway 2026-11-12T20-54-ollama-qwen3-8b
```

It prints which expected Domain Events the Board caught (and with which Sticky), which it missed, and which Stickies are junk, and writes the same to the Run's `score.json`. A Sticky matches when its words are close to a wording on the line ("Restaurant Selected" catches "Restaurant Chosen"). The match is strict, because Domain Events about the same thing look alike ("Driver Assigned", "Driver Arrived"). When a fair synonym shows as missed and junk, add it to the line after a `|`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the commit message format, and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the development practices.
