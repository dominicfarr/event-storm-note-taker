import { describe, expect, it } from 'vitest';
import { apply, emptyBoard } from '#lib/board/board.ts';
import type { Model } from './model';
import { createScribe } from './scribe';

/** A fake Model that gives a canned answer and remembers what it was asked. */
const fakeModel = (answer: unknown) => {
	const asked: { system: string; prompt: string }[] = [];
	const model: Model = {
		async complete(request) {
			asked.push(request);
			return answer;
		}
	};
	return { model, asked };
};

const speech = [
	{ at: 10, text: 'Once I have paid, the restaurant accepts the order.' },
	{ at: 15, text: 'The weather is nice today.' }
];

describe('the Scribe', () => {
	it('shows the Model the Board with Sticky ids and the new speech with its times', async () => {
		const { model, asked } = fakeModel({ changes: [] });
		const board = apply(emptyBoard(), {
			change: 'add-domain-event',
			text: 'Order Paid',
			saidAt: 0
		}).board;

		await createScribe(model).hear({ board, speech });

		expect(asked[0].prompt).toContain('s1: Order Paid');
		expect(asked[0].prompt).toContain('[10s] Once I have paid, the restaurant accepts the order.');
		expect(asked[0].system).toContain('Domain Event');
	});

	it('turns the answer into changes, dating new Domain Events by the first speech heard', async () => {
		const { model } = fakeModel({
			changes: [
				{ change: 'add-domain-event', text: ' Order Accepted ' },
				{ change: 'add-mention', id: 's1' }
			]
		});

		const changes = await createScribe(model).hear({ board: emptyBoard(), speech });

		expect(changes).toEqual([
			{ change: 'add-domain-event', text: 'Order Accepted', saidAt: 10 },
			{ change: 'add-mention', id: 's1' }
		]);
	});

	it('drops and logs changes it is not allowed to make or that are missing a field', async () => {
		const logged: string[] = [];
		const { model } = fakeModel({
			changes: [
				{ change: 'add-hot-spot', text: 'Who pays the driver?' },
				{ change: 'add-domain-event' },
				{ change: 'add-mention', id: 3 },
				null,
				{ change: 'add-domain-event', text: 'Driver Assigned' }
			]
		});

		const changes = await createScribe(model, (message) => logged.push(message)).hear({
			board: emptyBoard(),
			speech
		});

		expect(changes).toEqual([{ change: 'add-domain-event', text: 'Driver Assigned', saidAt: 10 }]);
		expect(logged).toHaveLength(4);
	});

	it('makes no changes from an answer without a list of changes', async () => {
		const logged: string[] = [];
		const { model } = fakeModel({ events: ['Order Accepted'] });

		const changes = await createScribe(model, (message) => logged.push(message)).hear({
			board: emptyBoard(),
			speech
		});

		expect(changes).toEqual([]);
		expect(logged).toEqual([expect.stringContaining('no list of changes')]);
	});

	it('does not ask the Model when there is no new speech', async () => {
		const { model, asked } = fakeModel({ changes: [] });

		expect(await createScribe(model).hear({ board: emptyBoard(), speech: [] })).toEqual([]);
		expect(asked).toEqual([]);
	});
});
