import type { Speech } from '#lib/transcriber/transcriber.ts';
import type { ConversationEvent, ConversationSource } from './conversation';

/**
 * Replays a Session's stored transcript as speech, as fast as the Run reads
 * it, so a re-run tests the Scribe alone. Replaying the audio comes later.
 */
export function createRecordingConversation(transcript: Speech[]): ConversationSource {
	return {
		async *events(): AsyncGenerator<ConversationEvent> {
			for (const { at, text } of transcript) yield { type: 'speech', at, text };
			yield { type: 'end', at: transcript.at(-1)?.at ?? 0 };
		}
	};
}
