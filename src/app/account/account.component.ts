import { Component, OnInit, ViewChild } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, doc, query, where, getDocs, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

import { NgxChartsModule } from '@swimlane/ngx-charts';

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
  // games: any[] = [];

  constructor(private auth: Auth, private db: Firestore, private router: Router) { }

  ngOnInit(): void { 
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.account = user;

        // // get current user's games from firestore
        // const gamesCollection = collection(this.db, 'games');
        // const q = query(gamesCollection, where('players', 'array-contains', user.uid), where("completed", "==", false));

        // getDocs(q).then(docs => {
        //   for (const doc of docs.docs) {
        //     this.games.push(doc.id);
        //   }
        // }).catch(err => {
        //   console.log(err);
        // });

        // get current user's statistics from firestore
        const userDoc = doc(this.db, 'users/' + user.uid);
        getDoc(userDoc).then(doc => {
          let data = doc.data();

          if (data) {
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
        });

      } else {
        this.account = null;
        this.router.navigate(['/login']);
      }
    });
  }
}
