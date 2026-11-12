# event-storm-note-taker

[![CI](https://github.com/dominicfarr/event-storm-note-taker/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/dominicfarr/event-storm-note-taker/actions/workflows/ci.yml)

## Development setup

You need:

- [uv](https://docs.astral.sh/uv/)
- pre-commit: `uv tool install pre-commit==4.7.0` (the version CI uses; bump both together)
- shellcheck: `brew install shellcheck`, or `uv tool install shellcheck-py`

Then install the hooks for both the `pre-commit` and `commit-msg` stages:

```sh
pre-commit install --install-hooks
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the commit message format, and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the development practices.
