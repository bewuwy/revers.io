import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, updateDoc } from "@angular/fire/firestore"; 
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';


@Component({
  selector: 'app-join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.css']
})
export class JoinGameComponent implements OnInit {

  gamesList: string[] = [];

  constructor(private db: Firestore, private auth: Auth, private router: Router) { }

  // create a new game
  createGame() {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    const id = uuidv4();
    console.log("create game", id);

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, id);

    setDoc(gameDoc, {
      clicks: 0,
      players: [userId],
      completed: false,
      created: new Date(),
      winner: null
    }).then(() => {
      console.log("created game", id);
      this.router.navigate(["/play", id]);

    }).catch((error) => {
      console.log("error creating game", error);
    });
  }

  // join a game
  joinGame(gameId: string) {
    const userId = this.auth.currentUser?.uid;
    if (!userId) {
      return;
    }

    // add player to firestore    
    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, gameId);

    getDoc(gameDoc).then((doc) => {
      const data = doc.data()

      if (data && data["players"].indexOf(userId) === -1) {
        data["players"].push(userId);

        setDoc(gameDoc, data).then(() => {
          console.log("joined game", gameId);
        });
      }
      else {
        console.log("already joined game", gameId);
      }

      // navigate to play game
      this.router.navigate(["/play", gameId]);
    });

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
