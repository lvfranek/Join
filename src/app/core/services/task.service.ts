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

export interface TaskUpdate {
  title?: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assignees?: TaskAssignee[];
  subtasks?: string[];
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly tasksState = signal<TaskRecord[]>([]);
  private readonly statusOrder: TaskStatus[] = ['todo', 'inProgress', 'awaitFeedback', 'done'];

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
          subtasks: update.subtasks ? [...update.subtasks] : task.subtasks,
        };

        return updatedTask;
      }),
    );

    return updatedTask;
  }

  moveTask(taskId: string, targetStatus: TaskStatus, targetIndex: number): void {
    this.tasksState.update((tasks) => {
      const taskToMove = tasks.find((task) => task.id === taskId);
      if (!taskToMove) {
        return tasks;
      }

      const sourceStatus = taskToMove.status;
      const sourceTasks = tasks.filter((task) => task.status === sourceStatus && task.id !== taskId);
      const targetTasks = tasks.filter((task) => task.status === targetStatus && task.id !== taskId);

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
  }
}
