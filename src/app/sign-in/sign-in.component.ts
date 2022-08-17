import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, Auth, 
         signOut, updateProfile, sendPasswordResetEmail, sendEmailVerification } from '@angular/fire/auth';
import { setDoc, Firestore, doc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { collection } from '@firebase/firestore';
import Swal from 'sweetalert2'

// TODO: login through google

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.css']
})
export class SignInComponent implements OnInit {
  // const variables
  MAX_USERNAME_LENGTH = 20;
  MIN_PASSWORD_LENGTH = 8;


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

      if (this.logged) {
        this.router.navigate(['account']);
      }
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

  onForgotPassword() {
    const email = this.loginForm.value.email;

    if (email) {
      Swal.fire({
        html: `An email will be sent to <b>${email}</b> with instructions on how to reset your password.`,
        showCancelButton: true,
        cancelButtonColor: '#d33',
      }).then((result) => {
        if (result.isConfirmed) {
          sendPasswordResetEmail(this.auth, email).then(() => {
            this.toastr.success('Email with password reset instructions sent', 'Email sent', {timeOut: 8000});
          });
        }
      });
    }
    else {
      this.toastr.error('Please enter an email', 'Password reset', {timeOut: 3000});
    }
  }

  signUp(email: string, password: string, username: string) {
    createUserWithEmailAndPassword(this.auth, email, password).then((user) => {

      // update user with username
      updateProfile(user.user, {displayName: username}).then(() => {
        console.log("updated user: ", user.user);

        sendEmailVerification(user.user).then(() => {
          this.toastr.success("Please verify your email", "Signed up successfully", {timeOut: 3000});
        });

        // navigate to account page
        this.router.navigate(['account']);

      }).catch((error) => {
        console.log("error: ", error);
      });

      // create user document
      setDoc(doc(collection(this.db, 'users'), user.user.uid), {
        activeGames: []
      });

    }).catch((error) => {
      console.log("error: ", error);

      // email in use
      if (error.code === 'auth/email-already-in-use') {
        this.registerForm.controls.email.setErrors({'emailInUse': true});
        this.toastr.error("Email already in use", "Error creating an account", {timeOut: 5000});
      }

      else {
        this.toastr.error(error.code, "Error creating an account", {timeOut: 3000});
      }
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

      // account temporarily disabled
      else if (error.code === 'auth/too-many-requests') {
        console.log("account temporarily disabled");
        this.loginForm.controls.password.setErrors({'accountTempDisabled': true});
      }

      else {
        console.log("error: ", error);
        this.toastr.error(error.code, "Error signing in", {timeOut: 3000});
      }
    });
  }

  onSignOut() {
    signOut(this.auth);
  }

}
