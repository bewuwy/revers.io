import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-index',
  templateUrl: './index.component.html',
  styleUrls: ['./index.component.css']
})
export class IndexComponent implements OnInit {
  user = false;

  constructor(private auth: Auth) { }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.user = true;
      } else {
        this.user = false;
      }
    });
  }

}
