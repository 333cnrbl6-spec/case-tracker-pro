// Subtle audio cues for legal professionals (non-intrusive, professional soundscape)
const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || window.webkitAudioContext)() : null;

const playTone = (frequency, duration, volume = 0.1) => {
  if (!audioContext || audioContext.state === 'suspended') return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'sine';

  gain.gain.setValueAtTime(volume, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
};

export const audioNotifications = {
  // Success: ascending two-tone chime (professional, affirming)
  success: () => {
    playTone(523.25, 0.15, 0.08); // C5
    setTimeout(() => playTone(659.25, 0.15, 0.08), 100); // E5
  },

  // Alert: single mid-tone ping (noticeable but not alarming)
  alert: () => {
    playTone(440, 0.2, 0.06); // A4
  },

  // Critical: lower tone with emphasis (urgent but professional)
  critical: () => {
    playTone(349.23, 0.1, 0.1); // F4
    setTimeout(() => playTone(349.23, 0.1, 0.1), 120);
  },

  // Soft click for interactions (optional, can be disabled)
  click: () => {
    playTone(800, 0.05, 0.03);
  },

  // Completion sound for long tasks
  complete: () => {
    playTone(523.25, 0.1, 0.06); // C5
    setTimeout(() => playTone(659.25, 0.1, 0.06), 80); // E5
    setTimeout(() => playTone(783.99, 0.15, 0.08), 160); // G5
  },
};

export const enableAudioNotifications = (enabled = true) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('audioNotificationsEnabled', enabled);
  }
};

export const isAudioEnabled = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('audioNotificationsEnabled') !== 'false';
  }
  return true;
};