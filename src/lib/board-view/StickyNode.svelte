<!-- One Domain Event Sticky: orange, with its Mentions counted. Fresh ones glow for a moment. -->
<script lang="ts">
	let { data }: { data: { text: string; mentions: number; fresh: boolean } } = $props();
</script>

<div class="sticky" class:fresh={data.fresh}>
	<span>{data.text}</span>
	{#if data.mentions > 0}<small title="Said {data.mentions + 1} times">×{data.mentions + 1}</small
		>{/if}
</div>

<style>
	.sticky {
		position: relative;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		display: grid;
		place-items: center;
		padding: 0.5rem;
		background: #ffa94d;
		box-shadow: 2px 3px 6px rgb(0 0 0 / 20%);
		font:
			600 14px/1.25 system-ui,
			sans-serif;
		text-align: center;
		transition: box-shadow 0.4s;
	}
	.fresh {
		box-shadow:
			0 0 0 4px #1c7ed6,
			2px 3px 6px rgb(0 0 0 / 20%);
	}
	small {
		position: absolute;
		right: 0.4rem;
		bottom: 0.25rem;
		font-weight: 400;
	}
</style>
