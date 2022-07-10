import { Component } from '@angular/core';
import { onAuthStateChanged, Auth, User } from '@angular/fire/auth';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'revers_io_angular';
  user: User | null = null;

  constructor(private auth: Auth) {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.user = user;
        
      } else {
        // User is signed out
        // ...
        this.user = null;
      }
    });
  }

}
