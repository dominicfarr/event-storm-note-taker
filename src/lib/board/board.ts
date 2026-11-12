/** One item on the Board. Only Domain Events so far; Hot Spots arrive in a later slice. */
export interface Sticky {
	/** Short and stable, such as "s7", so the Scribe can refer to it. */
	id: string;
	kind: 'domain-event';
	text: string;
	/** How many times it was said again after it was added. */
	mentions: number;
	/** Seconds into the Session when it was first said. */
	saidAt: number;
}

/** Everything drawn during one Run. Stickies are kept in the order they were added. */
export interface Board {
	stickies: Sticky[];
}

/** A change the Scribe asks for. */
export type ScribeChange =
	| { change: 'add-domain-event'; text: string; saidAt: number }
	| { change: 'add-mention'; id: string };

export function emptyBoard(): Board {
	return { stickies: [] };
}

/**
 * Applies one change and returns the new Board; the old one is left as it
 * was. A change that can't be applied comes back with `applied: false` and
 * the reason. Adding a Domain Event that is already on the Board, by the
 * same words, adds a Mention instead of a second Sticky.
 */
export function apply(
	board: Board,
	change: ScribeChange
): { board: Board; applied: boolean; reason?: string } {
	if (change.change === 'add-mention') {
		if (!board.stickies.some((sticky) => sticky.id === change.id))
			return { board, applied: false, reason: `There is no Sticky ${change.id}.` };
		return { board: mention(board, change.id), applied: true };
	}

	const text = change.text.trim();
	if (!text) return { board, applied: false, reason: 'A Domain Event needs a name.' };
	const same = board.stickies.find((sticky) => normalise(sticky.text) === normalise(text));
	if (same) return { board: mention(board, same.id), applied: true };
	const sticky: Sticky = {
		id: `s${board.stickies.length + 1}`,
		kind: 'domain-event',
		text,
		mentions: 0,
		saidAt: change.saidAt
	};
	return { board: { ...board, stickies: [...board.stickies, sticky] }, applied: true };
}

function mention(board: Board, id: string): Board {
	return {
		...board,
		stickies: board.stickies.map((sticky) =>
			sticky.id === id ? { ...sticky, mentions: sticky.mentions + 1 } : sticky
		)
	};
}

const normalise = (text: string) =>
	text
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, ' ')
		.trim();
