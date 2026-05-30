// src/lib/audio.ts

// Helper để tái sử dụng AudioContext
const getAudioContext = () => {
  const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  return new AudioContextClass();
};

// Hàm phát âm thanh ăn mừng bằng Web Audio API
export const playSuccessSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startTime: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + 0.5);
    };

    // Chơi một hợp âm trưởng rải (Arpeggio) vui tai
    playNote(523.25, 0);    // C5
    playNote(659.25, 0.1);  // E5
    playNote(783.99, 0.2);  // G5
    playNote(1046.50, 0.3); // C6
  } catch (e) {
    console.warn("Audio không thể phát:", e);
  }
};

// Hàm phát âm thanh giọt nước
export const playWaterDropSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch (e) {
    console.warn("Audio không thể phát:", e);
  }
};

// =========================================================================
// CÁC HIỆU ỨNG TỔNG HỢP MỚI CHO GAMIFICATION (QUEST, LEVEL UP, HOVER)
// =========================================================================

// Hiệu ứng "Póp" siêu nhẹ khi lướt chuột qua (Hover)
export const playHoverSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05); // Tụtt pitch siêu nhanh
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.01); // Volume rất nhỏ (0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {
    console.warn('Audio hover error:', e);
  }
};

// Hiệu ứng "Ting Ting" sáng và đã tai khi nhận thưởng (Claim)
export const playClaimSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    const playNote = (freq: number, startDelay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle'; // Sóng tam giác cho âm thanh giống chuông (bell)
      
      const startTime = ctx.currentTime + startDelay;
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    };

    playNote(880, 0);        // A5
    playNote(1108.73, 0.1);  // C#6
    playNote(1318.51, 0.2);  // E6 (Tạo thành hợp âm A Major sáng chói)
  } catch(e) {
    console.warn('Audio claim error:', e);
  }
};

// Hiệu ứng "Siêu năng lượng" (Power-up) khi nhận thưởng Hyper (Critical Hit)
export const playHyperSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.6);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch(e) {
    console.warn('Audio hyper error:', e);
  }
};

// Hiệu ứng Cyberpunk cho chuỗi ngày (Streak milestone)
export const playStreakSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number, type: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + start);
      
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.3, now + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration);
    };

    // 1. Âm thanh sạc năng lượng nhanh (sweeping note)
    const oscSweep = ctx.createOscillator();
    const gainSweep = ctx.createGain();
    oscSweep.type = 'sawtooth';
    oscSweep.frequency.setValueAtTime(220, now);
    oscSweep.frequency.exponentialRampToValueAtTime(880, now + 0.25);
    gainSweep.gain.setValueAtTime(0, now);
    gainSweep.gain.linearRampToValueAtTime(0.15, now + 0.1);
    gainSweep.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    oscSweep.connect(gainSweep);
    gainSweep.connect(ctx.destination);
    oscSweep.start(now);
    oscSweep.stop(now + 0.25);

    // 2. Chơi hợp âm chói tai Cyberpunk (Sci-Fi chord)
    playTone(523.25, 0.25, 0.6, 'sine');     // C5
    playTone(659.25, 0.35, 0.6, 'triangle'); // E5
    playTone(880.00, 0.45, 0.7, 'triangle'); // A5
    playTone(1318.51, 0.55, 0.8, 'sine');    // E6
  } catch (e) {
    console.warn('Audio streak error:', e);
  }
};

// =========================================================================
// CÁC HIỆU ỨNG ÂM THANH THÔNG BÁO MỚI CHO SHOP
// =========================================================================

// Pop nhẹ — tiếng "pốp" tối giản
export const playPopSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) { console.warn('Audio pop error:', e); }
};

// Click điện tử — tiếng click ngắn gọn
export const playClickSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const now = ctx.currentTime;
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.03);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) { console.warn('Audio click error:', e); }
};

// Chuông gió — chime nhẹ với hài âm
export const playChimeSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [880, 1100, 1320];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);
      gain.gain.setValueAtTime(0, now + i * 0.05);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.9);
    });
  } catch (e) { console.warn('Audio chime error:', e); }
};

// Chuông nhà thờ — chuông ngân trầm
export const playBellSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [220, 330, 440];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.4 / (i + 1), now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5 + i * 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2);
    });
  } catch (e) { console.warn('Audio bell error:', e); }
};

