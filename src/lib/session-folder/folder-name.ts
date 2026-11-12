/**
 * The name of a Session's folder under the Session folder root: the day the
 * Session started, then its title in lower-case words joined by hyphens.
 * For example, "Ordering a Takeaway" on 12 November 2026 becomes
 * "2026-11-12-ordering-a-takeaway".
 */
export function sessionFolderName(title: string, startedOn: Date): string {
	const day = startedOn.toISOString().slice(0, 10);
	const words = title
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter(Boolean);
	return words.length > 0 ? `${day}-${words.join('-')}` : `${day}-untitled`;
}

/**
 * The name of a Run's folder: when it started, to the minute, then its Model.
 * For example, "2026-11-12T10-04-ollama-qwen3-8b" for `ollama:qwen3:8b`.
 */
export function runFolderName(startedAt: Date, model: string): string {
	const minute = startedAt.toISOString().slice(0, 16).replace(':', '-');
	return `${minute}-${model.replaceAll(/[^a-z0-9]+/gi, '-')}`;
}
