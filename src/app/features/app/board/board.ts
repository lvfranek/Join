import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { inject } from '@angular/core';
import { TaskRecord, TaskService, TaskStatus } from '../../../core/services/task.service';
import {
  CdkDragEnd,
  CdkDragDrop,
  CdkDragMove,
  CdkDragStart,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';

type BoardTask = {
  id: string;
  category: string;
  title: string;
  description: string;
  assigneeInitials: string;
  priority: 'low' | 'medium' | 'urgent';
};

type DialogSubtask = {
  title: string;
  completed: boolean;
};

type AssignableContact = {
  id: string;
  name: string;
  initials: string;
};

import { AddTask } from '../add-task/add-task';

type BoardColumn = {
  id: TaskStatus;
  title: string;
  emptyText: string;
};

@Component({
  selector: 'app-board',
  imports: [AddTask, DragDropModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeOpenDialogs()',
    '(window:resize)': 'onWindowResize()',
  },
})
export class BoardWorkspaceView {
  private readonly taskService = inject(TaskService);

  readonly boardColumns: BoardColumn[] = [
    { id: 'todo', title: 'To do', emptyText: 'No tasks to do' },
    { id: 'inProgress', title: 'In progress', emptyText: 'No tasks in progress' },
    { id: 'awaitFeedback', title: 'Await feedback', emptyText: 'No tasks awaiting feedback' },
    { id: 'done', title: 'Done', emptyText: 'No tasks done' },
  ];

  readonly tasks = this.taskService.tasks;
  readonly connectedDropListIds = [
    'board-todo-tasks',
    'board-in-progress-tasks',
    'board-await-feedback-tasks',
    'board-done-tasks',
  ];

  readonly todoTasks = signal<BoardTask[]>([
    {
      id: 'task-todo-1',
      category: 'UI/UX',
      title: 'Draft onboarding empty states',
      description:
        'Create first-pass visuals for empty board, empty contacts, and loading transitions.',
      assigneeInitials: 'LS',
      priority: 'low',
    },
  ]);

  readonly inProgressTasks = signal<BoardTask[]>([
    {
      id: 'task-1',
      category: 'Category',
      title: 'Implement user authentication flow',
      description:
        'Set up OAuth2 login with Google and GitHub, including token refresh and session management for all protected routes.',
      assigneeInitials: 'AB',
      priority: 'medium',
    },
    {
      id: 'task-progress-2',
      category: 'Backend',
      title: 'Sync contact updates with Supabase',
      description:
        'Persist contact edits and deletions through service layer and verify optimistic updates.',
      assigneeInitials: 'EM',
      priority: 'urgent',
    },
  ]);

  readonly awaitFeedbackTasks = signal<BoardTask[]>([
    {
      id: 'task-feedback-1',
      category: 'QA',
      title: 'Verify mobile contact actions menu',
      description:
        'Run tablet and mobile interaction checks for contact detail actions and hover states.',
      assigneeInitials: 'AB',
      priority: 'medium',
    },
  ]);

  readonly doneTasks = signal<BoardTask[]>([
    {
      id: 'task-done-1',
      category: 'Docs',
      title: 'Document responsive contact behavior',
      description:
        'Capture final hover, avatar, and dialog behavior updates for the team handover notes.',
      assigneeInitials: 'MB',
      priority: 'low',
    },
  ]);

  readonly isAddTaskDialogOpen = signal(false);
  readonly isTaskDetailPanelOpen = signal(false);
  readonly isTaskDetailPanelClosing = signal(false);
  readonly isTaskDetailEditActive = signal(false);
  readonly selectedTask = signal<TaskRecord | null>(null);
  readonly taskDetailSubtasks = signal<DialogSubtask[]>([]);
  readonly taskDetailDueDate = signal('2023-05-10');
  readonly editTitle = signal('');
  readonly editDescription = signal('');
  readonly editDueDate = signal('');
  readonly editPriority = signal<'low' | 'medium' | 'urgent'>('medium');
  readonly editAssignedContactIds = signal<string[]>([]);
  readonly editSubtasks = signal<string[]>([]);

  readonly assignableContacts: AssignableContact[] = [
    { id: 'em', name: 'Emmanuel Mauer', initials: 'EM' },
    { id: 'mb', name: 'Marcel Bauer', initials: 'MB' },
    { id: 'ab', name: 'Aylin Becker', initials: 'AB' },
    { id: 'ls', name: 'Lina Schmidt', initials: 'LS' },
  ];

  readonly selectedAssignedContacts = computed(() => {
    const selectedIds = this.editAssignedContactIds();
    return this.assignableContacts.filter((contact) => selectedIds.includes(contact.id));
  });

  private readonly dialogAnimationDuration = 400;
  private autoScrollFrameId: number | null = null;
  private activeDragPointerY: number | null = null;
  private activeDragElement: HTMLElement | null = null;

  tasksForColumn(status: TaskStatus): TaskRecord[] {
    return this.tasks().filter((task) => task.status === status);
  }

  getPriorityIconPath(priority: 'low' | 'medium' | 'urgent'): string {
    return `./icons/board/${priority}.svg`;
  }

  getSubtaskSummary(task: TaskRecord): string {
    return `${task.subtasks.length}/${task.subtasks.length} Subtasks`;
  }

  openAddTaskDialog(): void {
    this.resetTaskDetailPanelState();
    this.isAddTaskDialogOpen.set(true);
  }

  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen.set(false);
  }

  openTaskDetailPanel(task: TaskRecord): void {
    this.closeAddTaskDialog();
    this.selectedTask.set(task);
    this.isTaskDetailEditActive.set(false);
    this.taskDetailSubtasks.set(task.subtasks.map((title) => ({ title, completed: false })));
    this.taskDetailDueDate.set(task.dueDate);
    this.isTaskDetailPanelClosing.set(false);
    this.isTaskDetailPanelOpen.set(true);
  }

  dropTask(event: CdkDragDrop<BoardTask[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    this.refreshTaskColumns();
  }

  onTaskDragMoved(event: CdkDragMove<BoardTask>): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.activeDragPointerY = event.pointerPosition.y;
  }

  onTaskDragStarted(event: CdkDragStart<BoardTask>): void {
    this.activeDragElement = event.source.element.nativeElement;
    this.startAutoScrollLoop();
  }

  onTaskDragEnded(_event: CdkDragEnd<BoardTask>): void {
    this.stopAutoScrollLoop();
    this.activeDragPointerY = null;
    this.activeDragElement = null;
  }

  readonly isMobileBoardView = signal(this.getWindowWidth() <= 1024);

  readonly dragStartDelay = computed(() =>
    this.isMobileBoardView() ? { touch: 180, mouse: 0 } : 0,
  );

  dropListOrientation(): 'vertical' | 'horizontal' {
    return this.isMobileBoardView() ? 'horizontal' : 'vertical';
  }

  onWindowResize(): void {
    this.isMobileBoardView.set(this.getWindowWidth() <= 1024);
  }

  private getWindowWidth(): number {
    return typeof window === 'undefined' ? 1200 : window.innerWidth;
  }

  getPriorityIconPath(priority: BoardTask['priority']): string {
    return `./icons/board/${priority}.svg`;
  }

  beginTaskDetailEdit(): void {
    const task = this.selectedTask();
    if (!task) {
      return;
    }

    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editDueDate.set(this.taskDetailDueDate());
    this.editPriority.set(task.priority);
    this.editAssignedContactIds.set(['em', 'mb']);
    this.editSubtasks.set(this.taskDetailSubtasks().map((subtask) => subtask.title));
    this.isTaskDetailEditActive.set(true);
  }

  saveTaskDetailEdits(): void {
    const currentTask = this.selectedTask();
    if (!currentTask) {
      return;
    }

    this.selectedTask.set({
      ...currentTask,
      title: this.editTitle().trim() || currentTask.title,
      description: this.editDescription().trim() || currentTask.description,
      priority: this.editPriority(),
    });

    this.taskDetailDueDate.set(this.editDueDate() || this.taskDetailDueDate());
    this.taskDetailSubtasks.set(
      this.editSubtasks()
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .map((title) => ({ title, completed: false })),
    );
    this.isTaskDetailEditActive.set(false);
  }

  setEditPriority(priority: 'low' | 'medium' | 'urgent'): void {
    this.editPriority.set(priority);
  }

  addAssignedContact(contactId: string): void {
    if (!contactId) {
      return;
    }

    this.editAssignedContactIds.update((ids) =>
      ids.includes(contactId) ? ids : [...ids, contactId],
    );
  }

  addEditSubtask(subtaskTitle: string): void {
    const normalized = subtaskTitle.trim();
    if (!normalized) {
      return;
    }

    this.editSubtasks.update((subtasks) => [...subtasks, normalized]);
  }

  formatTaskDetailDueDate(isoDate: string): string {
    if (!isoDate) {
      return '--/--/----';
    }

    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) {
      return isoDate;
    }

    return `${day}/${month}/${year}`;
  }

  toggleTaskDetailSubtask(index: number): void {
    this.taskDetailSubtasks.update((subtasks) =>
      subtasks.map((subtask, currentIndex) =>
        currentIndex === index
          ? {
              ...subtask,
              completed: !subtask.completed,
            }
          : subtask,
      ),
    );
  }

  closeTaskDetailPanel(): void {
    if (!this.isTaskDetailPanelOpen()) {
      return;
    }

    this.isTaskDetailEditActive.set(false);
    this.isTaskDetailPanelClosing.set(true);
    setTimeout(() => {
      this.isTaskDetailPanelOpen.set(false);
      this.isTaskDetailPanelClosing.set(false);
      this.selectedTask.set(null);
      this.taskDetailSubtasks.set([]);
    }, this.dialogAnimationDuration);
  }

  closeOpenDialogs(): void {
    if (this.isAddTaskDialogOpen()) {
      this.closeAddTaskDialog();
    }

    this.closeTaskDetailPanel();
  }

  private resetTaskDetailPanelState(): void {
    this.isTaskDetailPanelOpen.set(false);
    this.isTaskDetailPanelClosing.set(false);
    this.isTaskDetailEditActive.set(false);
    this.selectedTask.set(null);
    this.taskDetailSubtasks.set([]);
  }

  private refreshTaskColumns(): void {
    this.todoTasks.set([...this.todoTasks()]);
    this.inProgressTasks.set([...this.inProgressTasks()]);
    this.awaitFeedbackTasks.set([...this.awaitFeedbackTasks()]);
    this.doneTasks.set([...this.doneTasks()]);
  }

  private startAutoScrollLoop(): void {
    if (typeof window === 'undefined' || this.autoScrollFrameId !== null) {
      return;
    }

    const tick = () => {
      if (this.activeDragPointerY !== null) {
        const scrollContainer = this.activeDragElement
          ? this.findScrollableAncestor(this.activeDragElement)
          : null;

        if (scrollContainer) {
          this.scrollElementNearEdges(scrollContainer, this.activeDragPointerY);
        } else {
          this.scrollWindowNearEdges(this.activeDragPointerY);
        }
      }

      this.autoScrollFrameId = window.requestAnimationFrame(tick);
    };

    this.autoScrollFrameId = window.requestAnimationFrame(tick);
  }

  private stopAutoScrollLoop(): void {
    if (typeof window === 'undefined' || this.autoScrollFrameId === null) {
      return;
    }

    window.cancelAnimationFrame(this.autoScrollFrameId);
    this.autoScrollFrameId = null;
  }

  private findScrollableAncestor(start: HTMLElement): HTMLElement | null {
    let current: HTMLElement | null = start.parentElement;

    while (current) {
      const styles = window.getComputedStyle(current);
      const hasScrollableOverflow =
        styles.overflowY === 'auto' || styles.overflowY === 'scroll';
      const canScroll = current.scrollHeight > current.clientHeight;

      if (hasScrollableOverflow && canScroll) {
        return current;
      }

      current = current.parentElement;
    }

    return null;
  }

  private scrollElementNearEdges(container: HTMLElement, pointerY: number): void {
    const rect = container.getBoundingClientRect();
    const edgeThreshold = Math.min(110, Math.max(56, rect.height * 0.2));
    const maxScrollStep = 24;

    let scrollDelta = 0;

    if (pointerY < rect.top + edgeThreshold) {
      const intensity = (rect.top + edgeThreshold - pointerY) / edgeThreshold;
      scrollDelta = -Math.ceil(intensity * maxScrollStep);
    } else if (pointerY > rect.bottom - edgeThreshold) {
      const intensity = (pointerY - (rect.bottom - edgeThreshold)) / edgeThreshold;
      scrollDelta = Math.ceil(intensity * maxScrollStep);
    }

    if (scrollDelta !== 0) {
      container.scrollBy({ top: scrollDelta, left: 0, behavior: 'auto' });
    }
  }

  private scrollWindowNearEdges(pointerY: number): void {
    const viewportHeight = window.innerHeight;
    const edgeThreshold = 96;
    const maxScrollStep = 22;

    let scrollDelta = 0;

    if (pointerY < edgeThreshold) {
      const intensity = (edgeThreshold - pointerY) / edgeThreshold;
      scrollDelta = -Math.ceil(intensity * maxScrollStep);
    } else if (pointerY > viewportHeight - edgeThreshold) {
      const intensity = (pointerY - (viewportHeight - edgeThreshold)) / edgeThreshold;
      scrollDelta = Math.ceil(intensity * maxScrollStep);
    }

    if (scrollDelta !== 0) {
      window.scrollBy({ top: scrollDelta, left: 0, behavior: 'auto' });
    }
  }
}
