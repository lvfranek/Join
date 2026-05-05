import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskService } from '../../../core/services/task.service';
import { BoardWorkspaceView } from './board';

describe('Board', () => {
  let component: BoardWorkspaceView;
  let fixture: ComponentFixture<BoardWorkspaceView>;
  let taskService: TaskService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardWorkspaceView],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardWorkspaceView);
    component = fixture.componentInstance;
    taskService = TestBed.inject(TaskService);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reject invalid edit due dates', () => {
    const task = taskService.createTask({
      title: 'Date validation task',
      description: 'Validate edit date',
      dueDate: component.minDueDate,
      category: 'Technical Task',
      priority: 'medium',
      assignees: [],
      subtasks: [],
    });

    component.openTaskDetailPanel(task);
    component.beginTaskDetailEdit();

    component.updateEditDueDate('2000-01-01');
    component.saveTaskDetailEdits();

    expect(component.isEditDueDateInvalid()).toBe(true);
    expect(component.getEditDueDateError()).toBe('Date cannot be in the past');

    component.updateEditDueDate('10000-01-01');
    component.saveTaskDetailEdits();

    expect(component.isEditDueDateInvalid()).toBe(true);
    expect(component.getEditDueDateError()).toBe('Use a 4-digit year');
  });
});
