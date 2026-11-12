import { error } from '@sveltejs/kit';
import { findSession } from '#lib/server/sessions.ts';
import type { RequestHandler } from './$types';

/** The next chunk of a live Session's audio: a WAV body, with `?at=` its start in seconds. */
export const POST: RequestHandler = async ({ params, request, url }) => {
	const session = findSession(params.id);
	if (!session) error(404, 'No such Session.');
	const at = Number(url.searchParams.get('at') ?? Number.NaN);
	if (!Number.isFinite(at) || at < 0) error(400, 'Audio needs ?at= in seconds.');
	const kept = await session.live.receiveAudio(at, new Uint8Array(await request.arrayBuffer()));
	if (!kept) error(409, 'The Session has ended.');
	return new Response(null, { status: 204 });
};
