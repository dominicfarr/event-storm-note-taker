import type { Board, ScribeChange } from '#lib/board/board.ts';
import type { Speech } from '#lib/transcriber/transcriber.ts';
import type { Model } from './model';

export interface Scribe {
	/** Turns new speech into changes to the Board. Never throws for a bad answer from the Model. */
	hear(context: { board: Board; speech: Speech[] }): Promise<ScribeChange[]>;
}

// Chaotic Exploration only, for now. The example names come from another
// domain on purpose: names from the Session's own domain get copied.
const system = `You are the Scribe in a Big Picture Event Storming session, in the Chaotic Exploration phase.
A domain expert talks through their domain. You write each Domain Event they describe on a sticky.

A Domain Event is something that happened in the domain that the domain expert cares about.
Name it in the past tense, two to four words, Title Case, thing first, then what happened to it.
For a library, these would be Domain Events: "Book Reserved", "Membership Renewed", "Late Fee Charged".

For the new speech:
- Every Domain Event it describes that is not on the board yet: add it, in the order they happen.
- A Domain Event already on the board, even in other words: mention that sticky by its id instead of adding it.
- Ignore small talk, opinions, and anything the expert did not say.
Often there are no changes.

Reply with JSON in this shape:
{"changes": [{"change": "add-domain-event", "text": "<name>"}, {"change": "add-mention", "id": "<sticky id>"}]}`;

/**
 * The Scribe for Chaotic Exploration: it may add Domain Events and Mentions.
 * Changes the Model gets wrong are dropped and logged, so one bad answer
 * never stops a Run. A new Domain Event is dated by the first speech heard.
 */
export function createScribe(model: Model, log: (message: string) => void = console.warn): Scribe {
	return {
		async hear({ board, speech }) {
			if (speech.length === 0) return [];
			const answer = await model.complete({ system, prompt: prompt(board, speech) });
			const changes = (answer as { changes?: unknown } | null)?.changes;
			if (!Array.isArray(changes)) {
				log(`The Model's answer has no list of changes: ${JSON.stringify(answer)}`);
				return [];
			}
			return changes.flatMap((change: unknown) => {
				const valid = check(change, speech[0].at);
				if (!valid) log(`Dropped a change the Scribe can't make: ${JSON.stringify(change)}`);
				return valid ? [valid] : [];
			});
		}
	};
}

function prompt(board: Board, speech: Speech[]): string {
	const stickies = board.stickies.map((sticky) => `${sticky.id}: ${sticky.text}`);
	const said = speech.map((line) => `[${line.at}s] ${line.text}`);
	return `The board:\n${stickies.join('\n') || '(empty)'}\n\nNew speech:\n${said.join('\n')}`;
}

function check(change: unknown, saidAt: number): ScribeChange | undefined {
	const { change: type, text, id } = (change ?? {}) as Record<string, unknown>;
	if (type === 'add-domain-event' && typeof text === 'string' && text.trim())
		return { change: type, text: text.trim(), saidAt };
	if (type === 'add-mention' && typeof id === 'string') return { change: type, id };
	return undefined;
}
