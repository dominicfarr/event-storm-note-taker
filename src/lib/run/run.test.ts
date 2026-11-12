import { describe, expect, it } from 'vitest';
import { createLiveConversation } from '#lib/conversation/live.ts';
import type { Speech, Transcriber } from '#lib/transcriber/transcriber.ts';
import { startRun, type RunUpdate } from './run';

/** A fake folder that remembers what it was asked to keep. */
const fakeFolder = () => {
	const audio: number[] = [];
	const speech: Speech[] = [];
	return {
		audio,
		speech,
		keepAudio: async ({ seq }: { seq: number }) => void audio.push(seq),
		keepSpeech: async (said: Speech) => void speech.push(said)
	};
};

/** A fixture Transcriber: each chunk's single byte picks a canned line. */
const fixtureTranscriber = (lines: Record<number, string | Error>): Transcriber => ({
	async transcribe({ wav, at }) {
		const line = lines[wav[0]];
		if (line instanceof Error) throw line;
		return line ? [{ at, text: line }] : [];
	}
});

describe('a Run over a live conversation', () => {
	it('keeps the Recording and transcript, and sends each Speech as it is heard', async () => {
		const folder = fakeFolder();
		const live = createLiveConversation(folder);
		const run = startRun({
			source: live,
			transcriber: fixtureTranscriber({
				1: 'The order was placed.',
				2: 'The kitchen accepted it.'
			}),
			folder
		});
		const updates: RunUpdate[] = [];
		run.subscribe((update) => updates.push(update));

		await live.receiveAudio(0, new Uint8Array([1]));
		await live.receiveAudio(5, new Uint8Array([2]));
		live.end(10);
		await run.done;

		expect(folder.audio).toEqual([1, 2]);
		expect(folder.speech).toEqual([
			{ at: 0, text: 'The order was placed.' },
			{ at: 5, text: 'The kitchen accepted it.' }
		]);
		expect(updates).toEqual([
			{ type: 'speech', speech: { at: 0, text: 'The order was placed.' } },
			{ type: 'speech', speech: { at: 5, text: 'The kitchen accepted it.' } },
			{ type: 'ended' }
		]);
	});

	it('reports a chunk that fails to transcribe and carries on', async () => {
		const folder = fakeFolder();
		const live = createLiveConversation(folder);
		const run = startRun({
			source: live,
			transcriber: fixtureTranscriber({
				1: new Error('whisper-server answered 500'),
				2: 'Soup was served.'
			}),
			folder
		});

		await live.receiveAudio(0, new Uint8Array([1]));
		await live.receiveAudio(5, new Uint8Array([2]));
		live.end(10);
		await run.done;

		const updates: RunUpdate[] = [];
		run.subscribe((update) => updates.push(update)); // a late subscriber gets everything so far
		expect(updates.map((update) => update.type)).toEqual(['problem', 'speech', 'ended']);
		expect(updates[0]).toMatchObject({ message: expect.stringContaining('at 0s') });
	});
});
