// npm run score -- <session> <run>
// Scores a Run's Board against the Session's Expected List and writes score.json.
import path from 'node:path';
import { eventStormHome } from '../env.ts';
import { score } from '#lib/scoring/score.ts';
import { openSessionFolder } from '#lib/session-folder/folder.ts';

const [session, runName] = process.argv.slice(2);
if (!session || !runName) fail('Usage: npm run score -- <session> <run>');

try {
	const folder = await openSessionFolder(eventStormHome(process.env.EVENTSTORM_HOME), session);
	const expected = await folder.expected();
	if (!expected?.length)
		fail(
			`There is no Expected List in ${path.join(folder.dir, 'expected.txt')}: ` +
				'write one Domain Event per line, in order (see the README).'
		);
	const run = await folder.openRunFolder(runName);
	const result = score(await run.board(), expected);
	await run.keepScore(result);

	const { caught, junk } = result;
	console.log(
		`Caught ${caught.length} of ${expected.length} expected Domain Events, ${junk.length} junk\n`
	);
	for (const line of expected) {
		const found = caught.find((c) => c.expected === line);
		console.log(found ? `  ✓ ${line} ← ${found.sticky} (${found.similarity})` : `  ✗ ${line}`);
	}
	for (const text of junk) console.log(`  junk: ${text}`);
	console.log(`\nWrote ${path.join(run.dir, 'score.json')}`);
} catch (error) {
	fail(error instanceof Error ? error.message : String(error));
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}
