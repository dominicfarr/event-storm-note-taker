import type { Board, Sticky } from '#lib/board/board.ts';

/** A view of the Board. Kick Off and Enforce the Timeline arrive in later slices. */
export type View = 'chaotic-exploration';

/** A Sticky with where it goes on the Board, in Board units. */
export interface Placed {
	sticky: Sticky;
	x: number;
	y: number;
	width: number;
	height: number;
}

const columns = 6;
const width = 160;
const height = 100;
const gap = 24;

/** Where every Sticky goes in a view. Chaotic Exploration: a grid, in spoken order. */
export function layout(board: Board, view: View): Placed[] {
	if (view !== 'chaotic-exploration') throw new Error(`No layout for the ${view} view.`);
	return board.stickies.map((sticky, i) => ({
		sticky,
		x: (i % columns) * (width + gap),
		y: Math.floor(i / columns) * (height + gap),
		width,
		height
	}));
}

/** The ids of the Stickies that are new, or were mentioned again, since `before`. */
export function changedStickies(before: Board, after: Board): string[] {
	const mentions = new Map(before.stickies.map((sticky) => [sticky.id, sticky.mentions]));
	return after.stickies
		.filter((sticky) => mentions.get(sticky.id) !== sticky.mentions)
		.map((sticky) => sticky.id);
}
