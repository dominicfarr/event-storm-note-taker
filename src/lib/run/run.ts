import type { ConversationSource } from '#lib/conversation/conversation.ts';
import type { SessionFolder } from '#lib/session-folder/folder.ts';
import type { Speech, Transcriber } from '#lib/transcriber/transcriber.ts';

export type RunUpdate =
	{ type: 'speech'; speech: Speech } | { type: 'problem'; message: string } | { type: 'ended' };

export interface Run {
	/** Sends every update so far, then each new one. Returns a function that stops them. */
	subscribe(listener: (update: RunUpdate) => void): () => void;
	done: Promise<void>;
}

/**
 * One pass over a Session's conversation. So far it only transcribes: the
 * Scribe and the Board arrive in the next slice. A chunk that fails to
 * transcribe is reported and skipped, so the Run carries on.
 */
export function startRun(deps: {
	source: ConversationSource;
	transcriber: Transcriber;
	folder: Pick<SessionFolder, 'keepSpeech'>;
}): Run {
	const updates: RunUpdate[] = [];
	const listeners = new Set<(update: RunUpdate) => void>();
	const send = (update: RunUpdate) => {
		updates.push(update);
		for (const listener of listeners) listener(update);
	};

	const done = (async () => {
		for await (const event of deps.source.events()) {
			if (event.type === 'end') break;
			try {
				for (const speech of await deps.transcriber.transcribe(event)) {
					await deps.folder.keepSpeech(speech);
					send({ type: 'speech', speech });
				}
			} catch (error) {
				send({
					type: 'problem',
					message: `Couldn't transcribe the audio at ${event.at}s: ${String(error)}`
				});
			}
		}
		send({ type: 'ended' });
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
