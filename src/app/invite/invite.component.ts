import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

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
              private route: ActivatedRoute, private router: Router, 
              private toastr: ToastrService) { }

  onAccept() {
    // add user to game
    const gameDoc = doc(collection(this.db, "game"), this.gameId);

    getDoc(gameDoc).then(game => {
      const gameData = game.data();
      if (!gameData) {
        return;
      }

      const players = gameData["players"];

      players.push({id: this.user.uid, name: this.user.displayName});

      updateDoc(gameDoc, { players: players }).then(() => {
        // redirect to game
        this.router.navigate(["/play", this.gameId]);
      });
    });
  }

  onDecline() {
    this.toastr.error("Declined the invite from " + this.opponent.name);
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

        if (opponent.id === this.user.uid) {
          this.valid = {valid: false, reason: "You cannot invite yourself"};
          return;
        }

        this.opponent = opponent;

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
