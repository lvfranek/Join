import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { inject } from '@angular/core';
import { TaskRecord, TaskService, TaskStatus } from '../../../core/services/task.service';

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
  imports: [AddTask],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeOpenDialogs()',
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
}
