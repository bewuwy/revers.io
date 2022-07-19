import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, Auth, signOut, updateProfile } from '@angular/fire/auth';
import { setDoc, Firestore, doc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { collection } from '@firebase/firestore';

// TODO: login through google

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {
  logged: boolean = false;

  registerForm = new FormGroup({
    username: new FormControl('', {nonNullable: true}),
    email: new FormControl('', {nonNullable: true}),
    password: new FormControl('', {nonNullable: true})
  });

  loginForm = new FormGroup({
    email: new FormControl('', {nonNullable: true}),
    password: new FormControl('', {nonNullable: true})
  });

  constructor(private auth: Auth, private db: Firestore, 
              private router: Router,
              private toastr: ToastrService) {
                
    onAuthStateChanged(this.auth, (user) => {
      this.logged = user !== null;
    });
   }

  ngOnInit(): void { }

  onSubmitRegister() {
    this.registerForm.markAllAsTouched();

    if (this.registerForm.value.email && this.registerForm.value.password && this.registerForm.value.username && this.registerForm.valid) {
      this.signUp(this.registerForm.value.email, this.registerForm.value.password, this.registerForm.value.username);
    }
  }
  
  onSubmitLogin() {
    this.loginForm.markAllAsTouched();

    if (this.loginForm.value.email && this.loginForm.value.password && this.loginForm.valid) {
      this.signIn(this.loginForm.value.email, this.loginForm.value.password);
    }
  }

  signUp(email: string, password: string, username: string) {
    createUserWithEmailAndPassword(this.auth, email, password).then((user) => {

      // update user with username
      updateProfile(user.user, {displayName: username}).then(() => {
        console.log("updated user: ", user.user);

        // navigate to account page
        this.router.navigate(['account']);
        // .then(() => {
        //   location.reload();
        // });

      }).catch((error) => {
        console.log("error: ", error);
      });

      // create user document
      setDoc(doc(collection(this.db, 'users'), user.user.uid), {
        wins: 0,
        losses: 0,
        ties: 0,
        gamesNumber: 0,
      });

    }).catch((error) => {
      console.log("error: ", error);
    });
  }

  signIn(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password).then((user) => {
      this.toastr.success("Signed in successfully");

      // navigate to join-game page
      this.router.navigate(['join']);
    }).catch((error) => {
      // wrong password
      if (error.code === 'auth/wrong-password') {
        console.log("wrong password");
        this.loginForm.controls.password.setErrors({'wrongPassword': true});
      }

      else {
        console.log("error: ", error);
      }
    });
  }

  onSignOut() {
    signOut(this.auth);
  }

}
