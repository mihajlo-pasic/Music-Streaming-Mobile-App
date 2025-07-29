// src/utils/AudioManager.ts
import { Audio } from "expo-av";

let currentSound: Audio.Sound | null = null;

export async function playUrl(url: string) {
  // 1) unload existing
  if (currentSound) {
    try {
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }
  // 2) create & play new
  const { sound } = await Audio.Sound.createAsync(
    { uri: url },
    { shouldPlay: true }
  );
  currentSound = sound;
  return sound;
}

export async function stop() {
  if (currentSound) {
    try {
      await currentSound.stopAsync();
      await currentSound.unloadAsync();
    } catch {}
    currentSound = null;
  }
}
