import { describe, expect, it } from 'vitest';
import { createChunker } from './chunker';
import { encodeWav } from './wav';

describe('encodeWav', () => {
	it('writes a 16 kHz mono 16-bit PCM header and clamped samples', () => {
		const wav = encodeWav(new Float32Array([0, 1, -1, 2]), 16000);
		const view = new DataView(wav.buffer);
		const text = (offset: number) => String.fromCharCode(...wav.slice(offset, offset + 4));

		expect([text(0), text(8), text(12), text(36)]).toEqual(['RIFF', 'WAVE', 'fmt ', 'data']);
		expect(view.getUint16(22, true)).toBe(1); // mono
		expect(view.getUint32(24, true)).toBe(16000);
		expect(view.getUint16(34, true)).toBe(16);
		expect(view.getUint32(40, true)).toBe(8);
		expect([0, 1, 2, 3].map((i) => view.getInt16(44 + i * 2, true))).toEqual([
			0, 32767, -32768, 32767
		]);
	});
});

describe('createChunker', () => {
	it('emits full chunks with their start times, then the rest on flush', () => {
		const chunks: { length: number; at: number }[] = [];
		const chunker = createChunker(4, 1, (samples, at) =>
			chunks.push({ length: samples.length, at })
		);

		chunker.push(new Float32Array(3));
		chunker.push(new Float32Array(3));
		expect(chunks).toEqual([{ length: 4, at: 0 }]);

		chunker.flush();
		expect(chunks).toEqual([
			{ length: 4, at: 0 },
			{ length: 2, at: 1 }
		]);
	});

	it('emits nothing on flush when no samples are waiting', () => {
		const chunks: number[] = [];
		const chunker = createChunker(4, 1, (samples) => chunks.push(samples.length));
		chunker.push(new Float32Array(4));
		chunker.flush();

		expect(chunks).toEqual([4]);
	});
});
