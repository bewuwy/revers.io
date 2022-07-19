import { Component, OnInit } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, collection, doc, getDoc, updateDoc, arrayUnion } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { nanoid } from 'nanoid';

@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.css']
})
export class InviteComponent implements OnInit {
  gameData: any;

  gameId: string = "";
  opponent: { name: string, id: string } = { name: "", id: "" };
  user: any;

  tempName: string;
  // tempId: string;  // ALERT: don't save guest id in local storage, it can be changed by user

  valid: {valid: boolean, reason: string} = {valid: true, reason: ""};

  constructor(private db: Firestore, private auth: Auth,
              private route: ActivatedRoute, private router: Router, 
              private toastr: ToastrService) { }

  onAccept() {
    // add user to game
    const gameDoc = doc(collection(this.db, "games"), this.gameId);


    // getDoc(gameDoc).then(game => {
      // const gameData = game.data();
      if (!this.gameData) {
        return;
      }

      const players = this.gameData["players"];

      if (!this.user) {  // guest
        this.user = {};

        // guest
        this.user.uid = "guest-" + nanoid();
        this.user.displayName = this.tempName || "Guest";

        // set local storage
        localStorage.setItem("guestId", this.user.uid);
        localStorage.setItem("guestName", this.user.displayName);
      }
      
      players.push({id: this.user.uid, name: this.user.displayName });

      updateDoc(gameDoc, { players: players }).then(() => {
        if (!this.user.uid.toString().startsWith("guest-")) {
          
            // add game to user's active games
            const userCollection = collection(this.db, 'users');
            const userDoc = doc(userCollection, this.user.uid);
            updateDoc(userDoc, {activeGames: arrayUnion(this.gameId)});
        }

        // redirect to game
        this.router.navigate(["/play", this.gameId]);
      });
    // });
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
        // get temp user data
        // this.tempId = localStorage.getItem("guestId") || "";
        this.tempName = localStorage.getItem("guestName") || "";

        this.user = null;
      }
    });

    // get opponent
    const gameDoc = doc(collection(this.db, "games"), this.gameId);

    getDoc(gameDoc).then(game => {
      this.gameData = game.data();

      if (this.gameData) {
        // check if game is full
        if (this.gameData["players"].length >= 2) {
          this.valid.valid = false;
          this.valid.reason = "Game is full";
        } else {
          this.valid.valid = true;
        }

        const opponent:any = this.gameData["players"][0]; //.find((p:any) => p.id !== this.user.uid);

        if (this.user && opponent.id === this.user.uid) {
          this.valid = {valid: false, reason: "You cannot invite yourself"};
          return;
        }

        this.opponent = opponent;
      }
      else {
        this.valid.valid = false;
        this.valid.reason = "Game does not exist";
      }
    });
  }

}
