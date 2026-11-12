import type { Board } from '#lib/board/board.ts';

/** How alike a Sticky's text and an expected Domain Event are: 0 for no match, up to 1. */
export type Matcher = (sticky: string, expected: string) => number;

export interface Score {
	/** Expected Domain Events the Board has, in Expected List order, with the Sticky that caught each. */
	caught: { expected: string; sticky: string; similarity: number }[];
	/** Expected Domain Events the Board lacks. */
	missed: string[];
	/** Domain Events on the Board that catch nothing expected. */
	junk: string[];
}

/**
 * Compares a Run's Board with the Expected List. Each Sticky catches at most
 * one expected Domain Event, and the closest pairs are matched first. An
 * Expected List line may give other wordings after a "|", any of which counts.
 */
export function score(board: Board, expected: string[], match: Matcher = textSimilarity): Score {
	const stickies = board.stickies.filter((sticky) => sticky.kind === 'domain-event');
	const pairs = expected.flatMap((line, e) =>
		stickies.map((sticky, s) => {
			const wordings = line.split('|').map((wording) => wording.trim());
			return { e, s, similarity: Math.max(...wordings.map((w) => match(sticky.text, w))) };
		})
	);
	pairs.sort((a, b) => b.similarity - a.similarity);

	const catcher = new Map<number, { s: number; similarity: number }>();
	const used = new Set<number>();
	for (const { e, s, similarity } of pairs) {
		if (similarity <= 0 || catcher.has(e) || used.has(s)) continue;
		catcher.set(e, { s, similarity });
		used.add(s);
	}

	return {
		caught: expected.flatMap((line, e) => {
			const found = catcher.get(e);
			if (!found) return [];
			const similarity = Math.round(found.similarity * 100) / 100;
			return [{ expected: line, sticky: stickies[found.s].text, similarity }];
		}),
		missed: expected.filter((_, e) => !catcher.has(e)),
		junk: stickies.filter((_, s) => !used.has(s)).map((sticky) => sticky.text)
	};
}

/**
 * Dice similarity of the two texts' letter pairs, after lower-casing and
 * dropping punctuation. Below 0.6 it counts as no match: Domain Events are
 * named thing first, so two events about the same thing ("Driver Assigned",
 * "Driver Arrived") share most of their letters.
 */
export const textSimilarity: Matcher = (a, b) => {
	const x = letterPairs(a);
	const y = letterPairs(b);
	if (x.length + y.length === 0) return 0;
	const left = [...y];
	let shared = 0;
	for (const pair of x) {
		const i = left.indexOf(pair);
		if (i >= 0) {
			shared++;
			left.splice(i, 1);
		}
	}
	const similarity = (2 * shared) / (x.length + y.length);
	return similarity >= 0.6 ? similarity : 0;
};

function letterPairs(text: string): string[] {
	const normal = text
		.toLowerCase()
		.replaceAll(/[^a-z0-9]+/g, ' ')
		.trim();
	return Array.from({ length: Math.max(normal.length - 1, 0) }, (_, i) => normal.slice(i, i + 2));
}
