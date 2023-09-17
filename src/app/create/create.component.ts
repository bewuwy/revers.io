import { Component, ViewEncapsulation } from '@angular/core';

@Component({
  selector: 'app-create',
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class CreateComponent {

  board: string[][] = [];
  flip: boolean[][] = [];
  boardSize: number;

  // create ui
  rulesShowMore = false;
  timerShowMore = false;

  rules = {
    startingDisks: true,
  }

  flipDisk(y: number, x:number, color: string) {
    this.board[y][x] = color;

    // animation
    this.flip[y][x] = true;
    setTimeout(() => {
      this.flip[y][x] = false;
    }, 1000);
  }

  ngOnInit() {
      this.boardSize = 8;
      
      // create this.board
      for (let i = 0; i < this.boardSize; i++) {
        this.board[i] = [];
        this.flip[i] = [];
        for (let j = 0; j < this.boardSize; j++) {
          this.board[i][j] = "";
          this.flip[i][j] = false;
        }
      }

      const center = Math.floor(this.boardSize / 2);

      if (this.rules.startingDisks) {
        this.flipDisk(center-1, center-1, "black");
        this.flipDisk(center-1, center, "white");
        this.flipDisk(center, center, "black");
        this.flipDisk(center, center-1, "white");        
      }
  }
}
