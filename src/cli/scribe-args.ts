import { parseArgs } from 'node:util';

export type ScribeArgs = { session: string; provider: 'ollama'; model: string };

export const usage = 'Usage: npm run scribe -- <session> [--model ollama:qwen3:8b]';

export function parseScribeArgs(argv: string[]): ScribeArgs {
	const { values, positionals } = parseOrExplain(argv);
	const [session, ...extra] = positionals;
	if (!session || extra.length > 0) throw new Error(usage);

	const [provider, ...rest] = values.model.split(':');
	const model = rest.join(':');
	if (provider !== 'ollama' || !model)
		throw new Error(`Only Ollama Models so far, such as ollama:qwen3:8b, not "${values.model}".`);

	return { session, provider, model };
}

function parseOrExplain(argv: string[]) {
	try {
		return parseArgs({
			args: argv,
			allowPositionals: true,
			options: { model: { type: 'string', default: 'ollama:qwen3:8b' } }
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message.split('.')[0] : String(error);
		throw new Error(`${reason} ${usage}`, { cause: error });
	}
}
