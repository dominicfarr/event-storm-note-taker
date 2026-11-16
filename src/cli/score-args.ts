import { parseArgs } from 'node:util';

export type ScoreArgs = { help: true } | { help: false; session: string; run: string | undefined };

export const usage = 'Usage: npm run score -- <session> <run>';

export function parseScoreArgs(argv: string[]): ScoreArgs {
	const { values, positionals } = parseOrExplain(argv);
	if (values.help) return { help: true };

	const [session, run, ...extra] = positionals;
	if (!session || extra.length > 0) throw new Error(usage);

	return { help: false, session, run };
}

function parseOrExplain(argv: string[]) {
	try {
		return parseArgs({
			args: argv,
			allowPositionals: true,
			options: { help: { type: 'boolean', short: 'h', default: false } }
		});
	} catch (error) {
		const reason = error instanceof Error ? error.message.split('.')[0] : String(error);
		throw new Error(`${reason} ${usage}`, { cause: error });
	}
}
