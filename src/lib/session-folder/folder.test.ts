import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createSessionFolder, openSessionFolder } from './folder';

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

describe('a Run folder', () => {
	it('keeps the latest Board and every change, under runs/', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		const run = await folder.createRunFolder('2026-11-12T09-30-ollama-qwen3-8b');
		await run.keepBoard({ stickies: [] });
		await run.keepChange({ change: 'add-mention', id: 's1', applied: false });
		await run.keepChange({ change: 'add-mention', id: 's2', applied: true });
		const board = {
			stickies: [
				{ id: 's1', kind: 'domain-event' as const, text: 'Kettle Boiled', mentions: 0, saidAt: 0 }
			]
		};
		await run.keepBoard(board);

		const dir = path.join(folder.dir, 'runs', '2026-11-12T09-30-ollama-qwen3-8b');
		expect(JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8'))).toEqual(board);
		const changes = (await readFile(path.join(dir, 'changes.jsonl'), 'utf8')).trim().split('\n');
		expect(changes.map((line) => JSON.parse(line).id)).toEqual(['s1', 's2']);
	});

	it('never reuses an earlier Run folder of the same name', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		const first = await folder.createRunFolder('2026-11-12T09-30-ollama-qwen3-8b');
		const second = await folder.createRunFolder('2026-11-12T09-30-ollama-qwen3-8b');

		expect(first.name).toBe('2026-11-12T09-30-ollama-qwen3-8b');
		expect(second.name).toBe('2026-11-12T09-30-ollama-qwen3-8b-2');
	});

	it("reads an earlier Run's Board and keeps its score", async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		const created = await folder.createRunFolder('run-a');
		const board = {
			stickies: [
				{ id: 's1', kind: 'domain-event' as const, text: 'Kettle Boiled', mentions: 2, saidAt: 0 }
			]
		};
		await created.keepBoard(board);

		const run = await folder.openRunFolder('run-a');
		await run.keepScore({ caught: 1 });

		expect(await run.board()).toEqual(board);
		const score = await readFile(path.join(folder.dir, 'runs', 'run-a', 'score.json'), 'utf8');
		expect(JSON.parse(score)).toEqual({ caught: 1 });
	});

	it('refuses to open a Run that does not exist', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);

		await expect(folder.openRunFolder('nope')).rejects.toThrow('There is no Run "nope"');
	});
});

describe('openSessionFolder', () => {
	it('opens an earlier Session and reads its transcript', async () => {
		const created = await createSessionFolder(root, 'Soup', startedAt);
		await created.keepSpeech({ at: 0, text: 'The kettle boiled.' });
		await created.keepSpeech({ at: 5, text: 'The water was poured.' });

		const folder = await openSessionFolder(root, created.id);

		expect(folder.dir).toBe(created.dir);
		expect(await folder.transcript()).toEqual([
			{ at: 0, text: 'The kettle boiled.' },
			{ at: 5, text: 'The water was poured.' }
		]);
	});

	it('reads the Expected List, one Domain Event per line, skipping blank lines', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);
		await writeFile(path.join(folder.dir, 'expected.txt'), 'Kettle Boiled\n\n  Water Poured  \n');

		expect(await folder.expected()).toEqual(['Kettle Boiled', 'Water Poured']);
	});

	it('answers an empty transcript and no Expected List when the files are missing', async () => {
		const folder = await createSessionFolder(root, 'Soup', startedAt);

		expect(await folder.transcript()).toEqual([]);
		expect(await folder.expected()).toBeUndefined();
	});

	it('refuses to open a Session that does not exist', async () => {
		await expect(openSessionFolder(root, 'nope')).rejects.toThrow(
			`There is no Session "nope" in ${root}`
		);
	});
});
