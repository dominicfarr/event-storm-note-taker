/**
 * A language model that answers in JSON. Adapters live in `models/`. The
 * answer is whatever JSON the model wrote: the caller checks its shape.
 */
export interface Model {
	complete(request: { system: string; prompt: string }): Promise<unknown>;
}
