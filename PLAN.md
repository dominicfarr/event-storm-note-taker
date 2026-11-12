# Plan

Terms are defined in [GLOSSARY.md](GLOSSARY.md). How work is done is in [CONTRIBUTING.md](CONTRIBUTING.md) and [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

## Vision

A Scribe that listens to a remote Event Storming Session and draws the Board as people talk: the Stickies that would traditionally be written on coloured cards just appear, so the conversation stays natural. The Board is an infinite canvas with a view per Phase, zoom and scroll, editing and printing, and it is versionable. A personal tool, at the Big Picture level.

## Current stage: can it work?

Prove that a Scribe can turn a spoken Big Picture conversation into a useful Board, cheaply and locally.

### Scope

- **Input:** one Domain Expert talking the domain through on the microphone. No group, no call.
- **Recordings:** every new Session keeps its audio as a Recording, with the moment each Phase began. A Recording can be re-run as many times as wanted; each Run produces a new Board and leaves earlier ones alone. A re-run goes at real-time speed (for a demo) or as fast as the pipeline allows (for testing).
- **Phases:** Kick Off, Chaotic Exploration, Enforce the Timeline. The Domain Expert changes Phase with a click.
- **Sticky kinds:** Domain Event, Hot Spot, Pivotal Event. Kick Off produces the Scope and Goal instead of Stickies; the Scribe uses the Scope to ignore off-topic talk later.
- **Repeats:** saying the same thing again adds a Mention to the existing Sticky. Different wordings stay separate Stickies in Chaotic Exploration; in Enforce the Timeline the Scribe merges them when the conversation agrees they are the same.
- **The Scribe** is silent: its only output is the Board. It may revise or remove Stickies it placed, until a human edits one. A Sticky appears about 5–15 seconds after it is said.
- **Views**, each available at any time, defaulting to the current Phase's:
  - Kick Off: the Scope and Goal as two text panels.
  - Chaotic Exploration: Domain Events and Hot Spots in a loose grid in spoken order, the newest highlighted for a few seconds.
  - Enforce the Timeline: Domain Events left to right in domain order, Pivotal Events as vertical dividers, each Hot Spot pinned beside the Sticky it concerns.
- **Editing:** change a Sticky's text or kind, delete, drag, or add one by hand. Any edit makes the Sticky the human's.
- **Printing:** export the current view as PNG or PDF.

### Success test

Next to each Recording sits an **expected list**: a plain-text file of the Domain Events, in order, that the Domain Expert would have put on the wall. A script compares a Run's Board with it and reports what was caught, what was missed, and how many Stickies were junk, matching wording fuzzily ("Order Submitted" counts as "Order Placed"). It can work when Runs on the first Recordings catch most expected Domain Events, with few junk Stickies and a plausible timeline after Enforce the Timeline.

Recordings start small and simple, then grow in complexity and domain:

1. Ordering a takeaway.
2. Making instant soup.
3. Larger, messier domains, once the first two score well.

### Technical shape

- **Stack:** JS/TS (Svelte). A SvelteKit app run on localhost only; its server routes talk to the local services. No hosting.
- **Audio:** the browser's microphone, captured as about 5-second chunks.
- **Transcription:** whisper.cpp's `whisper-server` (`brew install whisper-cpp`) with the `small.en` model, on Metal.
- **Understanding:** Ollama with `qwen3:8b`, given the recent transcript, the current Board, the Phase and the Scope, and returning Sticky changes through a JSON schema passed as `format`. Expect Enforce the Timeline reordering to be the hardest part for an 8B model.
- **Board:** Svelte Flow (`@xyflow/svelte`) for the canvas, pan, zoom, selection and drag, with each Sticky a custom node component. Each view's layout is our own code that sets node positions.
- **Three seams**, each a small interface with one local implementation, so any part can be swapped without touching the others:
  - the **transcriber** (whisper.cpp now),
  - the **model** (Ollama now; Claude, through the same seam, for occasional comparison Runs that show whether a weak result is the model's fault or the design's),
  - the **Board** (Svelte Flow now).
- **Data:** outside the repo, in `~/EventStorm/<session>/` by default, configurable: the Recording, its transcript, its expected list and one Board file per Run. A Board is JSON with Stickies in a stable order and one field per line, so a git diff reads as Stickies added, renamed or removed. Whether a data folder becomes a git repo is up to the Domain Expert.
- The development machine is an M1 with 16 GB, so whisper and the model must fit together with a browser; 7–8B models are the comfortable size.

## Deferred

Not part of "can it work". Each comes back as its own grilling or issue when wanted.

- Remote group Sessions, with the call's audio captured from a browser tab.
- Inspectability: each Sticky showing the transcript excerpt it came from and a history of who changed it.
- Compliance: telling participants they are transcribed, and discarding audio once transcribed.
- The Scribe inferring Phase changes from the conversation.
- A Scribe that asks questions out loud.
- Big Picture Phases after Enforce the Timeline (People and Systems, Problems and Opportunities, and the rest), the Actor, External System and Opportunity kinds, and Swimlanes.
- Process Level and Software Design Event Storming.
- Named snapshots of a Board inside the tool, and a Markdown export.
- Hosting and a deploy job.

## Next

1. Repo metadata, drafted for Dom (`ready-for-human`).
2. Rebase-only merge and branch deletion on merge, drafted for Dom (`ready-for-human`). No branch protection: see ADR 0001.
3. Add the JS/TS (Svelte) stack (`ready-for-agent`).
4. The "can it work" slices in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#slices), one issue each, once Dom has reviewed the design.
