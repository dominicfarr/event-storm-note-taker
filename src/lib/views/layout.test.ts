import { describe, expect, it } from 'vitest';
import { apply, emptyBoard, type Board, type ScribeChange } from '#lib/board/board.ts';
import { changedStickies, layout } from './layout';

const domainEvents = (count: number): Board =>
	Array.from({ length: count }, (_, i) => i).reduce(
		(board, i) =>
			apply(board, { change: 'add-domain-event', text: `Event ${i + 1}`, saidAt: i }).board,
		emptyBoard()
	);

describe('the Chaotic Exploration view', () => {
	it('places the Stickies in a grid six wide, in spoken order', () => {
		const placed = layout(domainEvents(8), 'chaotic-exploration');

		expect(placed.map(({ sticky, x, y }) => [sticky.text, x, y])).toEqual([
			['Event 1', 0, 0],
			['Event 2', 184, 0],
			['Event 3', 368, 0],
			['Event 4', 552, 0],
			['Event 5', 736, 0],
			['Event 6', 920, 0],
			['Event 7', 0, 124],
			['Event 8', 184, 124]
		]);
		expect(placed[0]).toMatchObject({ width: 160, height: 100 });
	});
});

describe('changedStickies', () => {
	it('picks out the Stickies that are new or were mentioned again', () => {
		const before = domainEvents(2);
		const changes: ScribeChange[] = [
			{ change: 'add-mention', id: 's1' },
			{ change: 'add-domain-event', text: 'Driver Assigned', saidAt: 9 }
		];
		const after = changes.reduce((board, change) => apply(board, change).board, before);

		expect(changedStickies(before, after)).toEqual(['s1', 's3']);
		expect(changedStickies(after, after)).toEqual([]);
	});
});
