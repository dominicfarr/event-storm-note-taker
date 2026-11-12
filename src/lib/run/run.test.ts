import { describe, expect, it } from 'vitest';
import type { Board, ScribeChange } from '#lib/board/board.ts';
import { createLiveConversation } from '#lib/conversation/live.ts';
import type { Scribe } from '#lib/scribe/scribe.ts';
import type { Speech, Transcriber } from '#lib/transcriber/transcriber.ts';
import { startRun, type RunUpdate } from './run';

/** A fake Session folder and Run folder that remember what they were asked to keep. */
const fakeFolders = () => {
	const kept = { audio: [] as number[], speech: [] as Speech[], changes: [] as object[] };
	let board: Board | undefined;
	return {
		kept,
		board: () => board,
		folder: {
			keepAudio: async ({ seq }: { seq: number }) => void kept.audio.push(seq),
			keepSpeech: async (said: Speech) => void kept.speech.push(said)
		},
		runFolder: {
			keepBoard: async (latest: Board) => void (board = latest),
			keepChange: async (entry: object) => void kept.changes.push(entry)
		}
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

/** A fake Scribe that adds a Domain Event named after each line it hears. */
const echoScribe = (heard: Speech[][] = []): Scribe => ({
	async hear({ speech }) {
		heard.push(speech);
		return speech.map((line) => ({ change: 'add-domain-event', text: line.text, saidAt: line.at }));
	}
});

const startLiveRun = (scribe: Scribe, lines: Record<number, string | Error>) => {
	const folders = fakeFolders();
	const live = createLiveConversation(folders.folder);
	const run = startRun({
		source: live,
		transcriber: fixtureTranscriber(lines),
		scribe,
		...folders
	});
	const updates: RunUpdate[] = [];
	run.subscribe((update) => updates.push(update));
	return { live, run, updates, ...folders };
};

describe('a Run over a live conversation', () => {
	it('keeps the transcript, puts what the Scribe hears on the Board and sends both', async () => {
		const { live, run, updates, kept, board } = startLiveRun(echoScribe(), {
			1: 'Order Placed',
			2: 'Order Accepted'
		});

		await live.receiveAudio(0, new Uint8Array([1]));
		await live.receiveAudio(5, new Uint8Array([2]));
		live.end(10);
		const final = await run.done;

		expect(kept.audio).toEqual([1, 2]);
		expect(kept.speech.map((said) => said.text)).toEqual(['Order Placed', 'Order Accepted']);
		expect(final.stickies.map((sticky) => sticky.text)).toEqual(['Order Placed', 'Order Accepted']);
		expect(board()).toEqual(final);
		expect(kept.changes).toEqual([
			{
				change: 'add-domain-event',
				text: 'Order Placed',
				saidAt: 0,
				author: 'scribe',
				at: 0,
				applied: true
			},
			{
				change: 'add-domain-event',
				text: 'Order Accepted',
				saidAt: 5,
				author: 'scribe',
				at: 5,
				applied: true
			}
		]);
		expect(updates.map((update) => update.type)).toContain('board');
		expect(updates.at(-1)).toEqual({ type: 'ended' });
	});

	it('batches speech heard while the Scribe is busy into its next call', async () => {
		let finishFirstCall = () => {};
		const heard: Speech[][] = [];
		const slowScribe: Scribe = {
			async hear(context) {
				if (heard.length === 0) await new Promise<void>((resolve) => (finishFirstCall = resolve));
				return echoScribe(heard).hear(context);
			}
		};
		const { live, run } = startLiveRun(slowScribe, { 1: 'One', 2: 'Two', 3: 'Three' });

		await live.receiveAudio(0, new Uint8Array([1]));
		await live.receiveAudio(5, new Uint8Array([2]));
		await live.receiveAudio(10, new Uint8Array([3]));
		await new Promise((resolve) => setTimeout(resolve, 10)); // let all three be transcribed
		finishFirstCall();
		live.end(15);
		await run.done;

		expect(heard.map((speech) => speech.map((line) => line.text))).toEqual([
			['One'],
			['Two', 'Three']
		]);
	});

	it('logs changes the Board refuses and reports a Scribe call that fails, then carries on', async () => {
		const answers: (ScribeChange[] | Error)[] = [
			[{ change: 'add-mention', id: 's9' }],
			new Error('Ollama answered 500'),
			[{ change: 'add-domain-event', text: 'Soup Served', saidAt: 10 }]
		];
		const scribe: Scribe = {
			async hear() {
				const answer = answers.shift()!;
				if (answer instanceof Error) throw answer;
				return answer;
			}
		};
		const { live, run, updates, kept } = startLiveRun(scribe, { 1: 'a', 2: 'b', 3: 'c' });

		for (const [at, byte] of [
			[0, 1],
			[5, 2],
			[10, 3]
		]) {
			await live.receiveAudio(at, new Uint8Array([byte]));
			await new Promise((resolve) => setTimeout(resolve, 5)); // one Scribe call per chunk
		}
		live.end(15);
		const final = await run.done;

		expect(kept.changes).toEqual([
			expect.objectContaining({ id: 's9', applied: false, reason: 'There is no Sticky s9.' }),
			expect.objectContaining({ text: 'Soup Served', applied: true })
		]);
		expect(updates).toContainEqual({
			type: 'problem',
			message: expect.stringMatching(/couldn't hear the speech from 5s.*Ollama answered 500/)
		});
		expect(final.stickies.map((sticky) => sticky.text)).toEqual(['Soup Served']);
	});

	it('reports a chunk that fails to transcribe and carries on', async () => {
		const { live, run } = startLiveRun(echoScribe(), {
			1: new Error('whisper-server answered 500'),
			2: 'Soup Served'
		});

		await live.receiveAudio(0, new Uint8Array([1]));
		await live.receiveAudio(5, new Uint8Array([2]));
		live.end(10);
		await run.done;

		const late: RunUpdate[] = [];
		run.subscribe((update) => late.push(update)); // a late subscriber gets everything so far
		expect(late.map((update) => update.type)).toEqual(['problem', 'speech', 'board', 'ended']);
		expect(late[0]).toMatchObject({ message: expect.stringContaining('at 0s') });
	});
});
