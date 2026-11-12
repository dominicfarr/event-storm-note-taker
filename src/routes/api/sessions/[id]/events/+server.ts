import { error } from '@sveltejs/kit';
import { findSession } from '#lib/server/sessions.ts';
import type { RequestHandler } from './$types';

/** A live Session's Run updates, as server-sent events: every update so far, then each new one. */
export const GET: RequestHandler = ({ params }) => {
	const session = findSession(params.id);
	if (!session) error(404, 'No such Session.');
	let stop = () => {};
	const stream = new ReadableStream<string>({
		start(controller) {
			stop = session.run.subscribe((update) => {
				controller.enqueue(`data: ${JSON.stringify(update)}\n\n`);
			});
		},
		cancel() {
			stop();
		}
	});
	return new Response(stream.pipeThrough(new TextEncoderStream()), {
		headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }
	});
};
