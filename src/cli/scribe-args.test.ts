import { describe, expect, it } from 'vitest';
import { parseScribeArgs, usage } from './scribe-args';

describe('parseScribeArgs', () => {
	it('takes the Session and defaults to Ollama qwen3:8b', () => {
		expect(parseScribeArgs(['takeaway-6'])).toEqual({
			session: 'takeaway-6',
			provider: 'ollama',
			model: 'qwen3:8b'
		});
	});

	it('takes a Model, keeping any colons in its name', () => {
		expect(parseScribeArgs(['takeaway-6', '--model', 'ollama:llama3.1:70b'])).toMatchObject({
			model: 'llama3.1:70b'
		});
	});

	it('says what is wrong with an unknown option, then how to use it', () => {
		expect(() => parseScribeArgs(['takeaway-6', '--modle', 'ollama:llama3'])).toThrow(
			"Unknown option '--modle' " + usage
		);
	});

	it('refuses --model with no value', () => {
		expect(() => parseScribeArgs(['takeaway-6', '--model'])).toThrow(usage);
	});

	it('refuses a missing Session', () => {
		expect(() => parseScribeArgs([])).toThrow(usage);
	});

	it('refuses extra words, so a forgotten --model is not silently run as qwen3:8b', () => {
		expect(() => parseScribeArgs(['takeaway-6', 'ollama:llama3'])).toThrow(usage);
	});

	it('refuses Models from other providers, or with no name', () => {
		expect(() => parseScribeArgs(['takeaway-6', '--model', 'claude:x'])).toThrow(
			/Only Ollama Models so far.*"claude:x"/
		);
		expect(() => parseScribeArgs(['takeaway-6', '--model', 'ollama:'])).toThrow(
			/Only Ollama Models so far/
		);
	});
});
