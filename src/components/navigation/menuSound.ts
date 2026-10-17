// The mobile menu's sound: a short rustle of paper made with the Web Audio API (no file to
// download), noise through a band-pass that sweeps up as the menu unfolds and down as it folds,
// ending on a soft tick. Called only from a tap or a key, never on its own; the caller skips it
// under reduced motion. Anything the browser refuses (no Web Audio, a context it won't start)
// is swallowed, so the menu just stays quiet.
let context: AudioContext | null = null;

export function playMenuSound(kind: "open" | "close") {
  try {
    const AudioContextClass =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    context ??= new AudioContextClass();
    const audio = context;
    if (audio.state === "suspended") audio.resume().catch(() => {});

    const now = audio.currentTime;
    const length = kind === "open" ? 0.16 : 0.12;
    const [from, to] = kind === "open" ? [900, 3200] : [2800, 800];

    // The rustle
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * length), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = audio.createBufferSource();
    noise.buffer = buffer;
    const filter = audio.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(to, now + length);
    const rustle = audio.createGain();
    rustle.gain.setValueAtTime(0.0001, now);
    rustle.gain.linearRampToValueAtTime(0.07, now + 0.012);
    rustle.gain.exponentialRampToValueAtTime(0.0001, now + length);
    noise.connect(filter).connect(rustle).connect(audio.destination);
    noise.start(now);
    noise.stop(now + length);

    // The tick as the paper settles
    const tickAt = now + length * 0.75;
    const tone = audio.createOscillator();
    tone.type = "sine";
    tone.frequency.setValueAtTime(kind === "open" ? 1320 : 880, tickAt);
    const tick = audio.createGain();
    tick.gain.setValueAtTime(0.0001, tickAt);
    tick.gain.linearRampToValueAtTime(0.035, tickAt + 0.004);
    tick.gain.exponentialRampToValueAtTime(0.0001, tickAt + 0.05);
    tone.connect(tick).connect(audio.destination);
    tone.start(tickAt);
    tone.stop(tickAt + 0.06);
  } catch {
    // No sound, no fuss
  }
}
