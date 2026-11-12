import { describe, expect, it } from 'vitest';
import type { ConversationEvent } from './conversation';
import { createRecordingConversation } from './recording';

describe('a Recording conversation', () => {
	it('replays the stored transcript as speech, then ends after the last line', async () => {
		const source = createRecordingConversation([
			{ at: 0, text: 'I open the app.' },
			{ at: 5, text: 'I pay by card.' }
		]);

		const events: ConversationEvent[] = [];
		for await (const event of source.events()) events.push(event);

		expect(events).toEqual([
			{ type: 'speech', at: 0, text: 'I open the app.' },
			{ type: 'speech', at: 5, text: 'I pay by card.' },
			{ type: 'end', at: 5 }
		]);
	});

	it('ends at once when nothing was said', async () => {
		const events: ConversationEvent[] = [];
		for await (const event of createRecordingConversation([]).events()) events.push(event);

		expect(events).toEqual([{ type: 'end', at: 0 }]);
	});
});
