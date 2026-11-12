import type { Model } from '../model';

/**
 * A Model served by Ollama, such as `qwen3:8b`. Thinking is off for speed and
 * the model stays loaded for an hour between calls. It asks for plain JSON
 * (`format: 'json'`), not a schema: with qwen3:8b, Ollama's schema-constrained
 * decoding took minutes per answer, against 1 to 10 seconds for plain JSON.
 */
export function ollamaModel(
	name: string,
	baseUrl = 'http://127.0.0.1:11434',
	fetchFn: typeof fetch = fetch
): Model {
	return {
		async complete({ system, prompt }) {
			const response = await fetchFn(`${baseUrl}/api/chat`, {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					model: name,
					messages: [
						{ role: 'system', content: system },
						{ role: 'user', content: prompt }
					],
					format: 'json',
					think: false,
					stream: false,
					keep_alive: '1h',
					options: { temperature: 0 }
				})
			});
			if (!response.ok) throw new Error(`Ollama answered ${response.status}`);
			const { message } = (await response.json()) as { message: { content: string } };
			return JSON.parse(message.content);
		}
	};
}
