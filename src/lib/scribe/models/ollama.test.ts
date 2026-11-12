import { describe, expect, it } from 'vitest';
import { ollamaModel } from './ollama';

const answering = (status: number, content: string) => {
	const calls: { url: string; body: Record<string, unknown> }[] = [];
	const fetchFn = (async (url: string, init: RequestInit) => {
		calls.push({ url, body: JSON.parse(String(init.body)) });
		return new Response(JSON.stringify({ message: { role: 'assistant', content } }), { status });
	}) as typeof fetch;
	return { fetchFn, calls };
};

describe('the Ollama Model', () => {
	it('asks the named model for JSON, with thinking off, and returns the JSON it wrote', async () => {
		const { fetchFn, calls } = answering(200, '{"changes": []}');
		const model = ollamaModel('qwen3:8b', 'http://ollama.test', fetchFn);

		const answer = await model.complete({ system: 'You are the Scribe.', prompt: 'New speech' });

		expect(answer).toEqual({ changes: [] });
		expect(calls[0].url).toBe('http://ollama.test/api/chat');
		expect(calls[0].body).toMatchObject({
			model: 'qwen3:8b',
			format: 'json',
			think: false,
			stream: false,
			messages: [
				{ role: 'system', content: 'You are the Scribe.' },
				{ role: 'user', content: 'New speech' }
			]
		});
	});

	it('fails when Ollama answers with an error', async () => {
		const { fetchFn } = answering(404, '');
		const model = ollamaModel('qwen3:8b', 'http://ollama.test', fetchFn);

		await expect(model.complete({ system: '', prompt: '' })).rejects.toThrow('Ollama answered 404');
	});
});
