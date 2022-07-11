import { Component, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, onSnapshot, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

// import { Game } from '../game';

@Component({
  selector: 'app-play-game',
  templateUrl: './play-game.component.html',
  styleUrls: ['./play-game.component.css']
})
export class PlayGameComponent implements OnInit {
  gameId: string = "";
  data: any;

  opponent: { name: string, id: string } = { name: "", id: "" };
  createdDelta: string = "";
  won: boolean | null = null;

  boardSize: { x: number, y: number } = { x: 4, y: 4 };
  board: string[][] = [];
  playerColor: string = "";

  constructor(private db: Firestore, private auth: Auth, 
              private route: ActivatedRoute, private router: Router) {  }

  putDisk(x: number, y: number,) {
    // check if game started
    if (!this.opponent.id) {
      console.log("game not started");
      return;
    }

    // check if place not taken
    if (this.board[x][y] !== "") {
      console.log("place taken");
      return;
    }

    const color = this.playerColor;

    this.board[x][y] = color;
    this.data.moves.push({ x: x, y: y, color: color });

    this.data.score[color]++;

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

  startGame() {
    const center = Math.floor(this.boardSize.x / 2);

    this.board[center-1][center-1] = "black";
    this.board[center-1][center] = "white";
    this.board[center][center] = "black";
    this.board[center][center-1] = "white";
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get("id") || "";
    
    // create this.board
    for (let i = 0; i < this.boardSize.x; i++) {
      this.board[i] = [];
      for (let j = 0; j < this.boardSize.y; j++) {
        this.board[i][j] = "";
      }
    }
    this.startGame();

    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    onSnapshot(gameDoc, (doc) => {
      this.data = doc.data();

      // recreate moves on board
      for (let i = 0; i < this.data.moves.length; i++) {
        const move = this.data.moves[i];
        this.board[move.x][move.y] = move.color;
      }

      this.data.created = new Date(this.data.created.seconds * 1000);

      this.createdDelta = (Math.ceil((new Date().getTime() - this.data.created.getTime())/1000/60)).toString() + " minutes"; // TODO: better time format

      this.opponent.name = this.data.playerNames.find((p:string) => p !== this.auth.currentUser?.displayName);
      this.opponent.id = this.data.players.find((p:string) => p !== this.auth.currentUser?.uid);

      this.playerColor = this.data.players.indexOf(this.auth.currentUser?.uid) === 0 ? "black" : "white";

      // check if current user in game
      if (this.data.players.indexOf(this.auth.currentUser?.uid) === -1) {
        this.router.navigate(["/join"]).then(() => {
          console.log("player not in game");
        });
      }

      // check if current user won
      if (this.data.winner === "tie") {
        this.won = null;
      }
      else {
        this.won = this.data.winner === this.auth.currentUser?.uid;
      }

      console.log("data: ", doc.data());
    });
  }
}
