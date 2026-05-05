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

    expect(component.tasksForColumn('todo')).toHaveSize(0);
    expect(component.tasksForColumn('awaitFeedback')).toHaveSize(1);
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
    expect(component.tasksForColumn('todo')).toHaveSize(1);

    component.updateBoardSearchQuery('marty');
    expect(component.tasksForColumn('todo')).toHaveSize(1);
  });
});
