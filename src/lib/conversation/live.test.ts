import { describe, expect, it } from 'vitest';
import { createLiveConversation } from './live';

describe('a live conversation', () => {
	it('keeps audio as numbered Recording chunks and passes it on in order', async () => {
		const kept: number[] = [];
		const live = createLiveConversation({ keepAudio: async ({ seq }) => void kept.push(seq) });

		expect(await live.receiveAudio(0, new Uint8Array([1]))).toBe(true);
		expect(await live.receiveAudio(5, new Uint8Array([2]))).toBe(true);
		live.end(10);

		const events = [];
		for await (const event of live.events()) events.push({ type: event.type, at: event.at });
		expect(kept).toEqual([1, 2]);
		expect(events).toEqual([
			{ type: 'audio', at: 0 },
			{ type: 'audio', at: 5 },
			{ type: 'end', at: 10 }
		]);
	});

	it('refuses audio once the Session has ended, keeping none of it', async () => {
		const kept: number[] = [];
		const live = createLiveConversation({ keepAudio: async ({ seq }) => void kept.push(seq) });
		live.end(0);
		live.end(1);

		expect(await live.receiveAudio(5, new Uint8Array([1]))).toBe(false);
		expect(kept).toEqual([]);
		const events = [];
		for await (const event of live.events()) events.push(event.type);
		expect(events).toEqual(['end']);
	});
});
