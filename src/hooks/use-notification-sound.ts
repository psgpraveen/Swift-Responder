"use client";

import { useCallback, useRef } from "react";

export type NotificationType = "dispatch" | "arrived" | "alert" | "success";

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize Web Audio API
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play notification sound using Web Audio API
  const playSound = useCallback(
    (type: NotificationType) => {
      try {
        const audioContext = getAudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Configure sound based on notification type
        switch (type) {
          case "dispatch":
            // Urgent siren-like sound
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(
              400,
              audioContext.currentTime + 0.1
            );
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.3
            );
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;

          case "arrived":
            // Success chime
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(
              659.25,
              audioContext.currentTime + 0.1
            ); // E5
            oscillator.frequency.setValueAtTime(
              783.99,
              audioContext.currentTime + 0.2
            ); // G5
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.4
            );
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;

          case "alert":
            // Warning beep
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.2
            );
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;

          case "success":
            // Gentle success tone
            oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(
              554.37,
              audioContext.currentTime + 0.15
            );
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.currentTime + 0.3
            );
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
        }
      } catch (error) {
        console.warn("Failed to play notification sound:", error);
      }
    },
    [getAudioContext]
  );

  // Vibrate device if supported
  const vibrate = useCallback((pattern: number | number[]) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  // Combined notification (sound + vibration)
  const notify = useCallback(
    (type: NotificationType) => {
      playSound(type);

      // Vibration patterns
      switch (type) {
        case "dispatch":
          vibrate([200, 100, 200]);
          break;
        case "arrived":
          vibrate([100, 50, 100, 50, 100]);
          break;
        case "alert":
          vibrate([300]);
          break;
        case "success":
          vibrate([100]);
          break;
      }
    },
    [playSound, vibrate]
  );

  return { playSound, vibrate, notify };
}
