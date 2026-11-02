// Mono microphone PCM, 16 kHz, in 100 ms packets. Never connects microphone
// sound to speakers; the downstream node is silent.
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.packet = new Int16Array(1600);
    this.offset = 0;
    this.phase = 0;
    this.sum = 0;
    this.count = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    for (const value of input) {
      this.sum += value;
      this.count++;
      this.phase += 16000;
      if (this.phase >= sampleRate) {
        this.phase -= sampleRate;
        const sample = Math.max(-1, Math.min(1, this.sum / this.count));
        this.packet[this.offset++] = Math.round(
          sample * (sample < 0 ? 32768 : 32767),
        );
        this.sum = 0;
        this.count = 0;
        if (this.offset === this.packet.length) {
          this.port.postMessage(this.packet.buffer, [this.packet.buffer]);
          this.packet = new Int16Array(1600);
          this.offset = 0;
        }
      }
    }
    return true;
  }
}
registerProcessor("classyar-pcm", PcmCapture);
