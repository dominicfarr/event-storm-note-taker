// npm run scribe -- <session> [--model ollama:qwen3:8b]
// Re-runs a Session's Recording through the Scribe, with no browser, into a new Run folder.
import { eventStormHome } from '../env.ts';
import { createRecordingConversation } from '#lib/conversation/recording.ts';
import { startRun } from '#lib/run/run.ts';
import { ollamaModel } from '#lib/scribe/models/ollama.ts';
import { createScribe } from '#lib/scribe/scribe.ts';
import { openSessionFolder } from '#lib/session-folder/folder.ts';
import { runFolderName } from '#lib/session-folder/folder-name.ts';
import type { Transcriber } from '#lib/transcriber/transcriber.ts';
import { parseScribeArgs } from './scribe-args.ts';

try {
	const { session, provider, model } = parseScribeArgs(process.argv.slice(2));
	const folder = await openSessionFolder(eventStormHome(process.env.EVENTSTORM_HOME), session);
	const transcript = await folder.transcript();
	if (transcript.length === 0) fail(`The Session "${session}" has no transcript to re-run.`);
	const runFolder = await folder.createRunFolder(runFolderName(new Date(), `${provider}:${model}`));
	const noTranscriber: Transcriber = {
		transcribe: () => Promise.reject(new Error('This Run replays the transcript, not the audio.'))
	};
	const run = startRun({
		source: createRecordingConversation(transcript),
		transcriber: noTranscriber,
		scribe: createScribe(ollamaModel(model)),
		folder,
		runFolder
	});

	let shown = 0;
	run.subscribe((update) => {
		if (update.type === 'speech') console.log(`[${update.speech.at}s] ${update.speech.text}`);
		if (update.type === 'problem') console.error(update.message);
		if (update.type === 'board')
			for (const sticky of update.board.stickies.slice(shown)) console.log(`  + ${sticky.text}`);
		if (update.type === 'board') shown = update.board.stickies.length;
	});
	const board = await run.done;

	console.log(`\n${board.stickies.length} Domain Events in ${runFolder.dir}`);
	for (const sticky of board.stickies)
		console.log(`  ${sticky.text} (${sticky.mentions} Mentions)`);
	console.log(`\nScore it: npm run score -- ${session} ${runFolder.name}`);
} catch (error) {
	fail(error instanceof Error ? error.message : String(error));
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}
