import { Component, EventEmitter, HostListener, OnInit, Output, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ContactRecord, ContactService } from '../../../core/services/contact.service';
import { TaskService } from '../../../core/services/task.service';

type RequiredField = 'title' | 'dueDate' | 'category';
type Priority = 'urgent' | 'medium' | 'low';
type AssignedContact = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

@Component({
  selector: 'app-add-task',
  imports: [],
  templateUrl: './add-task.html',
  styleUrl: './add-task.scss',
})
export class AddTask implements OnInit {
  private readonly contactService = inject(ContactService);
  private readonly taskService = inject(TaskService);
  private readonly router = inject(Router);

  @Output() readonly taskCreated = new EventEmitter<void>();

  readonly categories = ['Technical Task', 'User Story'];
  readonly minDueDate = this.getTodayIsoDate();

  task = {
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    category: '',
    subtask: '',
  };

  contacts: AssignedContact[] = [];
  assignedToSearch = '';
  selectedAssignedContactIds: string[] = [];
  subtasks: string[] = [];
  selectedPriority: Priority | null = null;
  editingSubtaskIndex: number | null = null;
  editingSubtaskValue = '';
  isAssignedDropdownOpen = false;
  isCategoryDropdownOpen = false;

  private readonly touchedFields: Record<RequiredField, boolean> = {
    title: false,
    dueDate: false,
    category: false,
  };

  isSubmitted = false;

  async ngOnInit(): Promise<void> {
    try {
      const records = await this.contactService.list();
      this.contacts = records.map((record) => this.toAssignedContact(record));
    } catch (error) {
      console.error('Failed to load contacts for add task', error);
    }
  }

  updateField(field: keyof typeof this.task, value: string): void {
    this.task[field] = value;
  }

  openDueDatePicker(input: HTMLInputElement): void {
    const dateInput = input as HTMLInputElement & { showPicker?: () => void };

    dateInput.focus();
    dateInput.showPicker?.();
  }

  markTouched(field: RequiredField): void {
    this.touchedFields[field] = true;
  }

  isFieldInvalid(field: RequiredField): boolean {
    return this.shouldShowFeedback(field) && !this.hasRequiredValue(field);
  }

  isFieldValid(field: RequiredField): boolean {
    return this.shouldShowFeedback(field) && this.hasRequiredValue(field);
  }

  getFieldError(field: RequiredField): string {
    if (!this.shouldShowFeedback(field)) {
      return '';
    }

    if (!this.task[field].trim()) {
      return 'This field is required';
    }

    if (field === 'dueDate') {
      if (!this.hasFourDigitYear(this.task.dueDate)) {
        return 'Use a 4-digit year';
      }

      if (this.isDateInPast(this.task.dueDate)) {
        return 'Date cannot be in the past';
      }
    }

    return '';
  }

  createTask(): void {
    this.isSubmitted = true;
    this.markAllRequiredFieldsTouched();

    if (!this.isFormValid()) {
      return;
    }

    this.taskService.createTask({
      title: this.task.title.trim(),
      description: this.task.description.trim(),
      dueDate: this.task.dueDate.trim(),
      category: this.task.category.trim(),
      priority: this.selectedPriority ?? 'medium',
      assignees: this.selectedAssignedContacts,
      subtasks: [...this.subtasks],
    });

    this.clearTask();
    this.taskCreated.emit();

    if (this.router.url === '/add-task') {
      void this.router.navigateByUrl('/board');
    }
  }

  clearTask(): void {
    this.task = {
      title: '',
      description: '',
      dueDate: '',
      assignedTo: '',
      category: '',
      subtask: '',
    };
    this.assignedToSearch = '';
    this.selectedAssignedContactIds = [];
    this.subtasks = [];
    this.selectedPriority = null;
    this.editingSubtaskIndex = null;
    this.editingSubtaskValue = '';
    this.isAssignedDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
    this.isSubmitted = false;
    this.touchedFields.title = false;
    this.touchedFields.dueDate = false;
    this.touchedFields.category = false;
  }

