import { Component, OnInit } from '@angular/core';
import { Auth, User, onAuthStateChanged, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

// TODO: game statistics

@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  account : User | null = null;
  user: any = {};
  chart: any = {
    colorScheme: {
      domain: ['#53DD6C', '#EE7674', '#627C85']
    }
  };

  activeGames: any[] = [];

  constructor(private auth: Auth, private db: Firestore, private router: Router, private toastr: ToastrService ) { }

  onVerifyEmailSend() {
    if (!this.auth.currentUser) { return }

    sendEmailVerification(this.auth.currentUser).then(() => {
      this.toastr.success('Check your email inbox', 'Email verification sent', {timeOut: 5000});
    });
  }

  ngOnInit(): void { 
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.account = user;

        const userDoc = doc(this.db, 'users/' + user.uid);
        getDoc(userDoc).then(doc => {
          let data = doc.data();

          if (data) {
            // get current user's statistics from firestore

            if (data["gamesNumber"]) {
              this.user.gamesNumber = data["gamesNumber"];
              this.user.wins = data["wins"];
              this.user.losses = data["losses"];
              this.user.ties = data["ties"];
            
              // chart
              this.chart.values = [
                {
                  name: 'Wins',
                  value: this.user.wins
                },
                {
                  name: 'Losses',
                  value: this.user.losses
                },
                {
                  name: 'Ties',
                  value: this.user.ties
                }
              ];

              this.chart.render = true;
            }

            // get current user's active games from firestore
            this.activeGames = data["activeGames"];
          }
        });

      } else {
        this.account = null;
        this.router.navigate(['/login']);
      }
    });
  }
}
