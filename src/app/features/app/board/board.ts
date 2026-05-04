import { Component, computed, signal } from '@angular/core';

type BoardTask = {
  id: string;
  category: string;
  title: string;
  description: string;
  subtasksLabel: string;
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

@Component({
  selector: 'app-board',
  imports: [],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  host: {
    '(document:keydown.escape)': 'closeTaskDialog()',
  },
})
export class Board {
  readonly isTaskDialogOpen = signal(false);
  readonly isTaskDialogClosing = signal(false);
  readonly isTaskDialogEditMode = signal(false);
  readonly selectedTask = signal<BoardTask | null>(null);
  readonly dialogSubtasks = signal<DialogSubtask[]>([]);
  readonly dialogDueDate = signal('2023-05-10');
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

  openTaskDialog(task: BoardTask): void {
    this.selectedTask.set(task);
    this.isTaskDialogEditMode.set(false);
    this.dialogSubtasks.set([
      { title: 'Implement Recipe Recommendation', completed: true },
      { title: 'Implement Recipe Search Filters', completed: false },
    ]);
    this.dialogDueDate.set('2023-05-10');
    this.isTaskDialogClosing.set(false);
    this.isTaskDialogOpen.set(true);
  }

  startTaskEdit(): void {
    const task = this.selectedTask();
    if (!task) {
      return;
    }

    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editDueDate.set(this.dialogDueDate());
    this.editPriority.set(task.priority);
    this.editAssignedContactIds.set(['em', 'mb']);
    this.editSubtasks.set(this.dialogSubtasks().map((subtask) => subtask.title));
    this.isTaskDialogEditMode.set(true);
  }

  saveTaskEdits(): void {
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

    this.dialogDueDate.set(this.editDueDate() || this.dialogDueDate());
    this.dialogSubtasks.set(
      this.editSubtasks()
        .map((title) => title.trim())
        .filter((title) => title.length > 0)
        .map((title) => ({ title, completed: false })),
    );
    this.isTaskDialogEditMode.set(false);
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

  formatDialogDueDate(isoDate: string): string {
    if (!isoDate) {
      return '--/--/----';
    }

    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) {
      return isoDate;
    }

    return `${day}/${month}/${year}`;
  }

  toggleDialogSubtask(index: number): void {
    this.dialogSubtasks.update((subtasks) =>
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

  closeTaskDialog(): void {
    if (!this.isTaskDialogOpen()) {
      return;
    }

    this.isTaskDialogEditMode.set(false);
    this.isTaskDialogClosing.set(true);
    setTimeout(() => {
      this.isTaskDialogOpen.set(false);
      this.isTaskDialogClosing.set(false);
      this.selectedTask.set(null);
      this.dialogSubtasks.set([]);
    }, this.dialogAnimationDuration);
  }
}
