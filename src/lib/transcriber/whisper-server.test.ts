import { describe, expect, it } from 'vitest';
import { whisperServerTranscriber } from './whisper-server';

const answering = (status: number, body: unknown) => {
	const calls: { url: string; body: FormData }[] = [];
	const fetchFn = (async (url: string, init: RequestInit) => {
		calls.push({ url, body: init.body as FormData });
		return new Response(JSON.stringify(body), { status });
	}) as typeof fetch;
	return { calls, fetchFn };
};

describe('whisperServerTranscriber', () => {
	it("posts the chunk to whisper-server's /inference as a WAV file", async () => {
		const { calls, fetchFn } = answering(200, { text: '' });
		await whisperServerTranscriber('http://127.0.0.1:8178', fetchFn).transcribe({
			wav: new Uint8Array([1, 2, 3]),
			at: 0
		});

		expect(calls[0].url).toBe('http://127.0.0.1:8178/inference');
		const file = calls[0].body.get('file') as File;
		expect(file.type).toBe('audio/wav');
		expect(file.size).toBe(3);
	});

	it('makes each line one Speech at the chunk start, dropping non-speech lines', async () => {
		// The shape whisper-server returned on Dom's machine.
		const { fetchFn } = answering(200, {
			text: ' The customer placed an order.\n [BLANK_AUDIO]\n (music)\n Then the kitchen accepted it.\n'
		});
		const speech = await whisperServerTranscriber('http://x', fetchFn).transcribe({
			wav: new Uint8Array(),
			at: 15
		});

		expect(speech).toEqual([
			{ at: 15, text: 'The customer placed an order.' },
			{ at: 15, text: 'Then the kitchen accepted it.' }
		]);
	});

	it('fails when whisper-server answers with an error', async () => {
		const { fetchFn } = answering(500, {});
		await expect(
			whisperServerTranscriber('http://x', fetchFn).transcribe({ wav: new Uint8Array(), at: 0 })
		).rejects.toThrow('whisper-server answered 500');
	});
});
