/** Something said in a Session: its text, and when it was said in seconds from the start. */
export interface Speech {
	at: number;
	text: string;
}

/** Turns one chunk of a Session's audio (16 kHz mono WAV) into what was said in it. */
export interface Transcriber {
	transcribe(audio: { wav: Uint8Array; at: number }): Promise<Speech[]>;
}
