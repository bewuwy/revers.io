import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, Auth, signOut, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';

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

  constructor(private auth: Auth, private router: Router) { 
    onAuthStateChanged(this.auth, (user) => {
      this.logged = user !== null;
    });
   }

  ngOnInit(): void { }

  onSubmitRegister() {
    if (this.registerForm.value.email && this.registerForm.value.password && this.registerForm.value.username) {
      this.signUp(this.registerForm.value.email, this.registerForm.value.password, this.registerForm.value.username);
    }
  }
  
  onSubmitLogin() {
    if (this.loginForm.value.email && this.loginForm.value.password) {
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

    }).catch((error) => {
      console.log("error: ", error);
    });
  }

  signIn(email: string, password: string) {
    signInWithEmailAndPassword(this.auth, email, password).then((user) => {

      // navigate to account page
      this.router.navigate(['account']);
    }).catch((error) => {
      console.log("error: ", error);
    });
  }

  onSignOut() {
    signOut(this.auth);
  }

}
