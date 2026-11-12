import type { Speech, Transcriber } from './transcriber';

/** Lines whisper writes for non-speech, such as "[BLANK_AUDIO]" or "(music)". */
const nonSpeech = /^(\[.*\]|\(.*\))$/;

/**
 * The Transcriber adapter for whisper.cpp's `whisper-server`, at `baseUrl`
 * (for example http://127.0.0.1:8178). Each line whisper returns becomes one
 * Speech, all at the chunk's start time.
 */
export function whisperServerTranscriber(
	baseUrl: string,
	fetchFn: typeof fetch = fetch
): Transcriber {
	return {
		async transcribe({ wav, at }): Promise<Speech[]> {
			const form = new FormData();
			form.append('file', new Blob([new Uint8Array(wav)], { type: 'audio/wav' }), 'chunk.wav');
			form.append('response_format', 'json');
			form.append('temperature', '0');
			const response = await fetchFn(`${baseUrl}/inference`, { method: 'POST', body: form });
			if (!response.ok) throw new Error(`whisper-server answered ${response.status}`);
			const { text } = (await response.json()) as { text: string };
			return text
				.split('\n')
				.map((line) => line.trim())
				.filter((line) => line !== '' && !nonSpeech.test(line))
				.map((line) => ({ at, text: line }));
		}
	};
}
