import { EVENTSTORM_HOME, WHISPER_PORT } from '$app/env/private';
import { createLiveConversation, type LiveConversation } from '#lib/conversation/live.ts';
import { startRun, type Run } from '#lib/run/run.ts';
import { ollamaModel } from '#lib/scribe/models/ollama.ts';
import { createScribe } from '#lib/scribe/scribe.ts';
import { createSessionFolder } from '#lib/session-folder/folder.ts';
import { runFolderName } from '#lib/session-folder/folder-name.ts';
import { whisperServerTranscriber } from '#lib/transcriber/whisper-server.ts';

interface LiveSession {
	live: LiveConversation;
	run: Run;
}

const sessions = new Map<string, LiveSession>();
const model = 'qwen3:8b';

/** Starts a live Session: its folder, its live conversation and its first Run. */
export async function startSession(title: string): Promise<string> {
	const startedAt = new Date();
	const folder = await createSessionFolder(EVENTSTORM_HOME, title, startedAt);
	const runFolder = await folder.createRunFolder(runFolderName(startedAt, `ollama:${model}`));
	const live = createLiveConversation(folder);
	const run = startRun({
		source: live,
		transcriber: whisperServerTranscriber(`http://127.0.0.1:${WHISPER_PORT}`),
		scribe: createScribe(ollamaModel(model)),
		folder,
		runFolder
	});
	sessions.set(folder.id, { live, run });
	return folder.id;
}

export function findSession(id: string): LiveSession | undefined {
	return sessions.get(id);
}
