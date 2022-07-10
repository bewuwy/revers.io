import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

// import { Game } from '../game';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css']
})
export class PlayGameComponent implements OnInit {
  gameId: string = "";
  data: any;
  won: boolean | null = null;

  constructor(private db: Firestore, private auth: Auth, private route: ActivatedRoute) {  }

  click() {
    if (this.data.completed) {
      return;
    }

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    this.data.clicks += 1;

    // finish game if more than 5 clicks
    if (this.data.clicks > 5) {
      this.data.completed = true;
      this.data.winner = this.auth.currentUser?.uid;
    }

    setDoc(gameDoc, this.data);
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get("id") || "";

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    onSnapshot(gameDoc, (doc) => {
      this.data = doc.data();
      this.data.created = new Date(this.data.created.seconds * 1000);

      // check if current user won
      this.won = this.data.winner === this.auth.currentUser?.uid;

      console.log("data: ", doc.data());
    });
  }

}
