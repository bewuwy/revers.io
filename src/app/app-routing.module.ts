import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountComponent } from './account/account.component';
import { PlayGameComponent } from './play-game/play-game.component';
import { JoinGameComponent } from './join-game/join-game.component';
import { InviteComponent } from './invite/invite.component';
import { SignInComponent } from './sign-in/sign-in.component';

const routes: Routes = [
  { path: '', redirectTo: '/join', pathMatch: 'full' },
  { path: 'account', component: AccountComponent },
  { path: "login", component: SignInComponent },
  { path: 'join', component: JoinGameComponent },
  { path: "invite/:id", component: InviteComponent },
  { path: 'play/:id', component: PlayGameComponent, pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
