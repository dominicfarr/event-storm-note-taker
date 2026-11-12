/** Encodes mono samples (-1 to 1) as a 16-bit PCM WAV file. */
export function encodeWav(samples: Float32Array, sampleRate: number): Uint8Array {
	const bytes = new Uint8Array(44 + samples.length * 2);
	const view = new DataView(bytes.buffer);
	const text = (offset: number, value: string) =>
		[...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));

	text(0, 'RIFF');
	view.setUint32(4, bytes.length - 8, true);
	text(8, 'WAVE');
	text(12, 'fmt ');
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, 1, true); // PCM
	view.setUint16(22, 1, true); // mono
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * 2, true); // bytes per second
	view.setUint16(32, 2, true); // bytes per sample
	view.setUint16(34, 16, true); // bits per sample
	text(36, 'data');
	view.setUint32(40, samples.length * 2, true);
	samples.forEach((sample, i) => {
		const clamped = Math.max(-1, Math.min(1, sample));
		view.setInt16(44 + i * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
	});
	return bytes;
}
