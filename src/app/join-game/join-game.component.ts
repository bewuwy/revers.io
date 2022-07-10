import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, collection, doc, setDoc, getDocs, query, where, orderBy, limit } from "@angular/fire/firestore"; 
import { Router } from '@angular/router';


@Component({
  selector: 'app-join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.css']
})
export class JoinGameComponent implements OnInit {

  gamesList: string[] = [];

  constructor(private db: Firestore, private router: Router) { }

  // create a new game
  createGame() {
    const id = uuidv4();
    console.log("create game", id);

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, id);

    setDoc(gameDoc, {
      clicks: 0,
      players: [],
      completed: false,
      created: new Date()
    }).then(() => {
      console.log("created game", id);
      this.router.navigate(["/play", id]);

    }).catch((error) => {
      console.log("error creating game", error);
    });
  }

  // join a game
  joinGame(gameId: string) {
    console.log("join game", gameId);
    this.router.navigate(["/play", gameId]);
  }

  ngOnInit(): void {
    // get open games
    const gamesCollection = collection(this.db, 'game');
    const q = query(gamesCollection, where('completed', '==', false), orderBy('created'), limit(3));

    const querySnapshot = getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // console.log(doc.id, " => ", doc.data());

        this.gamesList.push(doc.id);
      });
    });
  }
}
