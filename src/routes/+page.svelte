<script lang="ts">
	import { startMicrophone } from '#lib/audio/microphone.ts';
	import type { RunUpdate } from '#lib/run/run.ts';
	import type { Speech } from '#lib/transcriber/transcriber.ts';

	let title = $state('Ordering a takeaway');
	let sessionId = $state<string | null>(null);
	let listening = $state(false);
	let transcript = $state<Speech[]>([]);
	let problem = $state('');
	let stopMicrophone: (() => Promise<void>) | null = null;
	let uploads = Promise.resolve();
	let lastAt = 0;

	async function start() {
		problem = '';
		transcript = [];
		const response = await fetch('/api/sessions', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title })
		});
		if (!response.ok) {
			problem = `Couldn't start the Session (${response.status}).`;
			return;
		}
		const id: string = (await response.json()).id;
		const updates = new EventSource(`/api/sessions/${id}/events`);
		updates.onmessage = (event) => {
			const update: RunUpdate = JSON.parse(event.data);
			if (update.type === 'speech') transcript = [...transcript, update.speech];
			else if (update.type === 'problem') problem = update.message;
			else updates.close();
		};
		try {
			// Chunks are sent one after another, so the Recording keeps their order.
			stopMicrophone = await startMicrophone((wav, at) => {
				lastAt = at;
				uploads = uploads.then(() => send(`/api/sessions/${id}/audio?at=${at}`, wav));
			});
			sessionId = id;
			listening = true;
		} catch (error) {
			problem = `The microphone isn't available: ${String(error)}`;
			updates.close();
		}
	}

	async function stop() {
		listening = false;
		await stopMicrophone?.();
		await uploads;
		await send(`/api/sessions/${sessionId}/end?at=${lastAt + 5}`);
	}

	async function send(url: string, body?: Uint8Array) {
		const response = await fetch(url, {
			method: 'POST',
			body: body && new Blob([new Uint8Array(body)])
		});
		if (!response.ok) problem = `The server answered ${response.status} to ${url}.`;
	}
</script>

<svelte:head>
	<title>Event Storm Note Taker</title>
</svelte:head>

<main>
	<h1>Event Storm Note Taker</h1>

	<form onsubmit={(event) => (event.preventDefault(), listening ? stop() : start())}>
		<label>
			Session title
			<input bind:value={title} disabled={listening} required />
		</label>
		<button type="submit">{listening ? 'Stop' : 'Start'}</button>
	</form>

	{#if listening}<p>Listening. Your words appear a few seconds after you say them.</p>{/if}
	{#if sessionId && !listening}<p>
			Session <code>{sessionId}</code> is saved in the Session folder.
		</p>{/if}
	{#if problem}<p role="alert">{problem}</p>{/if}

	<ol>
		{#each transcript as speech, i (i)}
			<li>
				<span
					>{Math.floor(speech.at / 60)}:{String(Math.floor(speech.at % 60)).padStart(2, '0')}</span
				>
				{speech.text}
			</li>
		{/each}
	</ol>
</main>

<style>
	main {
		max-width: 48rem;
		margin: 2rem auto;
		padding: 0 1rem;
		font-family: system-ui, sans-serif;
	}
	form {
		display: flex;
		gap: 0.5rem;
		align-items: end;
	}
	label {
		display: grid;
		flex: 1;
	}
	li span {
		color: #666;
		font-variant-numeric: tabular-nums;
	}
	[role='alert'] {
		color: #b00020;
	}
</style>
