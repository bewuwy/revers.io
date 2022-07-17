import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { Firestore, collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { fromEvent, map, merge, Observable, Observer } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

// TODO: play without an account

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
  started: boolean = false;
  online: boolean = true;

  user: any;

  opponent: { name: string, id: string };
  opponentColor: string;
  createdDelta: string = "";
  won: boolean | null = null;
  resultShown: boolean = false;

  boardSize: number;
  board: string[][] = [];
  flip: boolean[][] = [];
  legalMove: boolean[][] = [];

  playerColor: string = "";
  playerTurn: boolean;
  localMoves: { x: number, y: number, color: string }[] = [];

  // audio effects
  bellRing:HTMLAudioElement = new Audio();
  winEffect: HTMLAudioElement = new Audio();
  loseEffect: HTMLAudioElement = new Audio();

  // constructor
  constructor(private db: Firestore, private auth: Auth, 
              private route: ActivatedRoute, private router: Router,
              public toastr: ToastrService,
              @Inject(DOCUMENT) private document: any) {  }

  createOnline$() {
    return merge(
      fromEvent(window, 'offline').pipe(map(() => false)),
      fromEvent(window, 'online').pipe(map(() => true)),
      new Observable((sub: Observer<boolean>) => {
        sub.next(navigator.onLine);
        sub.complete();
      }));
  }

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

  getFlippedDisks(y: number, x:number, color:string) {
    let flipped:any[] = [];

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
            flipped.push({y: y, x: j});
          }
          break;
        }
      }

      // right
      for (let i = x+1; i < this.boardSize; i++) {
        if (this.board[y][i] === "") {
          break;
        }

        if (this.board[y][i] === color) {
          const start = x+1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            flipped.push({y: y, x: j});
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
            flipped.push({y: j, x: x});
          }
          break;
        }
      }

      // down
      for (let i = y+1; i < this.boardSize; i++) {
        if (this.board[i][x] === "") {
          break;
        }

        if (this.board[i][x] === color) {
          const start = y+1;
          const end = i-1;

          for (let j = start; j <= end; j++) {
            flipped.push({y: j, x: x});
          }
          break;
        }
      }

    // on diagonal
      // up-left
      for (let i = 1; i < this.boardSize; i++) {
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

            flipped.push({y: y_, x: x_});
          }
          break;
        }
      }

      // up-right
      for (let i = 1; i < this.boardSize; i++) {
        if (y-i < 0 || x+i >= this.boardSize) {
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

            flipped.push({y: y_, x: x_});
          }
          break;
        }
      }

      // down-left
      for (let i = 1; i < this.boardSize; i++) {
        if (y+i >= this.boardSize || x-i < 0) {
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

            flipped.push({y: y_, x: x_});
          }
          break;
        }
      }

      // down-right
      for (let i = 1; i < this.boardSize; i++) {
        if (y+i >= this.boardSize || x+i >= this.boardSize) {
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

            flipped.push({y: y_, x: x_});
          }
          break;
        }
      }

    return flipped;
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

    // check if move is legal  // TODO: check also when receiving a move (a 2-player anti-cheat) 
    if (user && !this.legalMove[y][x]) {
      console.log("illegal move");
      return;
    }

    if (color === undefined) {
      color = this.playerColor;
    }

    this.legalMove[y][x] = false;
    this.flipDisk(y, x, color);

    let flipped = this.getFlippedDisks(y, x, color);
    for (let i = 0; i < flipped.length; i++) {
      this.flipDisk(flipped[i].y, flipped[i].x, color);
      if (user) { this.data.score[color]++; this.data.score[this.opponentColor]--; }
    }
 
    // update database only if move was made by a player
    if (user) {
      this.data.score[color]++;
      this.data.moves.push({ x: x, y: y, color: color });

      // check if board is full
      const maxMoves = (this.boardSize * this.boardSize) - (this.data.rules.startingDisks * 4);
      if (this.data.moves.length >= maxMoves) {
        this.setWinner();
      }

      this.pushTurn();
    }
  }

  setWinner() {
    // check tie
    if (this.data.score["black"] === this.data.score["white"]) {
      this.won = null;

      this.data.winner = "tie";
    } 
    else {

      const winnerColor = this.data.score["black"] > this.data.score["white"] ? "black" : "white";
      this.won = this.playerColor === winnerColor;
      this.data.winner = this.won ? this.user?.uid : this.opponent.id;
    }

    this.data.status.completed = true;
  }

  getWon() {
    if (this.data.status.completed) {
    
      if (this.data.winner === "tie") {
        this.won = null;
      }
      else {
        this.won = this.user.uid === this.data.winner;
      }
    }
  }

  skipTurn() {
    if (this.data.completed) { return; }
    if (this.data.rules.loseNoMove) {
      this.data.status.completed = true;
      this.data.winner = this.opponent.id;
      this.won = false;
    }

    this.data.moves.push({ x: -1, y: -1, color: this.playerColor });

    this.pushTurn();
  }

  // push data to firebase
  pushTurn() {
    setDoc(doc(collection(this.db, 'game'), this.gameId), this.data).then(() => {
      console.log("turn synced");
      this.online = true;
    }).catch((e) => {
      // disconnected error (probably)
      console.log("You got disconnected from the servers...")
      console.log(e);
    });
  }

  getLegalMoves() {
    let n:number = 0;

    // reversi original rules - no starting disks
    if (!this.data.rules.startingDisks && this.data.moves.length < 4) {
      // 4 center cells are legal
      const center = Math.floor(this.boardSize/2)-1;

      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < 2; j++) {
          if (this.board[center+i][center+j] === "") {
            this.legalMove[center+i][center+j] = true;
            n ++;
          }
        }
      }

      return;
    }

    // iterate through empty cells
    for (let i = 0; i < this.boardSize; i++) {
      for (let j = 0; j < this.boardSize; j++) {
        this.legalMove[i][j] = false;

        if (this.board[i][j] === "") {
          // check if opponent's disk is adjacent to this cell
          let opponentAdj: boolean = false;

          let rangeX = [...Array(this.boardSize).keys()];
          let rangeY = [...Array(this.boardSize).keys()];
          for (let dx=-1; dx < 2; dx++) {
            if (opponentAdj) { break; }
            
            let newX =  j + dx;
            if (!rangeX.includes(newX)) {
              continue;
            }

            for (let dy=-1; dy < 2; dy++) {
              let newY = i + dy;

              // console.log(newY, newX);

              if (!rangeY.includes(newY)) {
                continue;
              }
              
              if (!(dx === 0 && dy === 0)) {
                // adjacent cell
                if (this.board[newY][newX] === this.opponentColor) {
                  opponentAdj = true;
                  break;
                }
              }
            }
          }

          if (opponentAdj) {
            let flipped = this.getFlippedDisks(i, j, this.playerColor);
            // console.log(i, j, flipped);

            // check if player can flip anything on this move
            if (flipped.length > 0) {
              this.legalMove[i][j] = true;
              n++;
            }
          }
        }
      }
    }
  
    // console.log(this.legalMove);
    return n;
  }

  startGame() {
    // create this.board
    for (let i = 0; i < this.boardSize; i++) {
      this.board[i] = [];
      this.flip[i] = [];
      this.legalMove[i] = [];
      for (let j = 0; j < this.boardSize; j++) {
        this.board[i][j] = "";
        this.flip[i][j] = false;
        this.legalMove[i][j] = false;
      }
    }

    const center = Math.floor(this.boardSize / 2);

    if (this.data.rules.startingDisks) {
      this.flipDisk(center-1, center-1, "black");
      this.flipDisk(center-1, center, "white");
      this.flipDisk(center, center, "black");
      this.flipDisk(center, center-1, "white");        
    }
  }

  ngOnInit(): void {
    // online checker
    this.createOnline$().subscribe((isOnline:any) => {
      if (this.online && !isOnline) {
        this.toastr.error("You went offline!", "", {disableTimeOut: true, tapToDismiss: false});
      }
      
      if (!this.online && isOnline) {
        this.toastr.clear();
        this.toastr.success("You went online!");
      }

      this.online = isOnline;
    });

    // get domain name and game id
    this.domain = this.document.location.host;
    this.gameId = this.route.snapshot.paramMap.get("id") || "";

    // initialize sound notifications
    this.bellRing.src = "/assets/sound/bell-ding.wav";
    this.bellRing.volume = 0.4;
    this.bellRing.playbackRate = 0.5;
    this.bellRing.load();

    this.winEffect.src = "/assets/sound/win.wav";
    this.winEffect.volume = 0.4;
    this.winEffect.load();

    this.loseEffect.src = "/assets/sound/lose.wav";
    this.loseEffect.volume = 0.4;
    this.loseEffect.playbackRate = 0.5;
    this.loseEffect.load();

    // initialize database
    const gamesCollection = collection(this.db, 'game');
    const gameDoc = doc(gamesCollection, this.gameId);

    onSnapshot(gameDoc, (doc) => {
      this.data = doc.data();

      if (!this.started) {
        // get game rules
        if (!this.boardSize) {
          this.boardSize = this.data.rules.boardSize;
        }

        // start game if not started
        this.startGame();
        this.started = true;
      }

      if (!this.data) {
        this.valid.valid = false;
        this.valid.reason = "Game not found";

        return;
      }

      this.user = this.auth.currentUser;
      // check if current user logged in
      if (!this.user) {
        // check if there is a temp user
        const tempName = localStorage.getItem("guestName");
        const tempId = localStorage.getItem("guestId");

        if (!tempName && !tempId) {
          this.valid.valid = false;
          this.valid.reason = "You need to log in (or get invited) to play";

          return;
        }
        else {
          this.user = {'displayName': tempName, 'uid': tempId};
        }
      }

      // check if current user in game
      const playerIds = this.data.players.map((player:any) => player.id);
      if (playerIds.indexOf(this.user?.uid) === -1) {
        this.valid.valid = false;
        this.valid.reason = "You are not in this game";

        return;
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

        // if there were two skips in a row, end game
        if (i > 0 && this.data.moves[i-1].x === -1 && move.x === -1) {
          this.setWinner();

          this.pushTurn();
          break;
        }

        // if move is a skip move
        if (move.x === -1 && move.y === -1) {
          // if the move was the last move, inform user
          if (i === this.data.moves.length-1 && move.color === this.opponentColor) {
            const msg = this.data.rules.loseNoMove ? "You won!" : "Your turn!";

            this.toastr.info("Opponent couldn't make a move!", msg, {timeOut: 5000});
          }

          continue;
        }

        // console.log("putting ", move.color, " at ", move.x, move.y);
        this.putDisk(move.y, move.x, false, move.color);
      }

      // update local moves
      this.localMoves = this.data.moves;

      // get opponent
      const opponent = this.data.players.find((player:any) => player.id !== this.user?.uid);
      if (opponent && !this.opponent) {
        this.toastr.success(opponent.name + " joined the game!");
      }
      this.opponent = opponent;

      this.playerColor = playerIds.indexOf(this.user?.uid) === 0 ? "white" : "black";
      // get opponent's color
      this.opponentColor = this.playerColor === "black" ? "white" : "black";

      // check if current user won
      if (this.data.status.completed && !this.resultShown) {
        // this.won = this.data.winner === this.user?.uid;
        this.resultShown = true;
        this.getWon();

        if (this.won) {
          this.toastr.info("You won! 🎉", "", {timeOut: 5000});
          this.winEffect.play();
        }
        else if (this.data.winner === "tie") {
          this.toastr.info("It's a tie! 🤔", "", {timeOut: 5000});
        }
        else {
          this.toastr.info("You lost! 😥", "", {timeOut: 5000});
          this.loseEffect.play();
        }
      }

      // get game's creation date
      this.data.created = new Date(this.data.created.seconds * 1000);
      this.createdDelta = (Math.ceil((new Date().getTime() - this.data.created.getTime())/1000/60)).toString() + " minutes"; // TODO: better time format    

      if (this.data && !this.data.status.completed) {
        // console.log(this.data);
      
        // decide on player turn
        if (this.data.moves.length === 0) {
          // first turn
          this.playerTurn = this.playerColor === "white";
        }
        else {
          this.playerTurn = this.data.moves[this.data.moves.length - 1].color !== this.playerColor;
        }

        // current player's turn
        if (this.playerTurn) {  
          // get legal moves
          let legalMovesN = this.getLegalMoves();

          if (legalMovesN === 0) {
            // skip move after a second
            setTimeout(() => {
              let msg = this.data.rules.loseNoMove? "You lost!" : "Skipping turn...";

              this.toastr.warning("You have no legal moves", msg, {timeOut: 3000});
  
              this.skipTurn();
            }, 1000);
          }
          else if (this.data.players.length > 1) {
            setTimeout(() => {
              // notification bell
              this.bellRing.play();
            }, 700);
          }
        }

        
      }

      // console.log("data: ", doc.data());
    });
  }

  ngOnDestroy(): void {
    if (!this.data) {
      return;
    }
  
    // delete game if there is only one player left
    if (this.data.players.length === 1) {
      deleteDoc(doc(collection(this.db, 'game'), this.gameId));
    }

    // remove current user from game if it has finished
    if (this.data.status.completed) {
      const playerIds = this.data.players.map((player:any) => player.id);
      this.data.players.splice(playerIds.indexOf(this.user?.uid), 1);

      // update game doc
      const gamesCollection = collection(this.db, 'game');
      const gameDoc = doc(gamesCollection, this.gameId);

      updateDoc(gameDoc, { players: this.data.players });
    }
  }
}
