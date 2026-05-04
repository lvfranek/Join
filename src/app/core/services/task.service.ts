import { Injectable, signal } from '@angular/core';

export type TaskPriority = 'urgent' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'inProgress' | 'awaitFeedback' | 'done';

export interface TaskAssignee {
  id: string;
  name: string;
  initials: string;
  color: string;
}

export interface TaskRecord {
  id: string;
  status: TaskStatus;
  category: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  assignees: TaskAssignee[];
  subtasks: string[];
}

export interface TaskInput {
  status?: TaskStatus;
  category: string;
  title: string;
  description: string;
  dueDate: string;
  priority: TaskPriority;
  assignees: TaskAssignee[];
  subtasks: string[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly tasksState = signal<TaskRecord[]>([]);

  readonly tasks = this.tasksState.asReadonly();

  createTask(input: TaskInput): TaskRecord {
    const task: TaskRecord = {
      ...input,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      status: input.status ?? 'todo',
    };

    this.tasksState.update((tasks) => [...tasks, task]);
    return task;
  }
}
