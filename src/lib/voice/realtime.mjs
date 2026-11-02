export function encodePCM(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
export function decodePCM(data) {
  const binary = atob(data),
    bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (bytes.byteLength % 2) throw Error("Invalid PCM audio");
  const view = new DataView(bytes.buffer),
    samples = new Float32Array(bytes.byteLength / 2);
  for (let i = 0; i < samples.length; i++)
    samples[i] = view.getInt16(i * 2, true) / 32768;
  return samples;
}

export class RealtimeVoice {
  constructor({ onMessage, onState, onTool, onError, onLevel }) {
    Object.assign(this, { onMessage, onState, onTool, onError, onLevel });
    this.closed = false;
    this.muted = false;
    this.sources = new Set();
    this.nextTime = 0;
    this.cancelledTools = new Set();
    this.completedTools = new Map();
    this.tools = Promise.resolve();
    this.abort = new AbortController();
  }
  async prepare() {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.AudioContext ||
      !window.AudioWorkletNode
    )
      throw Error(
        "مکالمهٔ زنده به مرورگر جدید و اتصال localhost یا HTTPS نیاز دارد.",
      );
    this.audio = new AudioContext();
    await this.audio.resume();
    this.media = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    if (this.closed) this.media.getTracks().forEach((track) => track.stop());
  }
  async start(credentials) {
    try {
      if (
        !navigator.mediaDevices?.getUserMedia ||
        !window.AudioContext ||
        !window.AudioWorkletNode
      )
        throw Error(
          "مکالمهٔ زنده به مرورگر جدید و اتصال localhost یا HTTPS نیاز دارد.",
        );
      this.onState("connecting");
      if (!this.media) await this.prepare();
      if (this.closed) {
        this.media.getTracks().forEach((track) => track.stop());
        return;
      }
      await this.audio.audioWorklet.addModule("/audio/pcm-capture.worklet.js");
      if (this.closed) return;
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: credentials.token,
        httpOptions: { apiVersion: "v1alpha" },
      });
      this.connectTimeout = setTimeout(
        () => this.fail("زمان اتصال مکالمه تمام شد؛ دوباره شروع کنید."),
        20000,
      );
      const session = await ai.live.connect({
        model: credentials.model,
        config: { ...credentials.config, abortSignal: this.abort.signal },
        callbacks: {
          onmessage: (message) => this.receive(message),
          onerror: () =>
            this.fail(
              "ارتباط صوتی قطع شد؛ اینترنت و دسترسی به Gemini Live را بررسی کنید.",
            ),
          onclose: () => {
            if (!this.closed) {
              this.stop();
              this.onState("ended");
            }
          },
        },
      });
      if (this.closed) {
        session.close();
        return;
      }
      this.session = session;
      clearTimeout(this.connectTimeout);
      this.source = this.audio.createMediaStreamSource(this.media);
      this.capture = new AudioWorkletNode(this.audio, "classyar-pcm");
      const silent = this.audio.createGain();
      silent.gain.value = 0;
      this.source.connect(this.capture);
      this.capture.connect(silent);
      silent.connect(this.audio.destination);
      this.capture.port.onmessage = ({ data }) => {
        if (this.closed || this.muted) return;
        try {
          const samples = new Int16Array(data);
          let energy = 0;
          for (const value of samples) energy += value * value;
          this.onLevel?.(
            Math.min(1, Math.sqrt(energy / samples.length) / 8000),
          );
          this.session.sendRealtimeInput({
            audio: { mimeType: "audio/pcm;rate=16000", data: encodePCM(data) },
          });
        } catch {
          this.fail("ارسال صدا متوقف شد؛ مکالمه را دوباره شروع کنید.");
        }
      };
      this.onState("listening");
      this.expiry = setTimeout(
        () =>
          this.fail("این نوبت مکالمه تمام شد؛ برای ادامه دوباره شروع کنید."),
        Math.max(
          1000,
          new Date(credentials.expiresAt).getTime() - Date.now() - 5000,
        ),
      );
      if (credentials.history?.length)
        session.sendClientContent({
          turns: credentials.history.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            parts: [{ text: message.text }],
          })),
          turnComplete: false,
        });
      session.sendClientContent({
        turns: [
          {
            role: "user",
            parts: [
              {
                text: "سلام؛ مکالمه را شروع کن. کوتاه به فارسی بگو که آماده‌ای و منتظر درخواست من بمان.",
              },
            ],
          },
        ],
        turnComplete: true,
      });
    } catch (error) {
      if (!this.closed)
        this.fail(
          error.name === "NotAllowedError"
            ? "اجازهٔ میکروفن داده نشد؛ از تنظیمات مرورگر دسترسی بدهید."
            : error.name === "NotFoundError"
              ? "میکروفنی پیدا نشد."
              : "مکالمهٔ زنده برقرار نشد؛ دسترسی میکروفن و Gemini Live را بررسی کنید.",
        );
    }
  }
  receive(message) {
    if (this.closed) return;
    if (message.toolCallCancellation)
      for (const id of message.toolCallCancellation.ids || [])
        this.cancelledTools.add(id);
    const content = message.serverContent;
    if (content?.interrupted) {
      this.interrupt();
      this.onState("listening");
    }
    this.onMessage(message);
    if (this.closed) return;
    for (const part of content?.modelTurn?.parts || [])
      if (
        part.inlineData?.data &&
        part.inlineData.mimeType?.startsWith("audio/pcm")
      )
        this.play(part.inlineData);
    if (content?.turnComplete) {
      clearTimeout(this.playbackEnd);
      this.playbackEnd = setTimeout(
        () => {
          if (!this.closed) this.onState("listening");
        },
        Math.max(0, this.nextTime - (this.audio?.currentTime || 0)) * 1000 + 50,
      );
    }
    if (message.goAway)
      this.onMessage({
        notice: "زمان این اتصال رو به پایان است؛ پس از قطع، دوباره شروع کنید.",
      });
    if (message.toolCall)
      for (const call of message.toolCall.functionCalls || []) {
        this.tools = this.tools
          .then(async () => {
            if (this.closed || this.cancelledTools.has(call.id)) return;
            this.onState("working");
            let result;
            try {
              result = this.completedTools.get(call.id);
              if (!result) {
                result = await this.onTool(
                  call,
                  () => this.closed || this.cancelledTools.has(call.id),
                );
                if (call.id) {
                  this.completedTools.set(call.id, result);
                  if (this.completedTools.size > 200)
                    this.completedTools.delete(
                      this.completedTools.keys().next().value,
                    );
                }
              }
            } catch {
              result = { error: "عملیات انجام نشد؛ دوباره درخواست بدهید." };
            }
            if (!this.closed && !this.cancelledTools.has(call.id))
              this.session.sendToolResponse({
                functionResponses: [
                  { id: call.id, name: call.name, response: result },
                ],
              });
          })
          .catch(() => {
            if (!this.closed)
              this.fail("پاسخ عملیات به مکالمه ارسال نشد؛ دوباره شروع کنید.");
          });
      }
  }
  play({ data, mimeType }) {
    if (this.closed || !this.audio || this.audio.state === "closed") return;
    const samples = decodePCM(data),
      rate = Number(mimeType.match(/rate=(\d+)/)?.[1] || 24000);
    const buffer = this.audio.createBuffer(1, samples.length, rate);
    buffer.copyToChannel(samples, 0);
    const source = this.audio.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audio.destination);
    this.nextTime = Math.max(this.audio.currentTime + 0.02, this.nextTime);
    source.start(this.nextTime);
    this.nextTime += buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
    this.onState("speaking");
  }
  sendText(text) {
    if (this.session && !this.closed)
      this.session.sendClientContent({
        turns: [{ role: "user", parts: [{ text }] }],
        turnComplete: true,
      });
  }
  mute(value) {
    this.muted = value;
    this.media?.getAudioTracks().forEach((track) => {
      track.enabled = !value;
    });
    if (value && this.session && !this.closed)
      this.session.sendRealtimeInput({ audioStreamEnd: true });
    this.onLevel?.(0);
  }
  interrupt() {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {}
    }
    this.sources.clear();
    this.nextTime = this.audio?.currentTime || 0;
    clearTimeout(this.playbackEnd);
  }
  fail(message) {
    if (this.closed) return;
    this.stop();
    this.onError(message);
    this.onState("error");
  }
  stop() {
    this.closed = true;
    this.abort.abort();
    clearTimeout(this.connectTimeout);
    clearTimeout(this.expiry);
    clearTimeout(this.playbackEnd);
    this.interrupt();
    this.capture?.disconnect();
    this.source?.disconnect();
    this.media?.getTracks().forEach((track) => track.stop());
    this.session?.close();
    if (this.audio?.state !== "closed") this.audio?.close().catch(() => {});
    this.onLevel?.(0);
  }
}
