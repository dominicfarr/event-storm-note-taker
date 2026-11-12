/** One thing that happens in a Session's conversation, `at` seconds from its start. */
export type ConversationEvent =
	{ type: 'audio'; at: number; wav: Uint8Array } | { type: 'end'; at: number };

/** Where a Run hears its conversation from: live, or (later) a Recording. */
export interface ConversationSource {
	events(): AsyncIterable<ConversationEvent>;
}
