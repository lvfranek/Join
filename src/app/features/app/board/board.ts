import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import {
  CdkDragEnd,
  CdkDragDrop,
  CdkDragMove,
  CdkDragStart,
  DragDropModule,
} from '@angular/cdk/drag-drop';
import { TaskRecord, TaskService, TaskStatus } from '../../../core/services/task.service';
import { ContactRecord, ContactService } from '../../../core/services/contact.service';

type DialogSubtask = {
  title: string;
  completed: boolean;
};

type AssignableContact = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

import { AddTask } from '../add-task/add-task';

type BoardColumn = {
  id: TaskStatus;
  title: string;
  emptyText: string;
};
type BoardEditRequiredField = 'title' | 'dueDate';

@Component({
  selector: 'app-board',
  imports: [AddTask, DragDropModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeEditAssignedDropdown()',
    '(document:keydown.escape)': 'closeOpenDialogs()',
    '(window:resize)': 'onWindowResize()',
  },
})
export class BoardWorkspaceView implements OnDestroy, OnInit {
  private readonly taskService = inject(TaskService);
  private readonly contactService = inject(ContactService);
  private readonly dialogAnimationDuration = 400;
  private readonly taskUpdatedFeedbackDuration = 900;
  private readonly maxDragTiltDeg = 8;
  private readonly dragTiltMultiplier = 0.65;
  private readonly dragTiltSmoothing = 0.35;
  private readonly dragPreviewSelector = '.board-task-placeholder.cdk-drag-preview';
  private autoScrollFrameId: number | null = null;
  private activeDragPointerX: number | null = null;
  private activeDragPointerY: number | null = null;
  private activeDragTiltDeg = 0;
  private activeDragElement: HTMLElement | null = null;
  private taskUpdatedFeedbackTimeout: ReturnType<typeof setTimeout> | null = null;

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
  readonly addTaskStatus = signal<TaskStatus>('todo');
  readonly isTaskDetailPanelOpen = signal(false);
  readonly isTaskDetailPanelClosing = signal(false);
  readonly isTaskDetailEditActive = signal(false);
  readonly selectedTask = signal<TaskRecord | null>(null);
  readonly taskDetailSubtasks = signal<DialogSubtask[]>([]);
  readonly subtaskCompletionByTaskId = signal<Record<string, boolean[]>>({});
  readonly taskDetailDueDate = signal('2023-05-10');
  readonly editTitle = signal('');
  readonly editDescription = signal('');
  readonly editDueDate = signal('');
  readonly editPriority = signal<'low' | 'medium' | 'urgent'>('medium');
  readonly editAssignedContactIds = signal<string[]>([]);
  readonly editAssignedSearch = signal('');
  readonly isEditAssignedDropdownOpen = signal(false);
  readonly editSubtasks = signal<string[]>([]);
  readonly isTaskDetailEditSubmitted = signal(false);
  readonly isEditDueDateTouched = signal(false);
  readonly minDueDate = this.getTodayIsoDate();
  readonly editSubtaskDraft = signal('');
  readonly editingSubtaskIndex = signal<number | null>(null);
  readonly editingSubtaskValue = signal('');
  readonly isTaskUpdatedFeedbackVisible = signal(false);
  readonly boardSearchQuery = signal('');
  readonly isTaskDragActive = signal(false);
  readonly activeDropListHoverId = signal<string | null>(null);
  readonly touchedTaskDetailEditFields = signal<Record<BoardEditRequiredField, boolean>>({
    title: false,
    dueDate: false,
  });

  readonly assignableContacts = signal<AssignableContact[]>([]);

