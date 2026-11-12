import { describe, expect, it } from 'vitest';
import { apply, emptyBoard, type Board, type ScribeChange } from './board';

const applyAll = (changes: ScribeChange[], board: Board = emptyBoard()) =>
	changes.reduce((current, change) => apply(current, change).board, board);

describe('the Board', () => {
	it('adds Domain Events in the order they were said, each with a stable id', () => {
		const board = applyAll([
			{ change: 'add-domain-event', text: 'Restaurant Chosen', saidAt: 0 },
			{ change: 'add-domain-event', text: ' Order Paid ', saidAt: 5 }
		]);

		expect(board.stickies).toEqual([
			{ id: 's1', kind: 'domain-event', text: 'Restaurant Chosen', mentions: 0, saidAt: 0 },
			{ id: 's2', kind: 'domain-event', text: 'Order Paid', mentions: 0, saidAt: 5 }
		]);
	});

	it('counts a Mention of a Sticky instead of repeating it', () => {
		const board = applyAll([
			{ change: 'add-domain-event', text: 'Order Paid', saidAt: 0 },
			{ change: 'add-mention', id: 's1' },
			{ change: 'add-mention', id: 's1' }
		]);

		expect(board.stickies).toHaveLength(1);
		expect(board.stickies[0].mentions).toBe(2);
	});

	it('turns a Domain Event already on the Board, in the same words, into a Mention', () => {
		const board = applyAll([
			{ change: 'add-domain-event', text: 'Order Paid', saidAt: 0 },
			{ change: 'add-domain-event', text: 'order paid.', saidAt: 9 }
		]);

		expect(board.stickies).toEqual([expect.objectContaining({ id: 's1', mentions: 1, saidAt: 0 })]);
	});

	it('refuses a Mention of a Sticky that is not there, and a Domain Event with no name', () => {
		const board = applyAll([{ change: 'add-domain-event', text: 'Order Paid', saidAt: 0 }]);

		expect(apply(board, { change: 'add-mention', id: 's9' })).toEqual({
			board,
			applied: false,
			reason: 'There is no Sticky s9.'
		});
		expect(apply(board, { change: 'add-domain-event', text: '  ', saidAt: 3 })).toMatchObject({
			board,
			applied: false
		});
	});

	it('leaves the Board it was given as it was', () => {
		const before = applyAll([{ change: 'add-domain-event', text: 'Order Paid', saidAt: 0 }]);
		apply(before, { change: 'add-mention', id: 's1' });
		apply(before, { change: 'add-domain-event', text: 'Driver Assigned', saidAt: 4 });

		expect(before.stickies).toEqual([expect.objectContaining({ mentions: 0 })]);
	});
});
