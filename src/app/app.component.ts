import { Component } from '@angular/core';
import { onAuthStateChanged, Auth, User, signOut } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent {
  title = 'revers_io_angular';
  user: User | null = null;

  constructor(private auth: Auth, private router: Router) {
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

  onLoginClick() {
    if (!this.user) {
      this.router.navigate(['/login']);
    }
    else {
      // logout user
      signOut(this.auth);
      return;
    }
  }

}
