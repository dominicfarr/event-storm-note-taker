import { createChunker } from './chunker';
import { encodeWav } from './wav';

const sampleRate = 16000; // what whisper expects
const chunkSeconds = 5;

/**
 * Starts listening to the microphone. Every 5 seconds `onChunk` gets a
 * 16 kHz mono WAV and its start in seconds. The browser resamples the
 * microphone to 16 kHz itself (Chrome does; Firefox may refuse).
 * Resolves to a function that stops listening and sends the last, shorter chunk.
 */
export async function startMicrophone(
	onChunk: (wav: Uint8Array, at: number) => void
): Promise<() => Promise<void>> {
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true }
	});
	const context = new AudioContext({ sampleRate });
	await context.audioWorklet.addModule('/capture-worklet.js');
	const source = context.createMediaStreamSource(stream);
	const capture = new AudioWorkletNode(context, 'capture');
	const chunker = createChunker(sampleRate, chunkSeconds, (samples, at) =>
		onChunk(encodeWav(samples, sampleRate), at)
	);
	capture.port.onmessage = (event: MessageEvent<Float32Array>) => chunker.push(event.data);
	source.connect(capture);

	return async () => {
		source.disconnect();
		capture.port.onmessage = null;
		for (const track of stream.getTracks()) track.stop();
		await context.close();
		chunker.flush();
	};
}
