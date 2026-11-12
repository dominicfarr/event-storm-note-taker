<script lang="ts">
	import { startMicrophone } from '#lib/audio/microphone.ts';
	import { emptyBoard, type Board } from '#lib/board/board.ts';
	import { BoardView } from '#lib/board-view/board-view.ts';
	import type { RunUpdate } from '#lib/run/run.ts';
	import type { Speech } from '#lib/transcriber/transcriber.ts';
	import { changedStickies, layout } from '#lib/views/layout.ts';

	const highlightFor = 4000; // ms a changed Sticky stays highlighted

	let title = $state('Ordering a takeaway');
	let sessionId = $state<string | null>(null);
	let listening = $state(false);
	let transcript = $state<Speech[]>([]);
	let problem = $state('');
	let board = $state.raw<Board>(emptyBoard());
	let highlight = $state.raw<string[]>([]);
	let placed = $derived(layout(board, 'chaotic-exploration'));
	let unhighlight: ReturnType<typeof setTimeout> | undefined;
	let stopMicrophone: (() => Promise<void>) | null = null;
	let uploads = Promise.resolve();
	let lastAt = 0;

	async function start() {
		problem = '';
		transcript = [];
		board = emptyBoard();
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
			else if (update.type === 'board') show(update.board);
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

	function show(next: Board) {
		highlight = changedStickies(board, next);
		board = next;
		clearTimeout(unhighlight);
		unhighlight = setTimeout(() => (highlight = []), highlightFor);
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

	{#if listening}<p>
			Listening. Your words appear a few seconds after you say them, and Domain Events a few seconds
			after that.
		</p>{/if}
	{#if sessionId && !listening}<p>
			Session <code>{sessionId}</code> is saved in the Session folder.
		</p>{/if}
	{#if problem}<p role="alert">{problem}</p>{/if}

	<div class="session">
		<section class="board" aria-label="Board">
			<BoardView {placed} {highlight} />
		</section>

		<ol aria-label="Transcript">
			{#each transcript as speech, i (i)}
				<li>
					<span
						>{Math.floor(speech.at / 60)}:{String(Math.floor(speech.at % 60)).padStart(
							2,
							'0'
						)}</span
					>
					{speech.text}
				</li>
			{/each}
		</ol>
	</div>
</main>

<style>
	main {
		max-width: 80rem;
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
	.session {
		display: grid;
		grid-template-columns: 1fr 18rem;
		gap: 1rem;
	}
	.board {
		height: 70vh;
		border: 1px solid #ddd;
	}
	ol {
		max-height: 70vh;
		margin: 0;
		overflow-y: auto;
	}
	li span {
		color: #666;
		font-variant-numeric: tabular-nums;
	}
	[role='alert'] {
		color: #b00020;
	}
</style>
