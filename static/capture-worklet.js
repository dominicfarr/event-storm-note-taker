// Passes each block of microphone samples (mono, at the AudioContext's rate)
// to the page, which chunks and encodes them. Served as-is from /static.
class CaptureProcessor extends AudioWorkletProcessor {
	process(inputs) {
		const channel = inputs[0]?.[0];
		if (channel) this.port.postMessage(channel.slice());
		return true;
	}
}

registerProcessor('capture', CaptureProcessor);
