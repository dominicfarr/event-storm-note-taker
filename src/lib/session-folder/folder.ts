import { access, appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Board } from '#lib/board/board.ts';
import type { Speech } from '#lib/transcriber/transcriber.ts';
import { sessionFolderName } from './folder-name.ts';

/** One Session's folder: its Recording, transcript, Expected List and Runs. */
export interface SessionFolder {
	readonly id: string;
	readonly dir: string;
	/** Keeps one chunk of the Recording, numbered from 1. */
	keepAudio(chunk: { seq: number; wav: Uint8Array }): Promise<void>;
	/** Adds one Speech to the end of the transcript. */
	keepSpeech(speech: Speech): Promise<void>;
	/** Everything said so far, in order; empty if nothing was. */
	transcript(): Promise<Speech[]>;
	/** The Expected List, one Domain Event per line of `expected.txt`; undefined if there is none. */
	expected(): Promise<string[] | undefined>;
	/**
	 * Creates the folder for a new Run, under `runs/`. An earlier Run of the
	 * same name is left alone: the new one gets "-2", and so on.
	 */
	createRunFolder(name: string): Promise<RunFolder>;
	/** Opens an earlier Run's folder. */
	openRunFolder(name: string): Promise<RunFolder>;
}

/** One Run's folder: its Board, every change asked for, applied or not, and its score. */
export interface RunFolder {
	readonly name: string;
	readonly dir: string;
	/** Replaces `board.json` with this Board, one field per line. */
	keepBoard(board: Board): Promise<void>;
	/** Adds one entry to the end of `changes.jsonl`. */
	keepChange(entry: object): Promise<void>;
	/** Reads `board.json`. */
	board(): Promise<Board>;
	/** Replaces `score.json`. */
	keepScore(score: object): Promise<void>;
}

/**
 * Creates a new Session's folder under `root`, named after the day and the
 * title. A second Session with the same name that day gets "-2", and so on.
 */
export async function createSessionFolder(
	root: string,
	title: string,
	startedAt: Date
): Promise<SessionFolder> {
	const id = await unusedName(root, sessionFolderName(title, startedAt));
	const dir = path.join(root, id);
	await mkdir(path.join(dir, 'recording'), { recursive: true });
	await writeJson(path.join(dir, 'session.json'), { title, startedAt: startedAt.toISOString() });
	return sessionFolder(id, dir);
}

/** Opens an earlier Session's folder under `root`. */
export async function openSessionFolder(root: string, id: string): Promise<SessionFolder> {
	const dir = path.join(root, id);
	if (!(await exists(path.join(dir, 'session.json'))))
		throw new Error(`There is no Session "${id}" in ${root}.`);
	return sessionFolder(id, dir);
}

function sessionFolder(id: string, dir: string): SessionFolder {
	const runsDir = path.join(dir, 'runs');
	return {
		id,
		dir,
		keepAudio: ({ seq, wav }) =>
			writeFile(path.join(dir, 'recording', `${String(seq).padStart(4, '0')}.wav`), wav),
		keepSpeech: (speech) =>
			appendFile(path.join(dir, 'transcript.jsonl'), JSON.stringify(speech) + '\n'),
		transcript: async () =>
			((await readLines(path.join(dir, 'transcript.jsonl'))) ?? []).map(
				(line) => JSON.parse(line) as Speech
			),
		expected: () => readLines(path.join(dir, 'expected.txt')),
		createRunFolder: async (wanted) => {
			const name = await unusedName(runsDir, wanted);
			await mkdir(path.join(runsDir, name), { recursive: true });
			return runFolder(name, path.join(runsDir, name));
		},
		openRunFolder: async (name) => {
			const runDir = path.join(runsDir, name);
			if (!(await exists(runDir))) throw new Error(`There is no Run "${name}" in ${runsDir}.`);
			return runFolder(name, runDir);
		}
	};
}

function runFolder(name: string, dir: string): RunFolder {
	return {
		name,
		dir,
		keepBoard: (board) => writeJson(path.join(dir, 'board.json'), board),
		keepChange: (entry) =>
			appendFile(path.join(dir, 'changes.jsonl'), JSON.stringify(entry) + '\n'),
		board: async () => JSON.parse(await readFile(path.join(dir, 'board.json'), 'utf8')) as Board,
		keepScore: (score) => writeJson(path.join(dir, 'score.json'), score)
	};
}

/** `name`, or the first of "name-2", "name-3", … not yet taken in `dir`. */
async function unusedName(dir: string, name: string): Promise<string> {
	let unused = name;
	let n = 1;
	while (await exists(path.join(dir, unused))) unused = `${name}-${++n}`;
	return unused;
}

const writeJson = (file: string, value: unknown) =>
	writeFile(file, JSON.stringify(value, null, '\t') + '\n');

/** The file's non-blank lines, trimmed; undefined if there is no such file. */
async function readLines(file: string): Promise<string[] | undefined> {
	if (!(await exists(file))) return undefined;
	const text = await readFile(file, 'utf8');
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);
}

async function exists(file: string): Promise<boolean> {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}
