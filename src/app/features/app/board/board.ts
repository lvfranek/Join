import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  CdkDragEnd,
  CdkDragDrop,
  CdkDragMove,
  CdkDragStart,
  DragDropModule,
} from '@angular/cdk/drag-drop';
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
  private readonly dialogAnimationDuration = 400;
  private autoScrollFrameId: number | null = null;
  private activeDragPointerY: number | null = null;
  private activeDragElement: HTMLElement | null = null;

  readonly boardColumns: BoardColumn[] = [
    { id: 'todo', title: 'To do', emptyText: 'No tasks to do' },
    { id: 'inProgress', title: 'In progress', emptyText: 'No tasks in progress' },
    { id: 'awaitFeedback', title: 'Await feedback', emptyText: 'No tasks awaiting feedback' },
    { id: 'done', title: 'Done', emptyText: 'No tasks done' },
  ];

  readonly tasks = this.taskService.tasks;
  readonly connectedDropListIds: string[] = [
    'board-todo-tasks',
    'board-in-progress-tasks',
    'board-await-feedback-tasks',
    'board-done-tasks',
  ];

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
  readonly isTaskDetailEditSubmitted = signal(false);
  readonly isEditDueDateTouched = signal(false);
  readonly minDueDate = this.getTodayIsoDate();

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

  tasksForColumn(status: TaskStatus): TaskRecord[] {
    return this.tasks().filter((task) => task.status === status);
  }

  dropListId(status: TaskStatus): string {
    if (status === 'inProgress') {
      return 'board-in-progress-tasks';
    }

    if (status === 'awaitFeedback') {
      return 'board-await-feedback-tasks';
    }

    return `board-${status}-tasks`;
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

  dropTask(event: CdkDragDrop<TaskRecord[]>): void {
    const movedTask = event.item.data;
    const targetStatus = this.statusFromDropListId(event.container.id);

    if (!movedTask || !targetStatus) {
      return;
    }

    this.taskService.moveTask(movedTask.id, targetStatus, event.currentIndex);
  }

  onTaskDragMoved(event: CdkDragMove<TaskRecord>): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.activeDragPointerY = event.pointerPosition.y;
  }

  onTaskDragStarted(event: CdkDragStart<TaskRecord>): void {
    this.activeDragElement = event.source.element.nativeElement;
    this.startAutoScrollLoop();
  }

  onTaskDragEnded(_event: CdkDragEnd<TaskRecord>): void {
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

  beginTaskDetailEdit(): void {
    const task = this.selectedTask();
    if (!task) {
      return;
    }

    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editDueDate.set(this.taskDetailDueDate());
    this.editPriority.set(task.priority);
    this.editAssignedContactIds.set(task.assignees.map((assignee) => assignee.id));
    this.editSubtasks.set(this.taskDetailSubtasks().map((subtask) => subtask.title));
    this.isTaskDetailEditSubmitted.set(false);
    this.isEditDueDateTouched.set(false);
    this.isTaskDetailEditActive.set(true);
  }

  saveTaskDetailEdits(): void {
    const currentTask = this.selectedTask();
    if (!currentTask) {
      return;
    }

    this.isTaskDetailEditSubmitted.set(true);

    if (!this.isEditDueDateValid()) {
      return;
    }

    const normalizedSubtasks = this.editSubtasks()
      .map((title) => title.trim())
      .filter((title) => title.length > 0);

    const updatedTask = this.taskService.updateTask(currentTask.id, {
      title: this.editTitle().trim() || currentTask.title,
      description: this.editDescription().trim() || currentTask.description,
      dueDate: this.editDueDate() || this.taskDetailDueDate(),
      priority: this.editPriority(),
      subtasks: normalizedSubtasks,
    });

    if (updatedTask) {
      this.selectedTask.set(updatedTask);
      this.taskDetailDueDate.set(updatedTask.dueDate);
      this.taskDetailSubtasks.set(
        updatedTask.subtasks.map((title) => ({ title, completed: false })),
      );
    }

    this.isTaskDetailEditSubmitted.set(false);
    this.isEditDueDateTouched.set(false);
    this.isTaskDetailEditActive.set(false);
  }

  setEditPriority(priority: TaskRecord['priority']): void {
    this.editPriority.set(priority);
  }

  updateEditDueDate(value: string): void {
    this.editDueDate.set(value);
  }

  markEditDueDateTouched(): void {
    this.isEditDueDateTouched.set(true);
  }

  isEditDueDateInvalid(): boolean {
    return (this.isTaskDetailEditSubmitted() || this.isEditDueDateTouched()) && !this.isEditDueDateValid();
  }

  getEditDueDateError(): string {
    const value = this.editDueDate().trim();

    if (!value) {
      return 'This field is required';
    }

    if (!this.hasFourDigitYear(value)) {
      return 'Use a 4-digit year';
    }

    if (this.isDateInPast(value)) {
      return 'Date cannot be in the past';
    }

    return '';
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
    this.isTaskDetailEditSubmitted.set(false);
    this.isEditDueDateTouched.set(false);
    this.selectedTask.set(null);
    this.taskDetailSubtasks.set([]);
  }

  private statusFromDropListId(listId: string): TaskStatus | null {
    if (listId === 'board-todo-tasks') {
      return 'todo';
    }

    if (listId === 'board-in-progress-tasks') {
      return 'inProgress';
    }

    if (listId === 'board-await-feedback-tasks') {
      return 'awaitFeedback';
    }

    if (listId === 'board-done-tasks') {
      return 'done';
    }

    return null;
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

  private isEditDueDateValid(): boolean {
    const value = this.editDueDate().trim();
    return value.length > 0 && this.hasFourDigitYear(value) && !this.isDateInPast(value);
  }

  private hasFourDigitYear(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
  }

  private isDateInPast(value: string): boolean {
    return value.trim() < this.minDueDate;
  }

  private getTodayIsoDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
