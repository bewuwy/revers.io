import { Component, OnInit } from '@angular/core';
import { nanoid, customAlphabet } from 'nanoid';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit, DocumentData, updateDoc, arrayUnion } from "@angular/fire/firestore"; 
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { FormControl, FormGroup } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';


// TODO: add custom game rules

@Component({
  selector: 'app-join-game',
  templateUrl: './join-game.component.html',
  styleUrls: ['./join-game.component.css']
})
export class JoinGameComponent implements OnInit {
  GAME_ID_LENGTH: number = 8;
  nanoid: any = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', this.GAME_ID_LENGTH);

  gameForm = new FormGroup({
    gameOpen: new FormControl(true, {nonNullable: true}),
    gameName: new FormControl('', {nonNullable: false}),
    timerValue: new FormControl(3, {nonNullable: true}),
  });

  joinGameForm = new FormGroup({
    gameId: new FormControl('', {nonNullable: true}),
  });

  gamesList: DocumentData[] = [];
  refreshRoll: boolean = false;
  refreshAllow: boolean = true;

  openRules: boolean = false;
  // create game's rules
  rules = { boardSize: 8, loseNoMove: false, startingDisks: true };
  rulesPreset:string = 'othello';
  startColor:string = 'random';
  timerEnabled: boolean = true;
  playerColor:string = 'white';
  openGame: boolean = true;

  user: any;
  valid: {valid: boolean, reason: string} = {valid: true, reason: ""};

  constructor(private db: Firestore, private auth: Auth, 
              private router: Router, private toastr: ToastrService) { }

  changeRulesPreset(event: any) {
    const preset = event.target.value;
    this.rulesPreset = preset;
    
    switch (preset) {
      case 'othello':
        this.rules.boardSize = 8;
        this.rules.loseNoMove = false;
        this.rules.startingDisks = true;
        break;
      case 'reversi':
        this.rules.boardSize = 8;
        this.rules.loseNoMove = true;
        this.rules.startingDisks = false;
        break;
      case 'none':
        this.openRules = true;
        break;
    }
  }

  changeStartColor(event: any) {
    // console.log(event);

    const color = event.target.value;

    let colorIndex = 0;
    switch (color) {
      case 'white':
        colorIndex = 0;
        break;
      case 'black':
        colorIndex = 1;
        break;
      case 'random':
        colorIndex = Math.round(Math.random());
        break;
    }

    this.playerColor = ['white', 'black'][colorIndex];
  }

  onCreateGame() {
    // console.log(this.gameForm.value);

    let open = this.gameForm.value.gameOpen;
    if (open === undefined) {
      open = true;
    }
    const name = this.gameForm.value.gameName || null;

    // check if rules are valid
    if (this.rules.boardSize < 4 || this.rules.boardSize > 12) {
      this.toastr.error("Board size must be between 4 and 12", "Error creating game");
      return;
    }

    this.createGame(open, name, this.rules);
  }

  // create a new game
  createGame(open: boolean, name: string | null, rules: any = null) {
    const userId = this.user.uid;
    if (!userId) {
      console.log("you need to be logged in to create a game");
      return;
    }

    const gamesCollection = collection(this.db, 'games');
    let id: string = name || this.nanoid();

    // check if custom game name is already in use
    let gameDoc = doc(gamesCollection, id);
    getDoc(gameDoc).then(docSnapshot => {
      if (docSnapshot.exists()) {
        console.log("game name already in use");
        this.toastr.error("Game name already in use, picking a random one");
        id = this.nanoid();
      }

      // create game
      gameDoc = doc(gamesCollection, id);

      let timer = -2;
      if (this.gameForm.value.timerValue && this.timerEnabled) {
        timer = this.gameForm.value.timerValue * 60;
      }

      rules['time'] = timer;

      setDoc(gameDoc, {
        players: [{id: userId, name: this.user.displayName, color: this.playerColor}],
        moves: [],
        score: {white: 2, black: 2},
        status: {completed: false, open: open},
        winner: null,
        created: new Date(),
        rules: rules,
        timer: {white: timer, black: timer},
      }).then(() => {
        console.log("created game", id);

        // add game to user's active games
        const userCollection = collection(this.db, 'users');
        const userDoc = doc(userCollection, userId);
        updateDoc(userDoc, {activeGames: arrayUnion(id)});

        this.toastr.success("Game " + id + " created");
        this.router.navigate(["/play", id]);
  
      }).catch((error) => {
        console.log("error creating game", error);
        this.toastr.error("Error creating game! Try again.");
      });
    });    
  }

  onJoinPrivateGame() {
    this.joinGameForm.markAsTouched();

    if (this.joinGameForm.value.gameId) {
      this.joinGame(this.joinGameForm.value.gameId);
    }
  }

  // join a game // TODO: add matchmaking
  joinGame(gameId: string) {
    const userId = this.user.uid;
    if (!userId) {
      console.log("you need to be logged in to join a game");
      return;
    }

    // add player to firestore    
    const gamesCollection = collection(this.db, 'games');
    const gameDoc = doc(gamesCollection, gameId);

    getDoc(gameDoc).then((doc_) => {
      const data = doc_.data();

      if (data) {
        const playerIds = data['players'].map(function(p:any) {return p['id'];});

        if (playerIds.indexOf(userId) === -1) {
          let color = data['players'][0].color === "black" ? "white" : "black";

          data["players"].push({id: userId, name: this.user.displayName, color: color});
          data['status']["open"] = data["players"].length < 2;
  
          setDoc(gameDoc, data).then(() => {
            console.log("joined game", gameId);
            this.toastr.success("Joined game " + gameId);

            // add game to user's active games
            const userCollection = collection(this.db, 'users');
            const userDoc = doc(userCollection, userId);
            updateDoc(userDoc, {activeGames: arrayUnion(gameId)});
          });
        }
        else {
          console.log("already joined game", gameId);
        }
      }

      // navigate to play game
      this.router.navigate(["/play", gameId]);
    });

  }

  onRefresh () {
    if (!this.refreshAllow) {
      return;
    }

    this.refreshRoll = true;
    setTimeout(() => {
      this.refreshRoll = false;
    }, 1000);

    this.refreshAllow = false;
    setTimeout(() => {
      this.refreshAllow = true;
    }, 15 * 1000);  // TODO: add a timer
    
    this.getOpenGames();
  }

  getOpenGames(n:number = 3) {
    this.gamesList = [];

    // get open games
    const gamesCollection = collection(this.db, 'games');

    // query for open games
    const q = query(gamesCollection, where('status.completed', '==', false), where("status.open", "==", true), limit(n), orderBy('created'));
    getDocs(q).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        // console.log(doc.id, " => ", doc.data());
        let game = doc.data();
        game['id'] = doc.id;

        // check ruleset
        if (game['rules']['boardSize'] === 8 && game['rules']['loseNoMove'] === false && game['rules']['startingDisks'] === true) {
          game['type'] = 'Othello';
        }
        else if (game['rules']['boardSize'] === 8 && game['rules']['loseNoMove'] === true && game['rules']['startingDisks'] === false) {
          game['type'] = 'Reversi';
        }
        else {
          game['type'] = 'Custom';
        }

        this.gamesList.push(game);
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
