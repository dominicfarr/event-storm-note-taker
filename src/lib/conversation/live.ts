import type { SessionFolder } from '#lib/session-folder/folder.ts';
import type { ConversationEvent, ConversationSource } from './conversation';

export interface LiveConversation extends ConversationSource {
	/**
	 * Takes the next chunk of audio from the browser, keeping it as part of the
	 * Recording. Answers false, keeping nothing, once the Session has ended.
	 */
	receiveAudio(at: number, wav: Uint8Array): Promise<boolean>;
	/** The Session is over: no more audio will come. Ending it again does nothing. */
	end(at: number): void;
}

/** The live conversation: audio from the browser, kept as the Recording as it arrives. */
export function createLiveConversation(folder: Pick<SessionFolder, 'keepAudio'>): LiveConversation {
	const queue = new Queue<ConversationEvent>();
	let seq = 0;
	let ended = false;
	return {
		async receiveAudio(at, wav) {
			if (ended) return false;
			seq += 1;
			await folder.keepAudio({ seq, wav });
			queue.push({ type: 'audio', at, wav });
			return true;
		},
		end(at) {
			if (ended) return;
			ended = true;
			queue.push({ type: 'end', at });
			queue.close();
		},
		events: () => queue
	};
}

/** An async queue read by one consumer: items wait until read, and reads wait for items. */
class Queue<T> implements AsyncIterable<T> {
	private items: T[] = [];
	private readers: ((result: IteratorResult<T>) => void)[] = [];
	private closed = false;

	push(item: T): void {
		const reader = this.readers.shift();
		if (reader) reader({ value: item, done: false });
		else this.items.push(item);
	}

	close(): void {
		this.closed = true;
		for (const reader of this.readers.splice(0)) reader({ value: undefined, done: true });
	}

	[Symbol.asyncIterator](): AsyncIterator<T> {
		return {
			next: () => {
				if (this.items.length > 0)
					return Promise.resolve({ value: this.items.shift()!, done: false });
				if (this.closed) return Promise.resolve({ value: undefined, done: true });
				return new Promise((resolve) => this.readers.push(resolve));
			}
		};
	}
}
