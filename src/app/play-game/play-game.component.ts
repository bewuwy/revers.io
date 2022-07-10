import { Component, OnInit } from '@angular/core';
import { Firestore, collection, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute } from '@angular/router';

import { Game } from '../game';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css']
})
export class PlayGameComponent implements OnInit {
  gameId: string = "";
  data: any;

  constructor(private db: Firestore, private route: ActivatedRoute) {  }

  click() {
    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    this.data.clicks += 1;
    setDoc(gameDoc, this.data);
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get("id") || "";

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    onSnapshot(gameDoc, (doc) => {
      this.data = doc.data();
      this.data.created = new Date(this.data.created.seconds * 1000);

      console.log("data: ", doc.data());
    });
  }

}