  readonly filteredTasks = computed(() => {
    const query = this.normalizeSearchValue(this.boardSearchQuery());
    const tasks = this.tasks();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => this.doesTaskMatchSearch(task, query));
  });

  readonly selectedAssignedContacts = computed(() => {
    const selectedIds = this.editAssignedContactIds();
    return this.assignableContacts().filter((contact) => selectedIds.includes(contact.id));
  });

  readonly filteredAssignableContacts = computed(() => {
    const query = this.editAssignedSearch().trim().toLowerCase();
    const contacts = this.assignableContacts();

    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => contact.name.toLowerCase().includes(query));
  });

  async ngOnInit(): Promise<void> {
    try {
      const records = await this.contactService.list();
      this.assignableContacts.set(records.map((record) => this.toAssignableContact(record)));
    } catch (error) {
      console.error('Failed to load contacts for board task editing', error);
    }
  }

  ngOnDestroy(): void {
    this.clearTaskUpdatedFeedbackTimeout();
  }

  tasksForColumn(status: TaskStatus): TaskRecord[] {
    return this.filteredTasks().filter((task) => task.status === status);
  }

  updateBoardSearchQuery(value: string): void {
    this.boardSearchQuery.set(value);
  }

  hasBoardSearchQuery(): boolean {
    return this.boardSearchQuery().trim().length > 0;
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

  getCategoryColor(category: string): string {
    if (category === 'Technical Task') {
      return '#1DD7C1';
    }

    if (category === 'User Story') {
      return '#2338FF';
    }

    return '#2338FF';
  }

  getSubtaskSummary(task: TaskRecord): string {
    const completedCount = this.getCompletedSubtaskCount(task);
    return `${completedCount}/${task.subtasks.length} Subtasks`;
  }

  getSubtaskProgress(task: TaskRecord): number {
    if (task.subtasks.length === 0) {
      return 0;
    }

    return (this.getCompletedSubtaskCount(task) / task.subtasks.length) * 100;
  }

  openAddTaskDialog(status: TaskStatus = 'todo'): void {
    this.resetTaskDetailPanelState();
    this.addTaskStatus.set(status);
    this.isAddTaskDialogOpen.set(true);
  }

  closeAddTaskDialog(): void {
    this.isAddTaskDialogOpen.set(false);
  }

  openTaskDetailPanel(task: TaskRecord): void {
    this.closeAddTaskDialog();
    const completionState = this.getTaskSubtaskCompletion(task);
    this.selectedTask.set(task);
    this.isTaskDetailEditActive.set(false);
    this.taskDetailSubtasks.set(
      task.subtasks.map((title, index) => ({
        title,
        completed: completionState[index] ?? false,
      })),
    );
    this.taskDetailDueDate.set(task.dueDate);
    this.isTaskDetailPanelClosing.set(false);
    this.isTaskDetailPanelOpen.set(true);
  }

  dropTask(event: CdkDragDrop<TaskRecord[]>): void {
    const movedTask = event.item.data;
    const targetStatus = this.statusFromDropListId(event.container.id);

    this.activeDropListHoverId.set(null);
    this.isTaskDragActive.set(false);

    if (!movedTask || !targetStatus) {
      return;
    }

    this.taskService.moveTask(movedTask.id, targetStatus, event.currentIndex);
  }

  onTaskDragMoved(event: CdkDragMove<TaskRecord>): void {
    if (typeof window === 'undefined') {
      return;
    }

    const pointerX = event.pointerPosition.x;
    if (this.activeDragPointerX !== null) {
      const pointerDeltaX = pointerX - this.activeDragPointerX;
      const targetTiltDeg = this.clamp(
        pointerDeltaX * this.dragTiltMultiplier,
        -this.maxDragTiltDeg,
        this.maxDragTiltDeg,
      );

      this.activeDragTiltDeg += (targetTiltDeg - this.activeDragTiltDeg) * this.dragTiltSmoothing;
      this.applyDragTilt(this.activeDragTiltDeg);
    }

    this.activeDragPointerX = pointerX;
    this.activeDragPointerY = event.pointerPosition.y;
  }

  onTaskDragStarted(event: CdkDragStart<TaskRecord>): void {
    this.activeDragElement = event.source.element.nativeElement;
    this.isTaskDragActive.set(true);
    this.activeDropListHoverId.set(null);
    this.activeDragPointerX = null;
    this.activeDragTiltDeg = 0;
    this.applyDragTilt(0);
    this.startAutoScrollLoop();
  }

  onTaskDragEnded(_event: CdkDragEnd<TaskRecord>): void {
    this.stopAutoScrollLoop();
    this.applyDragTilt(0);
    this.activeDropListHoverId.set(null);
    this.isTaskDragActive.set(false);
    this.activeDragPointerX = null;
    this.activeDragPointerY = null;
    this.activeDragTiltDeg = 0;
    this.activeDragElement = null;
  }

  onDropListEntered(dropListId: string): void {
    if (!this.isTaskDragActive()) {
      return;
    }

    this.activeDropListHoverId.set(dropListId);
  }

  onDropListExited(dropListId: string): void {
    if (this.activeDropListHoverId() !== dropListId) {
      return;
    }

    this.activeDropListHoverId.set(null);
  }

  isDropListHighlighted(status: TaskStatus): boolean {
    return this.isTaskDragActive() && this.activeDropListHoverId() === this.dropListId(status);
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

  private applyDragTilt(tiltDeg: number): void {
    if (typeof document === 'undefined') {
      return;
    }

    const tiltValue = `${tiltDeg.toFixed(2)}deg`;

    this.activeDragElement?.style.setProperty('--board-drag-tilt', tiltValue);
    this.getActiveDragPreviewElement()?.style.setProperty('--board-drag-tilt', tiltValue);
  }

  private getActiveDragPreviewElement(): HTMLElement | null {
    return document.querySelector<HTMLElement>(this.dragPreviewSelector);
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  beginTaskDetailEdit(): void {
    const task = this.selectedTask();
    if (!task) {
      return;
    }

    this.mergeAssignableContactsFromTask(task);
    this.editTitle.set(task.title);
    this.editDescription.set(task.description);
    this.editDueDate.set(this.taskDetailDueDate());
    this.editPriority.set(task.priority);
    this.editAssignedContactIds.set(task.assignees.map((assignee) => assignee.id));
    this.editAssignedSearch.set('');
    this.isEditAssignedDropdownOpen.set(false);
    this.editSubtasks.set(this.taskDetailSubtasks().map((subtask) => subtask.title));
    this.isTaskDetailEditSubmitted.set(false);
    this.isEditDueDateTouched.set(false);
    this.editSubtaskDraft.set('');
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskValue.set('');
    this.isTaskUpdatedFeedbackVisible.set(false);
    this.isTaskDetailEditSubmitted.set(false);
    this.touchedTaskDetailEditFields.set({ title: false, dueDate: false });
    this.isTaskDetailEditActive.set(true);
  }

  saveTaskDetailEdits(): void {
    if (this.isTaskUpdatedFeedbackVisible()) {
      return;
    }

    const currentTask = this.selectedTask();
    if (!currentTask) {
      return;
    }

    this.isTaskDetailEditSubmitted.set(true);

    if (!this.isEditDueDateValid()) {
      this.markAllTaskDetailEditFieldsTouched();
      return;
    }

    this.markAllTaskDetailEditFieldsTouched();

    if (!this.isTaskDetailEditFormValid()) {
      return;
    }

    const normalizedSubtasks = this.editSubtasks()
      .map((title) => title.trim())
      .filter((title) => title.length > 0);

    const updatedTask = this.taskService.updateTask(currentTask.id, {
      title: this.editTitle().trim(),
      description: this.editDescription().trim() || currentTask.description,
      dueDate: this.editDueDate(),
      priority: this.editPriority(),
      assignees: this.selectedAssignedContacts(),
      subtasks: normalizedSubtasks,
    });

    if (updatedTask) {
      const currentCompletionState = this.getTaskSubtaskCompletion(currentTask);
      const resizedCompletionState = normalizedSubtasks.map(
        (_subtask, index) => currentCompletionState[index] ?? false,
      );

      this.subtaskCompletionByTaskId.update((state) => ({
        ...state,
        [updatedTask.id]: resizedCompletionState,
      }));

      this.selectedTask.set(updatedTask);
      this.taskDetailDueDate.set(updatedTask.dueDate);
      this.taskDetailSubtasks.set(
        updatedTask.subtasks.map((title, index) => ({
          title,
          completed: resizedCompletionState[index] ?? false,
        })),
      );
    }

    this.isTaskDetailEditSubmitted.set(false);
    this.isEditDueDateTouched.set(false);
    this.isTaskDetailEditActive.set(false);
    this.editingSubtaskIndex.set(null);
    this.editingSubtaskValue.set('');
    this.showTaskUpdatedFeedback();
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

  markTaskDetailEditTouched(field: BoardEditRequiredField): void {
    this.touchedTaskDetailEditFields.update((fields) => ({
      ...fields,
      [field]: true,
    }));
  }

  isTaskDetailEditFieldInvalid(field: BoardEditRequiredField): boolean {
    return this.shouldShowTaskDetailEditFeedback(field) && !this.hasTaskDetailEditRequiredValue(field);
  }

  addAssignedContact(contactId: string): void {
    if (!contactId) {
      return;
    }

    this.editAssignedContactIds.update((ids) =>
      ids.includes(contactId) ? ids : [...ids, contactId],
    );
  }

  openEditDueDatePicker(input: HTMLInputElement): void {
    const dateInput = input as HTMLInputElement & { showPicker?: () => void };

    dateInput.focus();
    dateInput.showPicker?.();
  }

  openEditAssignedDropdown(): void {
    this.isEditAssignedDropdownOpen.set(true);
  }

  toggleEditAssignedDropdown(event: Event): void {
    event.stopPropagation();
    this.isEditAssignedDropdownOpen.update((isOpen) => !isOpen);
  }

  keepEditAssignedDropdownOpen(event: Event): void {
    event.stopPropagation();
  }

  closeEditAssignedDropdown(): void {
    this.isEditAssignedDropdownOpen.set(false);
  }

  updateEditAssignedSearch(value: string): void {
    this.editAssignedSearch.set(value);
    this.openEditAssignedDropdown();
  }

  toggleEditAssignedContact(contactId: string): void {
    this.editAssignedContactIds.update((ids) =>
      ids.includes(contactId) ? ids.filter((id) => id !== contactId) : [...ids, contactId],
    );
  }

  isEditContactAssigned(contactId: string): boolean {
    return this.editAssignedContactIds().includes(contactId);
  }

  addEditSubtask(subtaskTitle: string): void {
    const normalized = subtaskTitle.trim();
    if (!normalized) {
      return;
    }

    this.editSubtasks.update((subtasks) => [...subtasks, normalized]);
    this.editSubtaskDraft.set('');
  }

  clearEditSubtaskDraft(): void {
    this.editSubtaskDraft.set('');
  }

  startEditingSubtask(index: number): void {
    const subtask = this.editSubtasks()[index];
    if (subtask === undefined) {
      return;
    }

    this.editingSubtaskIndex.set(index);
    this.editingSubtaskValue.set(subtask);
  }

  saveEditingSubtask(): void {
    const index = this.editingSubtaskIndex();
    const normalized = this.editingSubtaskValue().trim();

    if (index === null) {
      return;
    }

    if (!normalized) {
      this.removeEditSubtask(index);
      return;
    }

    this.editSubtasks.update((subtasks) =>
      subtasks.map((subtask, currentIndex) => (currentIndex === index ? normalized : subtask)),
    );

    this.editingSubtaskIndex.set(null);
    this.editingSubtaskValue.set('');
  }

  removeEditSubtask(index: number): void {
    this.editSubtasks.update((subtasks) => subtasks.filter((_subtask, currentIndex) => currentIndex !== index));

    if (this.editingSubtaskIndex() === index) {
      this.editingSubtaskIndex.set(null);
      this.editingSubtaskValue.set('');
    }
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

    const task = this.selectedTask();
    if (!task) {
      return;
    }

    const completionState = this.taskDetailSubtasks().map((subtask) => subtask.completed);
    this.subtaskCompletionByTaskId.update((state) => ({
      ...state,
      [task.id]: completionState,
    }));
  }

  deleteSelectedTask(): void {
    const task = this.selectedTask();

    if (!task) {
      return;
    }

    this.taskService.deleteTask(task.id);
    this.subtaskCompletionByTaskId.update((state) => {
      const { [task.id]: _deletedTaskState, ...remainingState } = state;
      return remainingState;
    });
    this.closeTaskDetailPanel();
  }

  closeTaskDetailPanel(): void {
    if (!this.isTaskDetailPanelOpen()) {
      return;
    }

    this.isTaskDetailEditActive.set(false);
    this.isEditAssignedDropdownOpen.set(false);
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
    this.isEditAssignedDropdownOpen.set(false);
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

  private showTaskUpdatedFeedback(): void {
    this.clearTaskUpdatedFeedbackTimeout();
    this.isTaskUpdatedFeedbackVisible.set(true);
    this.isEditAssignedDropdownOpen.set(false);

    this.taskUpdatedFeedbackTimeout = setTimeout(() => {
      this.taskUpdatedFeedbackTimeout = null;
      this.isTaskUpdatedFeedbackVisible.set(false);
      this.isTaskDetailEditSubmitted.set(false);
      this.touchedTaskDetailEditFields.set({ title: false, dueDate: false });
      this.isTaskDetailEditActive.set(false);
    }, this.taskUpdatedFeedbackDuration);
  }

  private isTaskDetailEditFormValid(): boolean {
    return this.hasTaskDetailEditRequiredValue('title') && this.hasTaskDetailEditRequiredValue('dueDate');
  }

  private markAllTaskDetailEditFieldsTouched(): void {
    this.touchedTaskDetailEditFields.set({ title: true, dueDate: true });
  }

  private shouldShowTaskDetailEditFeedback(field: BoardEditRequiredField): boolean {
    return this.isTaskDetailEditSubmitted() || this.touchedTaskDetailEditFields()[field];
  }

  private hasTaskDetailEditRequiredValue(field: BoardEditRequiredField): boolean {
    if (field === 'title') {
      return this.editTitle().trim().length > 0;
    }

    return this.editDueDate().trim().length > 0;
  }

  private clearTaskUpdatedFeedbackTimeout(): void {
    if (this.taskUpdatedFeedbackTimeout) {
      clearTimeout(this.taskUpdatedFeedbackTimeout);
      this.taskUpdatedFeedbackTimeout = null;
    }
  }

  private mergeAssignableContactsFromTask(task: TaskRecord): void {
    this.assignableContacts.update((contacts) => {
      const knownIds = new Set(contacts.map((contact) => contact.id));
      const missingContacts = task.assignees.filter((assignee) => !knownIds.has(assignee.id));

      if (!missingContacts.length) {
        return contacts;
      }

      return [
        ...contacts,
        ...missingContacts.map((assignee) => ({
          id: assignee.id,
          name: assignee.name,
          initials: assignee.initials,
          color: assignee.color,
        })),
      ];
    });
  }

  private toAssignableContact(record: ContactRecord): AssignableContact {
    const name = [record.first_name, record.last_name].filter(Boolean).join(' ').trim();

    return {
      id: record.id,
      name,
      initials: this.getInitials(name),
      color: this.getAvatarColor(record.id),
    };
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private getAvatarColor(seed: string): string {
    const colors = ['#ff7a00', '#9327ff', '#6e52ff', '#fc71ff', '#ffbb2b', '#1fd7c1', '#462f8a', '#ff4646'];
    let hash = 0;

    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) | 0;
    }

    return colors[Math.abs(hash) % colors.length];
  }

  private getCompletedSubtaskCount(task: TaskRecord): number {
    const completionState = this.getTaskSubtaskCompletion(task);
    return completionState.filter((isCompleted) => isCompleted).length;
  }

  private getTaskSubtaskCompletion(task: TaskRecord): boolean[] {
    const existingState = this.subtaskCompletionByTaskId()[task.id];

    if (!existingState) {
      return task.subtasks.map(() => false);
    }

    return task.subtasks.map((_subtask, index) => existingState[index] ?? false);
  }

  private doesTaskMatchSearch(task: TaskRecord, query: string): boolean {
    const searchableValues = [
      task.title,
      task.description,
      task.category,
      task.dueDate,
      task.priority,
      ...task.subtasks,
      ...task.assignees.flatMap((assignee) => [assignee.name, assignee.initials]),
    ];

    return searchableValues.some((value) => this.normalizeSearchValue(value).includes(query));
  }

  private normalizeSearchValue(value: string): string {
    return value.trim().toLowerCase();
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
