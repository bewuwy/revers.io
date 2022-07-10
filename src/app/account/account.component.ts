import { Component, OnInit } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  account : User | null = null;

  constructor(private auth: Auth) { }

  ngOnInit(): void { 
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.account = user;
      } else {
        this.account = null;
      }
    });
  }

}
