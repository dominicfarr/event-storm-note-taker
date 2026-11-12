import { defineEnvVars } from '@sveltejs/kit/env';
import os from 'node:os';
import path from 'node:path';

const expandHome = (dir: string) =>
	dir === '~' || dir.startsWith('~/') ? path.join(os.homedir(), dir.slice(1)) : dir;

/** Where Sessions are kept, from EVENTSTORM_HOME's value. Also used by the CLI. */
export const eventStormHome = (value: string | undefined) => expandHome(value || '~/EventStorm');

/** Read from .env (see .env.example). Server-only: imported from `$app/env/private`. */
export const variables = defineEnvVars({
	EVENTSTORM_HOME: {
		description: 'Where Sessions are kept, one folder each. Defaults to ~/EventStorm.',
		schema: eventStormHome
	},
	WHISPER_PORT: {
		description: "whisper-server's port on 127.0.0.1. Defaults to 8178.",
		schema: (value) => {
			const port = Number(value || '8178');
			if (!Number.isInteger(port)) throw new Error('WHISPER_PORT must be a port number');
			return port;
		}
	}
});
