import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule, NgForOf, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-reminder',
  standalone: true,
  imports: [CommonModule, FormsModule, NgForOf, NgIf, HttpClientModule],
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
  showSuccess = false;

  schedule = [
    { time: '08:30', task: '💊 Medication', done: true },
    { time: '10:00', task: '🥤 Drink', done: false },
    { time: '17:00', task: '📝 Walk', done: false }
  ];

  taskOptions = ['💊 Medication', '🥤 Drink', '📝 Daily Task'];

  newReminder = {
    task: '',
    custom: '',
    time: ''
  };

  clockTime = '';
  isEvening = false;

  constructor(
    private http: HttpClient,
    public speechService: SpeechService
  ) {}

  ngOnInit(): void {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.checkReminder();
    const now = new Date();
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(() => {
      this.checkReminder();
      this.minuteInterval = setInterval(() => this.checkReminder(), 60_000);
    }, msToNextMinute);
  }

  ngOnDestroy(): void {
    if (this.speakInterval) clearInterval(this.speakInterval);
    if (this.minuteInterval) clearInterval(this.minuteInterval);
  }

  updateClock() {
    const now = new Date();
    this.clockTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.isEvening = now.getHours() >= 18;
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
        console.error('Reminder error:', err);
      }
    });
  }

  startSpeaking() {
    if (this.speakInterval) clearInterval(this.speakInterval);
    if (document.visibilityState === 'visible' && !this.reminder?.done) {
      this.speechService.speak(`Anna, ${this.reminder.text}`);
    }
    this.spokenCount = 1;
    this.speakInterval = setInterval(() => {
      if (this.spokenCount < 3 && !this.reminder?.done) {
        if (document.visibilityState === 'visible') {
          this.speechService.speak(`Anna, ${this.reminder.text}`);
        }
        this.spokenCount++;
      } else {
        clearInterval(this.speakInterval);
      }
    }, 60_000);
  }

  markAsDone() {
    if (this.reminder) {
      this.reminder.done = true;
      this.showSuccess = true;
      setTimeout(() => this.showSuccess = false, 4000);
    }
    if (this.speakInterval) clearInterval(this.speakInterval);
  }

  saveReminder() {
    const finalTask = this.newReminder.custom.trim() || this.newReminder.task;
    if (finalTask && this.newReminder.time) {
      this.schedule.push({ task: finalTask, time: this.newReminder.time, done: false });
      this.newReminder = { task: '', custom: '', time: '' };
    }
  }

  get completedTasks() {
    return this.schedule.filter(t => t.done).length;
  }

  get totalTasks() {
    return this.schedule.length;
  }

  get progressPercent() {
    return Math.round((this.completedTasks / this.totalTasks) * 100);
  }
}
