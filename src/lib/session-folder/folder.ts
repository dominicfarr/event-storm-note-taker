import { access, appendFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { Board } from '#lib/board/board.ts';
import type { Speech } from '#lib/transcriber/transcriber.ts';
import { sessionFolderName } from './folder-name';

/** One Session's folder: its Recording, transcript and details. */
export interface SessionFolder {
	readonly id: string;
	readonly dir: string;
	/** Keeps one chunk of the Recording, numbered from 1. */
	keepAudio(chunk: { seq: number; wav: Uint8Array }): Promise<void>;
	/** Adds one Speech to the end of the transcript. */
	keepSpeech(speech: Speech): Promise<void>;
	/** Creates the folder for one Run, under `runs/`. */
	createRunFolder(name: string): Promise<RunFolder>;
}

/** One Run's folder: its Board and every change asked for, applied or not. */
export interface RunFolder {
	/** Replaces `board.json` with this Board, one field per line. */
	keepBoard(board: Board): Promise<void>;
	/** Adds one entry to the end of `changes.jsonl`. */
	keepChange(entry: object): Promise<void>;
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
	const base = sessionFolderName(title, startedAt);
	let id = base;
	for (let n = 2; await exists(path.join(root, id)); n++) id = `${base}-${n}`;
	const dir = path.join(root, id);
	await mkdir(path.join(dir, 'recording'), { recursive: true });
	const details = { title, startedAt: startedAt.toISOString() };
	await writeFile(path.join(dir, 'session.json'), JSON.stringify(details, null, '\t') + '\n');

	return {
		id,
		dir,
		keepAudio: ({ seq, wav }) =>
			writeFile(path.join(dir, 'recording', `${String(seq).padStart(4, '0')}.wav`), wav),
		keepSpeech: (speech) =>
			appendFile(path.join(dir, 'transcript.jsonl'), JSON.stringify(speech) + '\n'),
		createRunFolder: async (name) => {
			const runDir = path.join(dir, 'runs', name);
			await mkdir(runDir, { recursive: true });
			return {
				keepBoard: (board) =>
					writeFile(path.join(runDir, 'board.json'), JSON.stringify(board, null, '\t') + '\n'),
				keepChange: (entry) =>
					appendFile(path.join(runDir, 'changes.jsonl'), JSON.stringify(entry) + '\n')
			};
		}
	};
}

async function exists(file: string): Promise<boolean> {
	try {
		await access(file);
		return true;
	} catch {
		return false;
	}
}
