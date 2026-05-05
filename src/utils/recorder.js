// MediaRecorder wrapper with auto-stop on silence (voice-activity detection).
// Designed for short single-utterance capture in an emergency context — the
// user holds or taps once, speaks, and the recorder auto-ends so the result
// goes straight to transcription without a second tap.

const SILENCE_THRESHOLD = 0.012;     // RMS volume below = treated as silence
const SILENCE_DURATION_MS = 1400;    // Stop after this much continuous silence
const MIN_SPEECH_DURATION_MS = 600;  // Require at least this much voiced audio
const MAX_DURATION_MS = 15000;       // Hard cap so we never record forever
const TICK_MS = 80;

export class VoiceRecorder {
  constructor({ onLevel, onAutoStop, autoStop = true } = {}) {
    this.onLevel = onLevel;        // (rms 0..1) — for UI level meter
    this.onAutoStop = onAutoStop;  // fired when VAD or hard-cap triggers stop
    this.autoStop = autoStop;
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
    this.audioCtx = null;
    this.analyser = null;
    this.tickTimer = null;
    this.startedAt = 0;
    this.lastVoicedAt = 0;
    this.everVoiced = false;
    this.stopped = false;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // Pick a MIME type the current browser supports.
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/mp4",
    ];
    const mimeType = candidates.find(
      (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)
    );

    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.recorder.addEventListener("dataavailable", (e) => {
      if (e.data && e.data.size > 0) this.chunks.push(e.data);
    });

    // Web Audio for VAD level metering.
    if (this.autoStop || this.onLevel) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) {
        this.audioCtx = new Ctx();
        const source = this.audioCtx.createMediaStreamSource(this.stream);
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 1024;
        source.connect(this.analyser);
      }
    }

    this.recorder.start();
    this.startedAt = Date.now();
    this.lastVoicedAt = this.startedAt;
    this.everVoiced = false;
    this.stopped = false;

    if (this.analyser) this.tickTimer = setInterval(() => this._tick(), TICK_MS);
  }

  _tick() {
    if (this.stopped || !this.analyser) return;
    const buf = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(buf);
    // RMS over the buffer (centred on 128).
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / buf.length);
    if (this.onLevel) this.onLevel(Math.min(1, rms * 4));

    const now = Date.now();
    if (rms > SILENCE_THRESHOLD) {
      this.lastVoicedAt = now;
      this.everVoiced = true;
    }

    const elapsed = now - this.startedAt;
    if (elapsed >= MAX_DURATION_MS) {
      this._autoStop("max-duration");
      return;
    }
    if (
      this.autoStop &&
      this.everVoiced &&
      elapsed >= MIN_SPEECH_DURATION_MS &&
      now - this.lastVoicedAt >= SILENCE_DURATION_MS
    ) {
      this._autoStop("silence");
    }
  }

  _autoStop(reason) {
    if (this.stopped) return;
    this.stopped = true;
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    if (this.onAutoStop) this.onAutoStop(reason);
    // The actual stop is done by caller via .stop() so it owns the Promise.
  }

  // Resolves with the recorded Blob.
  stop() {
    return new Promise((resolve) => {
      if (!this.recorder) return resolve(null);
      const finalize = () => {
        if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
        if (this.audioCtx) {
          try { this.audioCtx.close(); } catch {}
          this.audioCtx = null;
        }
        if (this.stream) {
          this.stream.getTracks().forEach((t) => t.stop());
          this.stream = null;
        }
        const blob = new Blob(this.chunks, { type: this.recorder.mimeType || "audio/webm" });
        resolve(blob);
      };
      if (this.recorder.state === "inactive") {
        finalize();
      } else {
        this.recorder.addEventListener("stop", finalize, { once: true });
        try { this.recorder.stop(); } catch { finalize(); }
      }
    });
  }
}

// Convenience: record one utterance and return a Blob, with auto-stop on silence.
// Caller can also call `controller.stop()` to end early.
export const recordUtterance = ({ onLevel } = {}) => {
  let resolveRef;
  const finished = new Promise((r) => (resolveRef = r));
  const rec = new VoiceRecorder({
    onLevel,
    onAutoStop: async () => {
      const blob = await rec.stop();
      resolveRef(blob);
    },
  });
  return {
    started: rec.start().then(() => rec),
    finished,
    stopEarly: async () => {
      const blob = await rec.stop();
      resolveRef(blob);
    },
  };
};
