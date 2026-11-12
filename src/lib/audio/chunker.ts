/**
 * Collects audio samples into chunks of `seconds` length. Each chunk goes to
 * `onChunk` with its start time in seconds from the first sample.
 */
export function createChunker(
	sampleRate: number,
	seconds: number,
	onChunk: (samples: Float32Array, at: number) => void
): { push(samples: Float32Array): void; flush(): void } {
	const size = Math.round(sampleRate * seconds);
	let buffer = new Float32Array(size);
	let filled = 0;
	let emitted = 0;

	const emit = (length: number) => {
		onChunk(buffer.slice(0, length), emitted / sampleRate);
		emitted += length;
		buffer = new Float32Array(size);
		filled = 0;
	};

	return {
		push(samples) {
			let offset = 0;
			while (offset < samples.length) {
				const take = Math.min(size - filled, samples.length - offset);
				buffer.set(samples.subarray(offset, offset + take), filled);
				filled += take;
				offset += take;
				if (filled === size) emit(size);
			}
		},
		flush() {
			if (filled > 0) emit(filled);
		}
	};
}
