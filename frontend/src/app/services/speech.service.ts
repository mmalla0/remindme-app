
import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class SpeechService {
  speak(text: string) {
    if ('speechSynthesis' in window) {
      console.log('🔊 Spreche:', text); // Für Debugzwecke
      speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'de-DE'; // Deutsch, passt für Anna
      msg.rate = 0.95;
      speechSynthesis.speak(msg);
    } else {
      console.warn('🔇 Web Speech API nicht verfügbar');
    }
  }
}
