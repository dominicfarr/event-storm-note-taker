import { apply, emptyBoard, type Board } from '#lib/board/board.ts';
import type { ConversationSource } from '#lib/conversation/conversation.ts';
import type { Scribe } from '#lib/scribe/scribe.ts';
import type { RunFolder, SessionFolder } from '#lib/session-folder/folder.ts';
import type { Speech, Transcriber } from '#lib/transcriber/transcriber.ts';

export type RunUpdate =
	| { type: 'speech'; speech: Speech }
	| { type: 'board'; board: Board }
	| { type: 'problem'; message: string }
	| { type: 'ended' };

export interface Run {
	/**
	 * Sends the updates so far (every Speech and problem, and the latest
	 * Board), then each new one. Returns a function that stops them.
	 */
	subscribe(listener: (update: RunUpdate) => void): () => void;
	/** The final Board, once the conversation has ended and the Scribe has heard it all. */
	done: Promise<Board>;
}

/**
 * One pass of the Scribe over a Session's conversation. Audio is transcribed
 * as it arrives. Only one Scribe call is in flight at a time: speech heard
 * meanwhile waits and goes into the next call, so a slow Model makes
 * Stickies appear later but never builds a backlog. Every change the Scribe
 * asks for goes into the Run's change log, and the Board file is rewritten
 * after each call. A chunk that fails to transcribe, or a Scribe call that
 * fails, is reported and skipped, so the Run carries on.
 */
export function startRun(deps: {
	source: ConversationSource;
	transcriber: Transcriber;
	scribe: Scribe;
	folder: Pick<SessionFolder, 'keepSpeech'>;
	runFolder: RunFolder;
}): Run {
	let updates: RunUpdate[] = [];
	const listeners = new Set<(update: RunUpdate) => void>();
	const send = (update: RunUpdate) => {
		if (update.type === 'board') updates = updates.filter((old) => old.type !== 'board');
		updates.push(update);
		for (const listener of listeners) listener(update);
	};

	let board = emptyBoard();
	const waiting: Speech[] = [];
	let scribing: Promise<void> | undefined;

	const hear = async (speech: Speech[]) => {
		try {
			const changes = await deps.scribe.hear({ board, speech });
			const at = speech.at(-1)?.at;
			for (const change of changes) {
				const result = apply(board, change);
				board = result.board;
				const { applied, reason } = result;
				await deps.runFolder.keepChange({ ...change, author: 'scribe', at, applied, reason });
			}
			await deps.runFolder.keepBoard(board);
			send({ type: 'board', board });
		} catch (error) {
			send({
				type: 'problem',
				message: `The Scribe couldn't hear the speech from ${speech[0].at}s: ${String(error)}`
			});
		}
	};
	const scribeWhenFree = () => {
		scribing ??= (async () => {
			while (waiting.length > 0) await hear(waiting.splice(0));
			scribing = undefined;
		})();
	};

	const done = (async () => {
		for await (const event of deps.source.events()) {
			if (event.type === 'end') break;
			try {
				for (const speech of await deps.transcriber.transcribe(event)) {
					await deps.folder.keepSpeech(speech);
					send({ type: 'speech', speech });
					waiting.push(speech);
				}
			} catch (error) {
				send({
					type: 'problem',
					message: `Couldn't transcribe the audio at ${event.at}s: ${String(error)}`
				});
			}
			if (waiting.length > 0) scribeWhenFree();
		}
		while (scribing) await scribing;
		send({ type: 'ended' });
		return board;
	})();

	return {
		subscribe(listener) {
			for (const update of updates) listener(update);
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		done
	};
}
