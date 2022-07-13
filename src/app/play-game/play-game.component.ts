import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

// import { Game } from '../game';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css']
})

export class PlayGameComponent implements OnInit {
  domain: string = "";
  gameId: string = "";
  data: any;
  valid: {valid: boolean, reason: string} = {valid: true, reason: ""};

  opponent: { name: string, id: string } = { name: "", id: "" };
  createdDelta: string = "";
  won: boolean | null = null;

  boardSize: { x: number, y: number } = { x: 4, y: 4 };
  board: string[][] = [];
  flip: boolean[][] = [];

  playerColor: string = "";
  playerTurn: boolean;
  localMoves: { x: number, y: number, color: string }[] = [];

  constructor(private db: Firestore, private auth: Auth, 
              private route: ActivatedRoute, private router: Router,
              @Inject(DOCUMENT) private document: any) {  }

  getInvite(gameId: string) {
    return this.domain + "/invite/" + gameId;
  }

  flipDisk(y: number, x:number, color: string) {
    this.board[y][x] = color;

    // animation
    this.flip[y][x] = true;
    setTimeout(() => {
      this.flip[y][x] = false;
    }, 1000);
  }

  putDisk(y: number, x: number, user: boolean, color?: string) {
    // check if game started
    if (user && !this.opponent.id) {
      console.log("game not started");
      return;
    }

    // check if place not taken
    if (user && this.board[y][x] !== "") {
      console.log("place taken");
      return;
    }

    // check if player turn
    if (user && !this.playerTurn) {
      console.log("not your turn");
      return;
    }

    if (color === undefined) {
      color = this.playerColor;
    }
    const opponentColor = color === "black" ? "white" : "black";

    this.flipDisk(y, x, color);

    // reverse disks
    // on x-axis
      // left
      for (let i = x-1; i >= 0; i--) {
        // if cell is null
        if (this.board[y][i] === "") {
          break;
        }

        if (this.board[y][i] === color) {
          const start = i+1;
          const end = x-1;

          for (let j = start; j <= end; j++) {
            if (user) { this.data.score[color]++; this.data.score[opponentColor]--; }

            this.flipDisk(y, j, color);
          }
          break;
        }
      }

      // right
      for (let i = x+1; i < this.boardSize.x; i++) {
        if (this.board[y][i] === "") {
          break;
        }

        if (this.board[y][i] === color) {
          const start = x+1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            if (user) { this.data.score[color]++; this.data.score[opponentColor]--; }
            
            this.flipDisk(y, j, color);
          }
          break;
        }
      }
    // on y-axis
      // up
      for (let i = y-1; i >= 0; i--) {
        if (this.board[i][x] === "") {
          break;
        }

        if (this.board[i][x] === color) {
          const start = i+1;
          const end = y-1;

          for (let j = start; j <= end; j++) {
            if (user) { this.data.score[color]++; this.data.score[opponentColor]--; }
            
            this.flipDisk(j, x, color);
          }
          break;
        }
      }

