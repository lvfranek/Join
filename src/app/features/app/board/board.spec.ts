import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactService } from '../../../core/services/contact.service';
import { TaskService } from '../../../core/services/task.service';
import { BoardWorkspaceView } from './board';

describe('Board', () => {
  let component: BoardWorkspaceView;
  let fixture: ComponentFixture<BoardWorkspaceView>;
  let taskService: TaskService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardWorkspaceView],
      providers: [
        {
          provide: ContactService,
          useValue: {
            list: async () => [],
          },
        },
      ],
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
  it('should remember the selected column status when opening add task', () => {
    component.openAddTaskDialog('awaitFeedback');

    expect(component.addTaskStatus()).toBe('awaitFeedback');
    expect(component.isAddTaskDialogOpen()).toBe(true);
  });

  it('should delete the selected task and close the detail panel', () => {
    const task = taskService.createTask({
      title: 'Delete me',
      description: 'Remove this card',
      dueDate: '2026-05-10',
      category: 'Technical Task',
      priority: 'medium',
      assignees: [],
      subtasks: ['Cleanup state'],
    });

    component.openTaskDetailPanel(task);
    component.toggleTaskDetailSubtask(0);

    component.deleteSelectedTask();

    expect(taskService.tasks().some((entry) => entry.id === task.id)).toBe(false);
    expect(component.subtaskCompletionByTaskId()[task.id]).toBeUndefined();
    expect(component.isTaskDetailPanelClosing()).toBe(true);
  });

  it('should filter tasks in all board columns by the search query', () => {
    taskService.createTask({
      title: 'Build login flow',
      description: 'Create the auth screens',
      dueDate: '2026-05-10',
      category: 'Technical Task',
      priority: 'medium',
      assignees: [],
      subtasks: [],
    });
    taskService.createTask({
      title: 'Collect user feedback',
      description: 'Review card copy',
      dueDate: '2026-05-11',
      category: 'User Story',
      priority: 'low',
      status: 'awaitFeedback',
      assignees: [],
      subtasks: [],
    });

    component.updateBoardSearchQuery('feedback');

    expect(component.tasksForColumn('todo').length).toBe(0);
    expect(component.tasksForColumn('awaitFeedback').length).toBe(1);
    expect(component.tasksForColumn('awaitFeedback')[0].title).toBe('Collect user feedback');
  });

  it('should match tasks by subtasks and assigned contacts', () => {
    taskService.createTask({
      title: 'Prepare release',
      description: 'Ship board search',
      dueDate: '2026-05-12',
      category: 'Technical Task',
      priority: 'urgent',
      assignees: [{ id: 'contact-1', name: 'Marty McFly', initials: 'MM', color: '#29abe2' }],
      subtasks: ['Write smoke tests'],
    });

    component.updateBoardSearchQuery('smoke');
    expect(component.tasksForColumn('todo').length).toBe(1);

    component.updateBoardSearchQuery('marty');
    expect(component.tasksForColumn('todo').length).toBe(1);
  });
});
