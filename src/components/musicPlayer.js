import { reactive } from "vue";
export const MUSIC_TRACKS = [
  {
    title: "Tunggu aku di Jakarta",
    artist: "Sheila on 7",
    src: "/frontend/assets/audio/jakarta.mp3",
  },
  {
    title: "A Sorrowful Reunion",
    artist: "Reality Club",
    src: "/frontend/assets/audio/eyes.mp3",
  },
  {
    title: "The Night We Met",
    artist: "Lord Huron",
    src: "/frontend/assets/audio/want.mp3",
  },
  {
    title: "multo",
    artist: "cup of joe",
    src: "/frontend/assets/audio/multo.mp3",
  },
  {
    title: "Love Songs",
    artist: "Kaash Paige",
    src: "/frontend/assets/audio/ls.mp3",
  },
];

export const musicState = reactive({
  isPlaying: false,
  currentIndex: -1,
  currentTrack: null,
});

let audioEl = null;
let endedListeners = [];

// ponytail: pub-sub sederhana, ganti event bus kalau listener makin banyak
export function onTrackEnded(cb) {
  endedListeners.push(cb);
  return () => {
    endedListeners = endedListeners.filter((f) => f !== cb);
  };
}

function handleEnded() {
  musicState.isPlaying = false;
  const finished = musicState.currentTrack;
  endedListeners.forEach((cb) => {
    try {
      cb(finished);
    } catch {
      /* abaikan */
    }
  });
}

function getAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.addEventListener("ended", handleEnded);
    audioEl.addEventListener("pause", () => {
      // keep UI in sync if paused from outside our own controls (e.g. OS media keys)
      if (!audioEl.ended) musicState.isPlaying = false;
    });
    audioEl.addEventListener("play", () => {
      musicState.isPlaying = true;
    });
  }
  return audioEl;
}

export function hasTracks() {
  return MUSIC_TRACKS.length > 0;
}

export function playTrack(index = 0) {
  if (!hasTracks()) return false;
  const total = MUSIC_TRACKS.length;
  const i = ((index % total) + total) % total;
  const track = MUSIC_TRACKS[i];
  const audio = getAudio();
  musicState.currentIndex = i;
  musicState.currentTrack = track;
  audio.src = track.src;
  audio.play().catch(() => {
    musicState.isPlaying = false;
  });
  return true;
}

export function playNext() {
  if (!hasTracks()) return;
  playTrack(musicState.currentIndex + 1);
}

export function playPrev() {
  if (!hasTracks()) return;
  playTrack(musicState.currentIndex - 1);
}

export function pauseMusic() {
  if (audioEl) audioEl.pause();
  musicState.isPlaying = false;
}

export function stopMusic() {
  if (audioEl) {
    audioEl.pause();
    audioEl.currentTime = 0;
  }
  musicState.isPlaying = false;
  musicState.currentTrack = null;
  musicState.currentIndex = -1;
}

/**
 * Toggle play/pause. Kalau belum ada track yang dipilih, mulai dari track pertama.
 * Return: 'no-tracks' | 'playing' | 'paused'
 */
export function toggleMusic() {
  if (!hasTracks()) return "no-tracks";
  const audio = getAudio();
  if (!musicState.currentTrack) {
    playTrack(0);
    return "playing";
  }
  if (musicState.isPlaying) {
    audio.pause();
    return "paused";
  }
  audio.play().catch(() => {
    musicState.isPlaying = false;
  });
  return "playing";
}