// Đàn mộc cầm — 4 nốt vui tươi tăng dần
export const playXylophoneSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.12);
      gain.gain.setValueAtTime(0, now + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } catch (e) { console.warn('Audio xylophone error:', e); }
};

// Cyberpunk — âm thanh 8-bit điện tử
export const playCyberSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.1);
    osc.frequency.setValueAtTime(660, now + 0.2);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.5);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.65);
  } catch (e) { console.warn('Audio cyber error:', e); }
};

// Thiên nhiên — tiếng chim hót + suối chảy mô phỏng
export const playNatureSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Tiếng chim — 3 chớp nhanh cao độ
    [1600, 1800, 1400].forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.15);
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.2);
    });
    // Tiếng suối — nhiễu trắng giảm dần
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.12, now + 0.3);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    noise.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now + 0.3);
  } catch (e) { console.warn('Audio nature error:', e); }
};

// Thiền định — âm trầm bowl thiền
export const playZenSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.6);
    // Hài âm nhẹ tạo cảm giác "run"
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(182, now);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 1.6);
  } catch (e) { console.warn('Audio zen error:', e); }
};

// Pha lê — tiếng kính/kim loại cao, trong veo
export const playCrystalSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [1200, 1800, 2400];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3 / (i + 1), now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2 + i * 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    });
  } catch (e) { console.warn('Audio crystal error:', e); }
};

// Khải hoàn — fanfare hoành tráng
export const playEpicSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now + i * 0.15);
      gain.gain.setValueAtTime(0, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.15 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.7);
    });
  } catch (e) { console.warn('Audio epic error:', e); }
};

// Huyền bí — âm ma thuật bay bổng
export const playMysticalSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(220, now + 1.2);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 1.6);
    // Tiếng vang hài âm
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(660, now + 0.3);
    osc2.frequency.exponentialRampToValueAtTime(330, now + 1.0);
    gain2.gain.setValueAtTime(0, now + 0.3);
    gain2.gain.linearRampToValueAtTime(0.2, now + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.3);
    osc2.stop(now + 1.3);
  } catch (e) { console.warn('Audio mystical error:', e); }
};

// Bong bóng — 3 bong bóng nhanh lên cao
export const playBubbleSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.15, 0.3].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now + delay);
      osc.frequency.exponentialRampToValueAtTime(300, now + delay + 0.12);
      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(0.35, now + delay + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  } catch (e) { console.warn('Audio bubble error:', e); }
};

// Tada — arpeggio vui nhộn (mở rộng từ success)
export const playTadaSound = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.35, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.5);
    });
  } catch (e) { console.warn('Audio tada error:', e); }
};

// =========================================================================
// HỆ THỐNG PHÁT ÂM THANH THÔNG BÁO THEO TÊN ĐÃ TRANG BỊ
// =========================================================================

export const playNotificationSound = (soundName: string | null | undefined) => {
  const name = (soundName || '').replace(/\.wav$/, '').trim();
  switch (name) {
    case 'water_drop': playWaterDropSound(); break;
    case 'bubble': playBubbleSound(); break;
    case 'pop': playPopSound(); break;
    case 'click': playClickSound(); break;
    case 'tada': playTadaSound(); break;
    case 'chime': playChimeSound(); break;
    case 'bell': playBellSound(); break;
    case 'xylophone': playXylophoneSound(); break;
    case 'cyber': playCyberSound(); break;
    case 'nature': playNatureSound(); break;
    case 'zen': playZenSound(); break;
    case 'crystal': playCrystalSound(); break;
    case 'epic': playEpicSound(); break;
    case 'mystical': playMysticalSound(); break;
    default: playTadaSound(); break;
  }
};

// Cổng điều hướng đa năng (Dành cho QuestCard và các module khác gọi)
export const playSound = (name: string) => {
  switch(name) {
    case 'success': case 'levelup': playSuccessSound(); break;
    case 'drop': case 'click': playWaterDropSound(); break;
    case 'hover': playHoverSound(); break;
    case 'claim': playClaimSound(); break;
    case 'hyper': playHyperSound(); break;
    case 'streak': playStreakSound(); break;
  }
};