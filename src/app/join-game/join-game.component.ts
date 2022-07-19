import { Component, OnInit } from '@angular/core';
import { nanoid, customAlphabet } from 'nanoid';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } from "@angular/fire/firestore"; 
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
  });

  joinGameForm = new FormGroup({
    gameId: new FormControl('', {nonNullable: true}),
  });

  gamesList: string[] = [];
  refreshRoll: boolean = false;
  refreshAllow: boolean = true;

  openRules: boolean = false;
  // create game's rules
  rules = { boardSize: 8, loseNoMove: false, startingDisks: true };
  rulesPreset:string = 'othello';
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

  onCreateGame() {
    console.log(this.gameForm.value);

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

  // create a new game // TODO: add custom rules
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

      setDoc(gameDoc, {
        players: [{id: userId, name: this.user.displayName}],
        moves: [],
        score: {white: 2, black: 2},
        status: {completed: false, open: open},
        winner: null,
        created: new Date(),
        rules: rules
      }).then(() => {
        console.log("created game", id);
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

    getDoc(gameDoc).then((doc) => {
      const data = doc.data();

      if (data) {
        const playerIds = data['players'].map(function(p:any) {return p['id'];});

        if (playerIds.indexOf(userId) === -1) {
          data["players"].push({id: userId, name: this.user.displayName});
          data['status']["open"] = data["players"].length < 2;
  
          setDoc(gameDoc, data).then(() => {
            console.log("joined game", gameId);
            this.toastr.success("Joined game " + gameId);
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

  getOpenGames() {
    this.gamesList = [];

    // get open games
    const gamesCollection = collection(this.db, 'games');

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
