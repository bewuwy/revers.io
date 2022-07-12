import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from "@angular/fire/firestore"; 
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup } from '@angular/forms';


@Component({
  selector: 'app-join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.css']
})
export class JoinGameComponent implements OnInit {

  gameForm = new FormGroup({
    gameOpen: new FormControl(true, {nonNullable: true}),
    gameName: new FormControl('', {nonNullable: false}),
  });

  joinGameForm = new FormGroup({
    gameId: new FormControl('', {nonNullable: true}),
  });

  gamesList: string[] = [];
  user: any;
  valid: {valid: boolean, reason: string} = {valid: true, reason: ""};

  constructor(private db: Firestore, private auth: Auth, private router: Router) { }

  onCreateGame() {
    console.log(this.gameForm.value);

    let open = this.gameForm.value.gameOpen;
    if (open === undefined) {
      open = true;
    }
    const name = this.gameForm.value.gameName || null;

    this.createGame(open, name);
  }

  // create a new game
  createGame(open: boolean, name: string | null) {
    const userId = this.user.uid;
    if (!userId) {
      console.log("you need to be logged in to create a game");
      return;
    }

    const gamesCollection = collection(this.db, 'game');
    let id: string = name || uuidv4();

    // check if custom game name is already in use
    let gameDoc = doc(gamesCollection, id);
    getDoc(gameDoc).then(docSnapshot => {
      if (docSnapshot.exists()) {
        console.log("game name already in use");
        id = uuidv4();
      }

      // create game
      gameDoc = doc(gamesCollection, id);

      setDoc(gameDoc, {
        players: [userId],
        playerNames: [this.user.displayName],
        moves: [],
        score: {white: 2, black: 2},
        completed: false,
        open: open,
        created: new Date(),
        winner: null
      }).then(() => {
        console.log("created game", id);
        this.router.navigate(["/play", id]);
  
      }).catch((error) => {
        console.log("error creating game", error);
      });
    });    
  }

  onJoinPrivateGame() {
    if (this.joinGameForm.value.gameId) {
      this.joinGame(this.joinGameForm.value.gameId);
    }
  }

  // join a game
  joinGame(gameId: string) {
    const userId = this.user.uid;
    if (!userId) {
      console.log("you need to be logged in to join a game");
      return;
    }

    // add player to firestore    
    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, gameId);

    getDoc(gameDoc).then((doc) => {
      const data = doc.data()

      if (data && data["players"].indexOf(userId) === -1) {
        data["players"].push(userId);
        data["playerNames"].push(this.user.displayName);
        data["open"] = data["players"].length < 2;

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

  onRefresh (event: any) {
    var btn = event.target || event.srcElement || event.currentTarget;

    btn.disabled = true;
    setTimeout(() => {
      btn.disabled = false;
    }, 15 * 1000);  // TODO: add a timer
    
    this.gamesList = [];
    this.getOpenGames();
  }

  getOpenGames() {
    // get open games
    const gamesCollection = collection(this.db, 'game');

    // query for open games
    const q = query(gamesCollection, where('completed', '==', false), where("open", "==", true), limit(3), orderBy('created'));
    getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // console.log(doc.id, " => ", doc.data());

        this.gamesList.push(doc.id);
      });
    });
  }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      this.user = user;

      if (!user) {
        this.valid.valid = false;
        this.valid.reason = "You need to be logged in to join a game";
      }
    });

    this.getOpenGames();
  }
}
