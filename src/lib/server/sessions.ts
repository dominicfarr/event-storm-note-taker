import { EVENTSTORM_HOME, WHISPER_PORT } from '$app/env/private';
import { createLiveConversation, type LiveConversation } from '#lib/conversation/live.ts';
import { startRun, type Run } from '#lib/run/run.ts';
import { createSessionFolder } from '#lib/session-folder/folder.ts';
import { whisperServerTranscriber } from '#lib/transcriber/whisper-server.ts';

interface LiveSession {
	live: LiveConversation;
	run: Run;
}

const sessions = new Map<string, LiveSession>();

/** Starts a live Session: its folder, its live conversation and its first Run. */
export async function startSession(title: string): Promise<string> {
	const folder = await createSessionFolder(EVENTSTORM_HOME, title, new Date());
	const live = createLiveConversation(folder);
	const transcriber = whisperServerTranscriber(`http://127.0.0.1:${WHISPER_PORT}`);
	sessions.set(folder.id, { live, run: startRun({ source: live, transcriber, folder }) });
	return folder.id;
}

export function findSession(id: string): LiveSession | undefined {
	return sessions.get(id);
}
