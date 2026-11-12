<!--
	The Board view drawn with Svelte Flow, which gives pan and zoom. The only
	file that imports @xyflow/svelte: positions come from our layout, not from it.
-->
<script lang="ts">
	import { Background, Controls, SvelteFlow, type Node } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { BoardViewProps } from './board-view.ts';
	import StickyNode from './StickyNode.svelte';

	let { placed, highlight }: BoardViewProps = $props();

	const nodeTypes = { sticky: StickyNode };
	let nodes = $derived<Node[]>(
		placed.map(({ sticky, x, y, width, height }) => ({
			id: sticky.id,
			type: 'sticky',
			position: { x, y },
			width,
			height,
			data: { text: sticky.text, mentions: sticky.mentions, fresh: highlight.includes(sticky.id) },
			draggable: false,
			connectable: false
		}))
	);
</script>

<SvelteFlow
	bind:nodes
	edges={[]}
	{nodeTypes}
	initialViewport={{ x: 24, y: 24, zoom: 0.9 }}
	minZoom={0.2}
>
	<Background />
	<Controls showLock={false} />
</SvelteFlow>
