import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ReminderComponent } from './components/reminder/reminder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule, CommonModule, ReminderComponent], // <--- WICHTIG!
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'RemindMe Frontend';
  statusMessage = '';
  connectionOk = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ message: string }>('http://localhost:3000/api/message')
      .subscribe({
        next: (res) => {
          this.statusMessage = res.message;
          this.connectionOk = true;
        },
        error: () => {
          this.statusMessage = '❌ Keine Verbindung zum Backend';
          this.connectionOk = false;
        }
      });
  }
}
