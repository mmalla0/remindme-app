

import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule],
  providers: [SpeechService],
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.css']
})
export class ReminderComponent implements OnInit, OnDestroy {
  reminder: any = null;
  lastSpokenKey = '';
  spokenCount = 0;
  speakInterval: any = null;
  minuteInterval: any = null;

  constructor(
    private http: HttpClient,
    public speechService: SpeechService // für evtl. Test-Button im Template
  ) {}

  ngOnInit(): void {
    this.checkReminder(); // Sofort einmalig beim Start

    // Synchronisierung auf die nächste volle Minute
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      this.checkReminder();
      this.minuteInterval = setInterval(() => {
        this.checkReminder();
      }, 60_000); // ab jetzt immer jede volle Minute
    }, msToNextMinute);
  }

  ngOnDestroy(): void {
    // Immer aufräumen!
    if (this.speakInterval) clearInterval(this.speakInterval);
    if (this.minuteInterval) clearInterval(this.minuteInterval);
  }

  checkReminder() {
    this.http.get<any>('/api/reminders/next').subscribe({
      next: (data) => {
        const newKey = `${data.text}-${data.time}`;
        console.log('📥 Reminder vom Server:', data);
        // Nur bei NEUEM Reminder reagieren:
        if (newKey !== this.lastSpokenKey) {
          this.reminder = { ...data, done: false };
          this.lastSpokenKey = newKey;
          this.spokenCount = 0;
          this.startSpeaking();
        }
        // Sonst Reminder einfach anzeigen lassen
      },
      error: (err) => {
        console.error('❌ Fehler beim Abrufen des Reminders:', err);
        // Reminder bleibt ggf. stehen (optional kannst du nach X Minuten ausblenden)
      }
    });
  }

  startSpeaking() {
    // Vorherige Wiederholungen abbrechen
    if (this.speakInterval) clearInterval(this.speakInterval);

    // Sofortiges Vorlesen, nur wenn Tab sichtbar und nicht erledigt
    if (document.visibilityState === 'visible' && !this.reminder.done) {
      this.speechService.speak(`Erinnerung: ${this.reminder.text}`);
    }
    this.spokenCount = 1;

    // Bis zu 2 weitere Wiederholungen (insgesamt 3) im Abstand von 1 Minute
    this.speakInterval = setInterval(() => {
      if (this.spokenCount < 3 && !this.reminder.done) {
        if (document.visibilityState === 'visible') {
          this.speechService.speak(`Erinnerung: ${this.reminder.text}`);
        }
        this.spokenCount++;
      } else {
        clearInterval(this.speakInterval); // Nach 3x stoppen oder wenn erledigt
      }
    }, 60_000);
  }

  // Kannst du an deinen "Erledigt"-Button binden:
  markAsDone() {
    this.reminder.done = true;
    if (this.speakInterval) clearInterval(this.speakInterval);
    // Optional: Backend call zum Speichern, dass erledigt wurde
  }
}