  get filteredContacts(): AssignedContact[] {
    const query = this.assignedToSearch.trim().toLowerCase();

    if (!query) {
      return this.contacts;
    }

    return this.contacts.filter((contact) => contact.name.toLowerCase().includes(query));
  }

  get selectedAssignedContacts(): AssignedContact[] {
    return this.selectedAssignedContactIds
      .map((id) => this.contacts.find((contact) => contact.id === id))
      .filter((contact): contact is AssignedContact => Boolean(contact));
  }

  openAssignedDropdown(): void {
    this.isAssignedDropdownOpen = true;
  }

  toggleAssignedDropdown(event: Event): void {
    event.stopPropagation();
    this.isAssignedDropdownOpen = !this.isAssignedDropdownOpen;
  }

  keepAssignedDropdownOpen(event: Event): void {
    event.stopPropagation();
  }

  updateAssignedSearch(value: string): void {
    this.assignedToSearch = value;
    this.openAssignedDropdown();
  }

  toggleAssignedContact(contactId: string): void {
    if (this.isContactAssigned(contactId)) {
      this.selectedAssignedContactIds = this.selectedAssignedContactIds.filter((id) => id !== contactId);
      return;
    }

    this.selectedAssignedContactIds = [...this.selectedAssignedContactIds, contactId];
  }

  isContactAssigned(contactId: string): boolean {
    return this.selectedAssignedContactIds.includes(contactId);
  }

  selectPriority(priority: Priority): void {
    this.selectedPriority = priority;
  }

  addSubtask(): void {
    const subtask = this.task.subtask.trim();

    if (!subtask) {
      return;
    }

    this.subtasks = [...this.subtasks, subtask];
    this.updateField('subtask', '');
  }

  clearSubtaskInput(): void {
    this.updateField('subtask', '');
  }

  removeSubtask(index: number): void {
    this.subtasks = this.subtasks.filter((_, currentIndex) => currentIndex !== index);
    if (this.editingSubtaskIndex === index) {
      this.cancelEditSubtask();
    }
  }

  startEditSubtask(index: number): void {
    this.editingSubtaskIndex = index;
    this.editingSubtaskValue = this.subtasks[index] ?? '';
  }

  updateEditingSubtask(value: string): void {
    this.editingSubtaskValue = value;
  }

  saveEditedSubtask(): void {
    const index = this.editingSubtaskIndex;
    const value = this.editingSubtaskValue.trim();

    if (index === null || !value) {
      return;
    }

    this.subtasks = this.subtasks.map((subtask, currentIndex) => currentIndex === index ? value : subtask);
    this.cancelEditSubtask();
  }

  cancelEditSubtask(): void {
    this.editingSubtaskIndex = null;
    this.editingSubtaskValue = '';
  }

  toggleCategoryDropdown(event: Event): void {
    event.stopPropagation();
    this.isCategoryDropdownOpen = !this.isCategoryDropdownOpen;
    this.markTouched('category');
  }

  keepCategoryDropdownOpen(event: Event): void {
    event.stopPropagation();
  }

  selectCategory(category: string): void {
    this.updateField('category', category);
    this.markTouched('category');
    this.isCategoryDropdownOpen = false;
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.isAssignedDropdownOpen = false;
    this.isCategoryDropdownOpen = false;
  }

  private shouldShowFeedback(field: RequiredField): boolean {
    return this.isSubmitted || this.touchedFields[field];
  }

  private hasRequiredValue(field: RequiredField): boolean {
    if (field === 'dueDate') {
      return this.isDueDateValid(this.task.dueDate);
    }

    return this.task[field].trim().length > 0;
  }

  private isFormValid(): boolean {
    return this.hasRequiredValue('title') && this.hasRequiredValue('dueDate') && this.hasRequiredValue('category');
  }

  private markAllRequiredFieldsTouched(): void {
    this.touchedFields.title = true;
    this.touchedFields.dueDate = true;
    this.touchedFields.category = true;
  }

  private isDueDateValid(value: string): boolean {
    return value.trim().length > 0 && this.hasFourDigitYear(value) && !this.isDateInPast(value);
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

  private toAssignedContact(record: ContactRecord): AssignedContact {
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
}
