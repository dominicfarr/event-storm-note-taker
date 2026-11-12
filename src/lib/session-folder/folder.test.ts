import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSessionFolder } from './folder';

const startedAt = new Date('2026-11-12T09:30:00Z');
let root: string;

beforeEach(async () => {
	root = await mkdtemp(path.join(os.tmpdir(), 'session-folder-'));
});
afterEach(() => rm(root, { recursive: true, force: true }));

describe('createSessionFolder', () => {
	it('creates the folder with the Session details', async () => {
		const folder = await createSessionFolder(root, 'Ordering a takeaway', startedAt);

		expect(folder.id).toBe('2026-11-12-ordering-a-takeaway');
		const details = JSON.parse(await readFile(path.join(folder.dir, 'session.json'), 'utf8'));
		expect(details).toEqual({
			title: 'Ordering a takeaway',
			startedAt: '2026-11-12T09:30:00.000Z'
		});
	});

	it('gives a second Session with the same name that day its own folder', async () => {
		await createSessionFolder(root, 'Ordering a takeaway', startedAt);
		const second = await createSessionFolder(root, 'Ordering a takeaway', startedAt);

		expect(second.id).toBe('2026-11-12-ordering-a-takeaway-2');
	});

	it('keeps the Recording as numbered chunks', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		await folder.keepAudio({ seq: 1, wav: new Uint8Array([1, 2]) });
		await folder.keepAudio({ seq: 2, wav: new Uint8Array([3]) });

		expect(await readdir(path.join(folder.dir, 'recording'))).toEqual(['0001.wav', '0002.wav']);
		expect([...(await readFile(path.join(folder.dir, 'recording', '0002.wav')))]).toEqual([3]);
	});

	it('keeps the transcript as one Speech per line', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		await folder.keepSpeech({ at: 0, text: 'The kettle boiled.' });
		await folder.keepSpeech({ at: 5, text: 'The water was poured.' });

		const lines = (await readFile(path.join(folder.dir, 'transcript.jsonl'), 'utf8'))
			.trim()
			.split('\n');
		expect(lines.map((line) => JSON.parse(line))).toEqual([
			{ at: 0, text: 'The kettle boiled.' },
			{ at: 5, text: 'The water was poured.' }
		]);
	});
});
