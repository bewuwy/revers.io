import { Component, OnInit } from '@angular/core';
import { Auth, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, doc, query, where, getDocs } from '@angular/fire/firestore';
import { Router } from '@angular/router';


@Component({
  selector: 'app-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {

  account : User | null = null;
  games: any[] = [];

  constructor(private auth: Auth, private db: Firestore, private router: Router) { }

  ngOnInit(): void { 
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.account = user;

        // get current user's games from firestore
        const gamesCollection = collection(this.db, 'game');
        const q = query(gamesCollection, where('players', 'array-contains', user.uid), where("completed", "==", false));

        getDocs(q).then(docs => {
          for (const doc of docs.docs) {
            this.games.push(doc.id);
          }
        }).catch(err => {
          console.log(err);
        });

      } else {
        this.account = null;
        this.router.navigate(['/login']);
      }
    });
  }
}
