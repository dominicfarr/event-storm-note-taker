import { describe, expect, it } from 'vitest';
import type { Board } from '#lib/board/board.ts';
import { score, textSimilarity } from './score';

const board = (...texts: string[]): Board => ({
	stickies: texts.map((text, i) => ({
		id: `s${i + 1}`,
		kind: 'domain-event',
		text,
		mentions: 0,
		saidAt: i * 5
	}))
});

describe('score', () => {
	it('sorts the Board into caught, missed and junk against the Expected List', () => {
		const result = score(board('order placed!', 'Dog Barked'), ['Order Placed', 'Order Paid']);

		expect(result).toEqual({
			caught: [{ expected: 'Order Placed', sticky: 'order placed!', similarity: 1 }],
			missed: ['Order Paid'],
			junk: ['Dog Barked']
		});
	});

	it('catches a near wording of the same Domain Event, not a different one', () => {
		const result = score(board('Restaurant Selected', 'Driver Arrived'), [
			'Restaurant Chosen',
			'Driver Assigned'
		]);

		expect(result.caught.map(({ expected, sticky }) => [expected, sticky])).toEqual([
			['Restaurant Chosen', 'Restaurant Selected']
		]);
		expect(result.missed).toEqual(['Driver Assigned']);
		expect(result.junk).toEqual(['Driver Arrived']);
	});

	it('lets each Sticky catch one expected Domain Event, the closest one', () => {
		const result = score(board('Food Delivered'), ['Order Delivered', 'Food Delivered']);

		expect(result.caught.map(({ expected }) => expected)).toEqual(['Food Delivered']);
		expect(result.missed).toEqual(['Order Delivered']);
	});

	it('lists caught Domain Events in Expected List order', () => {
		const result = score(board('Order Paid', 'Order Placed'), ['Order Placed', 'Order Paid']);

		expect(result.caught.map(({ expected }) => expected)).toEqual(['Order Placed', 'Order Paid']);
	});

	it('accepts any of the wordings an Expected List line gives, separated by "|"', () => {
		const result = score(board('Takeaway Ordered'), ['Order Placed | Takeaway Ordered']);

		expect(result.caught).toEqual([
			{ expected: 'Order Placed | Takeaway Ordered', sticky: 'Takeaway Ordered', similarity: 1 }
		]);
	});

	it('takes another matcher', () => {
		const sameFirstWord = (a: string, b: string) => (a.split(' ')[0] === b.split(' ')[0] ? 1 : 0);

		const result = score(board('Order Shipped'), ['Order Placed'], sameFirstWord);

		expect(result.caught.map(({ sticky }) => sticky)).toEqual(['Order Shipped']);
	});
});

describe('textSimilarity', () => {
	it('is 1 for the same words, whatever the case and punctuation', () => {
		expect(textSimilarity('Order Placed', ' order-placed. ')).toBe(1);
	});

	it('is 0 for wordings too far apart to count', () => {
		expect(textSimilarity('Order Accepted', 'Order Delivered')).toBe(0);
		expect(textSimilarity('Cooking Started', 'Food Cooked')).toBe(0);
	});
});
