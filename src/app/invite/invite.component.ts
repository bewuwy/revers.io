import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})
export class InviteComponent implements OnInit {
  gameId: string = "";
  opponent: { name: string, id: string } = { name: "", id: "" };
  user: any;

  valid: {valid: boolean, reason: string} = {valid: true, reason: ""};

  constructor(private db: Firestore, private auth: Auth,
              private route: ActivatedRoute, private router: Router, ) { }

  onAccept() {
    // add user to game
    const gameDoc = doc(collection(this.db, "game"), this.gameId);

    getDoc(gameDoc).then(game => {
      const gameData = game.data();
      if (!gameData) {
        return;
      }

      const players = gameData["players"];
      const playerNames = gameData["playerNames"];

      players.push(this.user.uid);
      playerNames.push(this.user.displayName);

      updateDoc(gameDoc, { players, playerNames }).then(() => {
        // redirect to game
        this.router.navigate(["/play", this.gameId]);
      });
    });
  }

  onDecline() {
    alert("You declined the invite");
    // redirect to index
    this.router.navigate(["/"]);
  }

  ngOnInit(): void {
    this.gameId = this.route.snapshot.paramMap.get("id") || "";

    // get current user
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        // console.log(user);
        this.user = user;
      }
      else {
        this.user = null;
      }
    });

    // get opponent
    const gameDoc = doc(collection(this.db, "game"), this.gameId);

    getDoc(gameDoc).then(game => {
      const gameData = game.data();
      if (gameData) {
        const opponent:any = gameData["players"].find((p:any) => p.id !== this.user.uid);

        if (opponent === this.user.uid) {
          this.valid = {valid: false, reason: "You cannot invite yourself"};
          return;
        }

        this.opponent.name = opponent;
        this.opponent.id = opponent;

        // check if game is full
        if (gameData["players"].length >= 2) {
          this.valid.valid = false;
          this.valid.reason = "Game is full";
        } else {
          this.valid.valid = true;
        }
      }
      else {
        this.valid.valid = false;
        this.valid.reason = "Game does not exist";
      }
    });
  }

}
