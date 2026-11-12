import { defineConfig } from 'vitest/config';
import { loadEnv, type Plugin } from 'vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { spawn } from 'node:child_process';
import os from 'node:os';

export default defineConfig(({ mode }) => ({
	plugins: [
		whisperServer(loadEnv(mode, process.cwd(), 'WHISPER_')),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
}));

/**
 * Starts whisper.cpp's `whisper-server` with the dev server and stops it on
 * exit, so nothing keeps running when the app isn't. Reads WHISPER_MODEL (the
 * model file) and WHISPER_PORT from .env. Not a brew service: the formula has none.
 */
function whisperServer(env: Record<string, string>): Plugin {
	return {
		name: 'whisper-server',
		apply: 'serve',
		configureServer(server) {
			if (process.env.VITEST) return;
			const log = server.config.logger;
			const model = env.WHISPER_MODEL?.replace(/^~(?=\/)/, os.homedir());
			if (!model) {
				log.warn('WHISPER_MODEL is not set in .env, so whisper-server was not started.');
				return;
			}
			const port = env.WHISPER_PORT || '8178';
			const whisper = spawn(
				'whisper-server',
				['-m', model, '--host', '127.0.0.1', '--port', port],
				{
					stdio: 'ignore'
				}
			);
			whisper.on('error', (error) => log.error(`whisper-server didn't start: ${error.message}`));
			whisper.on('exit', (code) => code && log.error(`whisper-server stopped with code ${code}.`));
			log.info(`whisper-server starting on 127.0.0.1:${port} with ${model}`);
			const stop = () => whisper.kill();
			server.httpServer?.on('close', stop);
			process.on('exit', stop);
		}
	};
}
