import { describe, expect, it } from 'vitest';
import { sessionFolderName } from './folder-name';

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
