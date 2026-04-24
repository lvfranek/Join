import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-add-task',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2>Add Task</h2>`,
})
export class AddTask {}
