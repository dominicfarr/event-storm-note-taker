import { error, json } from '@sveltejs/kit';
import { startSession } from '#lib/server/sessions.ts';
import type { RequestHandler } from './$types';

/** Starts a Session. Body: `{ "title": "Ordering a takeaway" }`. Answers `{ "id": … }`. */
export const POST: RequestHandler = async ({ request }) => {
	const { title } = (await request.json()) as { title?: unknown };
	if (typeof title !== 'string' || title.trim() === '') error(400, 'A Session needs a title.');
	return json({ id: await startSession(title.trim()) }, { status: 201 });
};
