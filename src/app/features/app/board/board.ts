import { Component, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AddTask } from '../add-task/add-task';

@Component({
  selector: 'app-board',
  imports: [AddTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  private readonly router = inject(Router);
  private readonly modalBreakpoint = 1024;

  isAddTaskDialogOpen = false;

  async openAddTaskDialog(): Promise<void> {
    if (window.innerWidth <= this.modalBreakpoint) {
      await this.router.navigateByUrl('/add-task');
      return;
    }

    this.isAddTaskDialogOpen = true;
  }

  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeAddTaskDialogOnEscape(): void {
    this.closeAddTaskDialog();
  }

  @HostListener('window:resize')
  closeAddTaskDialogOnMobileViewport(): void {
    if (window.innerWidth <= this.modalBreakpoint) {
      this.closeAddTaskDialog();
    }
  }
}
