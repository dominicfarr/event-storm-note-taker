import { describe, expect, it } from 'vitest';
import { runFolderName, sessionFolderName } from './folder-name';

const startedOn = new Date('2026-11-12T09:30:00Z');

describe('sessionFolderName', () => {
	it('starts with the day and follows with the title in hyphenated words', () => {
		expect(sessionFolderName('Ordering a Takeaway', startedOn)).toBe(
			'2026-11-12-ordering-a-takeaway'
		);
	});

	it('drops punctuation and accents', () => {
		expect(sessionFolderName('  Café: soup, instant!  ', startedOn)).toBe(
			'2026-11-12-cafe-soup-instant'
		);
	});

	it('names a Session with no usable title "untitled"', () => {
		expect(sessionFolderName('?!', startedOn)).toBe('2026-11-12-untitled');
	});
});

describe('runFolderName', () => {
	it('is when the Run started, to the minute, then its Model in hyphenated words', () => {
		expect(runFolderName(startedOn, 'ollama:qwen3:8b')).toBe('2026-11-12T09-30-ollama-qwen3-8b');
	});
});