      // down
      for (let i = y+1; i < this.boardSize.y; i++) {
        if (this.board[i][x] === "") {
          break;
        }

        if (this.board[i][x] === color) {
          const start = y+1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            if (user) { this.data.score[color]++; this.data.score[opponentColor]--; }
            
            this.flipDisk(j, x, color);
          }
          break;
        }
      }

    // on diagonal
      // up-left
      for (let i = 1; i < this.boardSize.x; i++) {
        if (y-i < 0 || x-i < 0) {
          break;
        }

        if (this.board[y-i][x-i] === "") {
          break;
        }

        if (this.board[y-i][x-i] === color) {
          const start = 1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            const x_ = x-j;
            const y_ = y-j;

            if (user) { this.data.score[color]++; this.data.score[opponentColor]--;}

            this.flipDisk(y_, x_, color);
          }
          break;
        }
      }

      // up-right
      for (let i = 1; i < this.boardSize.x; i++) {
        if (y-i < 0 || x+i >= this.boardSize.x) {
          break;
        }

        if (this.board[y-i][x+i] === "") {
          break;
        }

        if (this.board[y-i][x+i] === color) {
          const start = 1;
          const end = i-1;
          
          for (let j = start; j <= end; j++) {
            const x_ = x+j;
            const y_ = y-j;

            if (user) { this.data.score[color]++; this.data.score[opponentColor]--;}

            this.flipDisk(y_, x_, color);
          }
          break;
        }
      }

      // down-left
      for (let i = 1; i < this.boardSize.x; i++) {
        if (y+i >= this.boardSize.y || x-i < 0) {
          break;
        }

        if (this.board[y+i][x-i] === "") {
          break;
        }

        if (this.board[y+i][x-i] === color) {
          const start = 1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            const x_ = x-j;
            const y_ = y+j;

            if (user) { this.data.score[color]++; this.data.score[opponentColor]--;}
            
            this.flipDisk(y_, x_, color);
          }
          break;
        }
      }

      // down-right
      for (let i = 1; i < this.boardSize.x; i++) {
        if (y+i >= this.boardSize.y || x+i >= this.boardSize.x) {
          break;
        }

        if (this.board[y+i][x+i] === "") {
          break;
        }

        if (this.board[y+i][x+i] === color) {
          const start = 1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            const x_ = x+j;
            const y_ = y+j;

            if (user) { this.data.score[color]++; this.data.score[opponentColor]--;}
            
            this.flipDisk(y_, x_, color);
          }
          break;
        }
      }
 
    // update database only if move was made by a player
    if (user) {
      this.data.score[color]++;
      this.data.moves.push({ x: x, y: y, color: color });

      // check if game over
      if (this.data.moves.length >= (this.boardSize.x * this.boardSize.y - 4)) {
        // check tie
        if (this.data.score["black"] === this.data.score["white"]) {
          this.won = null;

          this.data.winner = "tie";
        } else {

          const winnerColor = this.data.score["black"] > this.data.score["white"] ? "black" : "white";
          this.won = this.playerColor === winnerColor;
          this.data.winner = this.won ? this.auth.currentUser?.uid : this.opponent.id;
        }

        this.data.completed = true;
      }

      const gamesCollection = collection(this.db, 'game');
      const gameDoc = doc(gamesCollection, this.gameId);

      setDoc(gameDoc, this.data).then(() => {
        console.log("move saved");
      });
    }
  }

  startGame() {
    // create this.board
    for (let i = 0; i < this.boardSize.x; i++) {
      this.board[i] = [];
      this.flip[i] = [];
      for (let j = 0; j < this.boardSize.y; j++) {
        this.board[i][j] = "";
        this.flip[i][j] = false;
      }
    }

    const center = Math.floor(this.boardSize.x / 2);

    this.flipDisk(center-1, center-1, "black")
    this.flipDisk(center-1, center, "white")
    this.flipDisk(center, center, "black")
    this.flipDisk(center, center-1, "white")
  }

  ngOnInit(): void {
    this.domain = this.document.location.host;
    this.gameId = this.route.snapshot.paramMap.get("id") || "";
    
    this.startGame();

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    onSnapshot(gameDoc, (doc) => {
      this.data = doc.data();

      if (!this.data) {
        this.valid.valid = false;
        this.valid.reason = "Game not found";

        return;
      }

      // check if current user logged in
      if (!this.auth.currentUser) {
        this.valid.valid = false;
        this.valid.reason = "You need to log in to play";

        return;
      }

      // check if current user in game
      if (this.data.players.indexOf(this.auth.currentUser?.uid) === -1) {
        this.valid.valid = false;
        this.valid.reason = "You are not in this game";

        return;

        // this.router.navigate(["/join"]).then(() => {
        //   console.log("player not in game");
        // });
      }

      // recreate moves on board
      console.log("recreate", this.data.moves.length-this.localMoves.length, "moves on board");
      for (let i = 0; i < this.data.moves.length; i++) {
        const move = this.data.moves[i];

        // if move already on local board, skip
        const localMove = this.localMoves[i];
        if (localMove && localMove.x == move.x && localMove.y == move.y && localMove.color == move.color) {
          // console.log("move already on local board");
          continue;
        }

        // console.log("putting ", move.color, " at ", move.x, move.y);
        this.putDisk(move.y, move.x, false, move.color);
      }
      // update local moves
      this.localMoves = this.data.moves;

      this.data.created = new Date(this.data.created.seconds * 1000);

      this.createdDelta = (Math.ceil((new Date().getTime() - this.data.created.getTime())/1000/60)).toString() + " minutes"; // TODO: better time format

      // get opponent
      this.opponent.name = this.data.playerNames.find((p:string) => p !== this.auth.currentUser?.displayName);
      this.opponent.id = this.data.players.find((p:string) => p !== this.auth.currentUser?.uid);

      this.playerColor = this.data.players.indexOf(this.auth.currentUser?.uid) === 0 ? "black" : "white";

      // decide on player turn
      if (this.data.moves.length === 0) {
        // first turn
        this.playerTurn = this.playerColor === "white";
      }
      else {
        this.playerTurn = this.data.moves[this.data.moves.length - 1].color !== this.playerColor;
      }

      // check if current user won
      if (this.data.winner === "tie") {
        this.won = null;
      }
      else {
        this.won = this.data.winner === this.auth.currentUser?.uid;
      }

      // console.log("data: ", doc.data());
    });
  }

  ngOnDestroy(): void {
  
    // delete game if there is only one player left
    if (this.data.players.length === 1) {
      deleteDoc(doc(collection(this.db, 'game'), this.gameId));
    }

    // remove current user from game if it has finished
    if (this.data.completed) {
      this.data.players.splice(this.data.players.indexOf(this.auth.currentUser?.uid), 1);

      // update game doc
      const gamesCollection = collection(this.db, 'game');
      const gameDoc = doc(gamesCollection, this.gameId);

      updateDoc(gameDoc, { players: this.data.players });
    }
  }
}
