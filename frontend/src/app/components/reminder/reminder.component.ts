import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { SpeechService } from '../../services/speech.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  editIndex: number | null = null;
  editedEntry: any = null;


  constructor(
    private http: HttpClient,
    public speechService: SpeechService
  ) {}

  ngOnInit(): void {
    this.checkReminder();
    this.setupWaterTracking();

    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    setTimeout(() => {
      this.checkReminder();
      this.minuteInterval = setInterval(() => {
        this.checkReminder();
      }, 60_000);
    }, msToNextMinute);
  }

  ngOnDestroy(): void {
    if (this.speakInterval) clearInterval(this.speakInterval);
    if (this.minuteInterval) clearInterval(this.minuteInterval);
  }

  checkReminder() {
    this.http.get<any>('/api/reminders/next').subscribe({
      next: (data) => {
        const newKey = `${data.text}-${data.time}`;
        if (newKey !== this.lastSpokenKey) {
          this.reminder = { ...data, done: false };
          this.lastSpokenKey = newKey;
          this.spokenCount = 0;
          this.startSpeaking();
        }
      },
      error: (err) => {
        console.error('❌ Fehler beim Abrufen des Reminders:', err);
      }
    });
  }

  startSpeaking() {
    if (this.speakInterval) clearInterval(this.speakInterval);

    if (document.visibilityState === 'visible' && !this.reminder?.done) {
      this.speechService.speak(`Erinnerung: ${this.reminder.text}`);
    }
    this.spokenCount = 1;

    this.speakInterval = setInterval(() => {
      if (this.spokenCount < 3 && !this.reminder?.done) {
        if (document.visibilityState === 'visible') {
          this.speechService.speak(`Erinnerung: ${this.reminder.text}`);
        }
        this.spokenCount++;
      } else {
        clearInterval(this.speakInterval);
      }
    }, 60_000);
  }

  markAsDone() {
    this.reminder.done = true;
    if (this.speakInterval) clearInterval(this.speakInterval);
  }

  userName = 'Anna';
  lastReminder = { time: '08:30', task: 'Took medication' };
  dailySchedule = [
    { time: '08:30', task: 'Medication', icon: '💊' },
    { time: '10:00', task: 'Walk', icon: '🚶' },
    { time: '17:30', task: 'Lunch', icon: '🍽️' }
  ];
  selectedTask = '';
  selectedTime = '08:30';
  customTaskText = '';
  showCustomTaskField = false;

  onTaskChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.showCustomTaskField = value === 'custom';
    this.selectedTask = value;
  }

  saveReminder() {
    const task = this.selectedTask === 'custom' ? this.customTaskText : this.selectedTask;

    if (!task || !this.selectedTime) {
      alert('Bitte Aufgabe und Uhrzeit eingeben.');
      return;
    }

    alert(`Erinnerung gespeichert: ${task} um ${this.selectedTime}`);
  }

  confirmDone(task: string) {
    alert(`${task} marked as done!`);
  }

  showSpeechModal = false;
  speechText = '';

  openSpeechModal(text: string) {
    this.speechText = text;
    this.showSpeechModal = true;
    if (document.visibilityState === 'visible') {
      this.speechService.speak(`Erinnerung: ${text}`);
    }
  }

  closeSpeechModal() {
    this.showSpeechModal = false;
  }

  // 💧 Wasser-Tracking
  waterGoal: number | null = null;
  drunkWater = 0;
  waterId: number | null = null;

  setupWaterTracking() {
    const today = new Date().toISOString().split('T')[0];
    this.http.get<any>(`/api/water/${today}`).subscribe({
      next: (data) => {
        this.waterId = data.id;
        this.waterGoal = data.target_amount;
        this.drunkWater = data.current_amount;
      },
      error: (err) => {
        if (err.status === 404) {
          // Kein Eintrag: manuelle Eingabe erlauben
          this.waterId = null;
          this.waterGoal = null;
          this.drunkWater = 0;
        } else {
          console.error('❌ Fehler beim Wasserabruf:', err);
        }
      }
    });
  }

  createTodayWater() {
    const today = new Date().toISOString().split('T')[0];

    if (!this.waterGoal || this.waterGoal < 1 || this.waterGoal > 20) {
      alert('Bitte gib ein Ziel zwischen 1 und 20 Gläsern ein.');
      return;
    }

    this.http.post<any>('http://localhost:3000/api/water', {
      date: today,
      target_amount: this.waterGoal
    }).subscribe({
      next: (data) => {
        this.waterId = data.id;
        this.drunkWater = 0;
      },
      error: (err) => {
        console.error('❌ Fehler beim Erstellen des Wasserziels:', err);
      }
    });
  }

  drinkWater() {
    if (!this.waterId || this.drunkWater >= (this.waterGoal || 0)) return;

    this.http.put(`http://localhost:3000/api/water/${this.waterId}/add`, {}).subscribe({
      next: () => {
        this.drunkWater++;
      },
      error: (err) => {
        console.error('❌ Fehler beim Hinzufügen eines Glases:', err);
      }
    });
  }
  // 🟩 Startet Bearbeitung für ausgewählten Eintrag
  editSchedule(index: number) {
    this.editIndex = index;
    this.editedEntry = { ...this.dailySchedule[index] };
  }

// 🟩 Speichert Änderungen
  saveSchedule(index: number) {
    this.dailySchedule[index] = { ...this.editedEntry };
    this.cancelEdit();
  }

// 🟩 Abbricht Bearbeiten
  cancelEdit() {
    this.editIndex = null;
    this.editedEntry = null;
  }

// 🟩 Löscht einen Eintrag
  deleteSchedule(index: number) {
    this.dailySchedule.splice(index, 1);
    if (this.editIndex === index) this.cancelEdit();
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}
