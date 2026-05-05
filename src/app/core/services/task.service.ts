import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

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

export interface TaskUpdate {
  status?: TaskStatus;
  category?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assignees?: TaskAssignee[];
  subtasks?: string[];
}

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  priority: string | null;
  due_date?: string | null;
  category?: string | null;
  assignees?: TaskAssignee[] | null;
  subtasks?: string[] | null;
  assigned_to?: string | null;
};

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly table = 'tasks';
  private readonly tasksState = signal<TaskRecord[]>([]);
  private readonly loadedState = signal(false);
  private inflight: Promise<TaskRecord[]> | null = null;
  private readonly statusOrder: TaskStatus[] = ['todo', 'inProgress', 'awaitFeedback', 'done'];

  readonly tasks = this.tasksState.asReadonly();
  readonly isLoaded = computed(() => this.loadedState());

  async list(forceReload = false): Promise<TaskRecord[]> {
    if (this.auth.isGuest() || !this.auth.isAuthenticated()) {
      this.loadedState.set(true);
      return this.tasksState();
    }

    if (!forceReload && this.loadedState()) {
      return this.tasksState();
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = (async () => {
      try {
        const { data, error } = await this.supabase.client
          .from(this.table)
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        const records = ((data ?? []) as TaskRow[]).map((row) => this.fromRow(row));
        this.tasksState.set(records);
        this.loadedState.set(true);
        return records;
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }

  createTask(input: TaskInput): TaskRecord {
    const task: TaskRecord = {
      ...input,
      id: this.generateLocalId(),
      status: input.status ?? 'todo',
    };

    this.tasksState.update((tasks) => [...tasks, task]);

    if (!this.auth.isGuest() && this.auth.isAuthenticated()) {
      void this.persistCreate(task);
    }

    return task;
  }

  updateTask(taskId: string, update: TaskUpdate): TaskRecord | null {
    let updatedTask: TaskRecord | null = null;

    this.tasksState.update((tasks) =>
      tasks.map((task) => {
        if (task.id !== taskId) {
          return task;
        }

        updatedTask = {
          ...task,
          ...update,
          assignees: update.assignees ? [...update.assignees] : task.assignees,
          subtasks: update.subtasks ? [...update.subtasks] : task.subtasks,
        };

        return updatedTask;
      }),
    );

    const taskToPersist = this.tasksState().find((task) => task.id === taskId);
    if (taskToPersist !== undefined && !this.auth.isGuest() && this.auth.isAuthenticated()) {
      void this.persistUpdate(taskToPersist.id, taskToPersist);
    }

    return updatedTask;
  }

  deleteTask(taskId: string): void {
    this.tasksState.update((tasks) => tasks.filter((task) => task.id !== taskId));

    if (!this.auth.isGuest() && this.auth.isAuthenticated()) {
      void this.persistDelete(taskId);
    }
  }

  moveTask(taskId: string, targetStatus: TaskStatus, targetIndex: number): void {
    this.tasksState.update((tasks) => {
      const taskToMove = tasks.find((task) => task.id === taskId);
      if (!taskToMove) {
        return tasks;
      }

      const sourceStatus = taskToMove.status;
      const sourceTasks = tasks.filter(
        (task) => task.status === sourceStatus && task.id !== taskId,
      );
      const targetTasks = tasks.filter(
        (task) => task.status === targetStatus && task.id !== taskId,
      );

      const movedTask: TaskRecord = {
        ...taskToMove,
        status: targetStatus,
      };

      const clampedIndex = Math.max(0, Math.min(targetIndex, targetTasks.length));
      targetTasks.splice(clampedIndex, 0, movedTask);

      const tasksByStatus = {
        todo: [] as TaskRecord[],
        inProgress: [] as TaskRecord[],
        awaitFeedback: [] as TaskRecord[],
        done: [] as TaskRecord[],
      };

      for (const status of this.statusOrder) {
        if (status === sourceStatus && status === targetStatus) {
          tasksByStatus[status] = targetTasks;
        } else if (status === sourceStatus) {
          tasksByStatus[status] = sourceTasks;
        } else if (status === targetStatus) {
          tasksByStatus[status] = targetTasks;
        } else {
          tasksByStatus[status] = tasks.filter((task) => task.status === status);
        }
      }

      return this.statusOrder.flatMap((status) => tasksByStatus[status]);
    });

    if (!this.auth.isGuest() && this.auth.isAuthenticated()) {
      const movedTask = this.tasksState().find((task) => task.id === taskId);
      if (movedTask) {
        void this.persistUpdate(taskId, movedTask);
      }
    }
  }

  invalidate(): void {
    this.loadedState.set(false);
    this.tasksState.set([]);
  }

  private async persistCreate(task: TaskRecord): Promise<void> {
    const { data: userResult } = await this.supabase.client.auth.getUser();
    const userId = userResult.user?.id ?? null;

    const fullPayload = {
      title: task.title,
      description: task.description,
      status: this.toDbStatus(task.status),
      priority: this.toDbPriority(task.priority),
      due_date: this.toDbDate(task.dueDate),
      category: task.category,
      assignees: task.assignees,
      subtasks: task.subtasks,
      assigned_to: task.assignees[0]?.id ?? null,
      created_by: userId,
    };

    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert(fullPayload)
      .select('*')
      .single();

    if (error) {
      if (this.isMissingColumnError(error)) {
        await this.persistLegacyCreate(task, userId);
        return;
      }

      console.error('Failed to persist task creation', error);
      return;
    }

    const persisted = this.fromRow(data as TaskRow);
    this.tasksState.update((tasks) =>
      tasks.map((entry) => (entry.id === task.id ? persisted : entry)),
    );
  }

  private async persistLegacyCreate(task: TaskRecord, userId: string | null): Promise<void> {
    const legacyPayload = {
      title: task.title,
      description: task.description,
      status: this.toDbStatus(task.status),
      priority: this.toDbPriority(task.priority),
      assigned_to: task.assignees[0]?.id ?? null,
      created_by: userId,
    };

    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert(legacyPayload)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to persist task creation (legacy fallback)', error);
      return;
    }

    const persisted = this.fromRow(data as TaskRow);
    this.tasksState.update((tasks) =>
      tasks.map((entry) => (entry.id === task.id ? persisted : entry)),
    );
  }

  private async persistUpdate(taskId: string, task: TaskRecord): Promise<void> {
    const fullPatch = {
      title: task.title,
      description: task.description,
      status: this.toDbStatus(task.status),
      priority: this.toDbPriority(task.priority),
      due_date: this.toDbDate(task.dueDate),
      category: task.category,
      assignees: task.assignees,
      subtasks: task.subtasks,
      assigned_to: task.assignees[0]?.id ?? null,
    };

    const { error } = await this.supabase.client
      .from(this.table)
      .update(fullPatch)
      .eq('id', taskId);

    if (!error) {
      return;
    }

    if (!this.isMissingColumnError(error)) {
      console.error('Failed to persist task update', error);
      return;
    }

    const legacyPatch = {
      title: task.title,
      description: task.description,
      status: this.toDbStatus(task.status),
      priority: this.toDbPriority(task.priority),
      assigned_to: task.assignees[0]?.id ?? null,
    };

    const { error: legacyError } = await this.supabase.client
      .from(this.table)
      .update(legacyPatch)
      .eq('id', taskId);

    if (legacyError) {
      console.error('Failed to persist task update (legacy fallback)', legacyError);
    }
  }

  private async persistDelete(taskId: string): Promise<void> {
    const { error } = await this.supabase.client.from(this.table).delete().eq('id', taskId);

    if (error) {
      console.error('Failed to persist task deletion', error);
    }
  }

  private fromRow(row: TaskRow): TaskRecord {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      status: this.fromDbStatus(row.status),
      priority: this.fromDbPriority(row.priority),
      dueDate: row.due_date ?? '',
      category: row.category ?? 'Technical Task',
      assignees: row.assignees ?? [],
      subtasks: row.subtasks ?? [],
    };
  }

  private toDbStatus(status: TaskStatus): string {
    if (status === 'inProgress') {
      return 'in-progress';
    }

    if (status === 'awaitFeedback') {
      return 'await-feedback';
    }

    return status;
  }

  private fromDbStatus(status: string | null): TaskStatus {
    if (status === 'in-progress' || status === 'inProgress') {
      return 'inProgress';
    }

    if (status === 'await-feedback' || status === 'awaitFeedback') {
      return 'awaitFeedback';
    }

    if (status === 'done') {
      return 'done';
    }

    return 'todo';
  }

  private toDbPriority(priority: TaskPriority): string {
    if (priority === 'urgent') {
      return 'high';
    }

    return priority;
  }

  private fromDbPriority(priority: string | null): TaskPriority {
    if (priority === 'high' || priority === 'urgent') {
      return 'urgent';
    }

    if (priority === 'low') {
      return 'low';
    }

    return 'medium';
  }

  private toDbDate(dateValue: string): string | null {
    const normalized = dateValue.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
  }

  private isMissingColumnError(error: { message?: string }): boolean {
    const message = (error.message ?? '').toLowerCase();
    return message.includes('column') && message.includes('does not exist');
  }

  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
