import { error } from '@sveltejs/kit';
import { findSession } from '#lib/server/sessions.ts';
import type { RequestHandler } from './$types';

/** Ends a live Session, with `?at=` the moment it ended in seconds. */
export const POST: RequestHandler = async ({ params, url }) => {
	const session = findSession(params.id);
	if (!session) error(404, 'No such Session.');
	session.live.end(Number(url.searchParams.get('at')) || 0);
	return new Response(null, { status: 204 });
};
