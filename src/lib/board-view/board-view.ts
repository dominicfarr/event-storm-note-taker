import type { Placed } from '#lib/views/layout.ts';

/**
 * What every Board view adapter takes: the placed Stickies of the current
 * view, and the ids of Stickies to highlight because they just changed.
 */
export interface BoardViewProps {
	placed: Placed[];
	highlight: string[];
}

// The only adapter, Svelte Flow. Swapping it means changing this line.
export { default as BoardView } from './SvelteFlowBoardView.svelte';
