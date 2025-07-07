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

  // Neue Reminder-Daten
  selectedTask = '';
  selectedTime = '';
  customTaskText = '';
  customTaskDescription = '';
  showCustomTaskField = false;
  showDescriptionField = false;

  categories: any[] = [];
  dailySchedule: any[] = [];

  constructor(
    private http: HttpClient,
    public speechService: SpeechService
  ) {}

  ngOnInit(): void {
    this.checkReminder();
    this.setupWaterTracking();
    this.loadCategories();
    this.loadTodaysSchedule();

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

  loadTodaysSchedule() {
    this.http.get<any[]>('/api/reminders/today').subscribe({
      next: (data) => {
        // Merke: ID, icon, category_id, repeat_rule_id mitnehmen!
        this.dailySchedule = data.map(entry => ({
          id: entry.id,
          time: entry.time,
          task: entry.text,
          icon: entry.icon || '📋',
          date: entry.date,
          category_id: entry.category_id,
          repeat_rule_id: entry.repeat_rule_id,
        }));
      },
      error: (err) => {
        console.error('❌ Fehler beim Laden des Tagesplans:', err);
      }
    });
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

  onTaskChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedTask = value;
    this.showCustomTaskField = value === 'custom';
    this.showDescriptionField = value === 'custom' || value === 'Medication';
  }

  saveReminder() {
    const task =
      this.selectedTask === 'custom'
        ? this.customTaskDescription
        : this.selectedTask === 'Medication'
        ? `Medication: ${this.customTaskDescription}`
        : this.selectedTask;

    if (!task || !this.selectedTime) {
      alert('Bitte Aufgabe und Uhrzeit eingeben.');
      return;
    }

    const requestBody = {
      text: task,
      time: this.selectedTime,
      date: new Date().toISOString().split('T')[0],
      category_id: this.getCategoryIdForTask(this.selectedTask),
      repeat_rule_id: 1,
    };

    this.http.post('/api/reminders', requestBody).subscribe({
      next: (res) => {
        alert(`Erinnerung gespeichert: ${task} um ${this.selectedTime}`);

        this.selectedTask = '';
        this.selectedTime = '';
        this.customTaskText = '';
        this.customTaskDescription = '';
        this.showCustomTaskField = false;
        this.showDescriptionField = false;
        this.loadTodaysSchedule();
      },
      error: (err) => {
        console.error('❌ Fehler beim Speichern des Reminders:', err);
        alert('Fehler beim Speichern!');
      },
    });
  }

  getCategoryIdForTask(task: string): number | null {
    switch (task) {
      case 'Medication':
        return 2; // 💊 Medikamente
      case 'custom':
        return 3; // 📋 Tägliche Aufgaben
      default:
        return null;
    }
  }

  loadCategories() {
    this.http.get<any[]>('/api/categories').subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('❌ Fehler beim Laden der Kategorien:', err)
    });
  }

  confirmDone(task: string) {
    alert(`${task} erledigt!`);
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

    this.http.post<any>('/api/water', {
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

    this.http.put(`/api/water/${this.waterId}/add`, {}).subscribe({
      next: () => {
        this.drunkWater++;
      },
      error: (err) => {
        console.error('❌ Fehler beim Hinzufügen eines Glases:', err);
      }
    });
  }

  // === Bearbeiten (EDIT) ===
  editSchedule(index: number) {
    this.editIndex = index;
    this.editedEntry = { ...this.dailySchedule[index] };
  }

  saveSchedule(index: number) {
    const reminder = this.editedEntry;
    this.http.put(`/api/reminders/${reminder.id}`, {
      text: reminder.task,
      time: reminder.time,
      date: reminder.date,
      category_id: reminder.category_id,
      repeat_rule_id: reminder.repeat_rule_id,
    }).subscribe({
      next: (res) => {
        this.dailySchedule[index] = { ...this.editedEntry };
        this.cancelEdit();
      },
      error: (err) => {
        alert('Fehler beim Aktualisieren!');
        console.error('❌ Fehler beim Aktualisieren:', err);
      }
    });
  }

  cancelEdit() {
    this.editIndex = null;
    this.editedEntry = null;
  }

  // === Löschen ===
  deleteSchedule(index: number) {
    const reminder = this.dailySchedule[index];
    if (!confirm('Wirklich löschen?')) return;

    this.http.delete(`/api/reminders/${reminder.id}`).subscribe({
      next: () => {
        this.dailySchedule.splice(index, 1);
        if (this.editIndex === index) this.cancelEdit();
      },
      error: (err) => {
        alert('Fehler beim Löschen!');
        console.error('❌ Fehler beim Löschen:', err);
      }
    });
  }

  protected readonly HTMLSelectElement = HTMLSelectElement;
}
