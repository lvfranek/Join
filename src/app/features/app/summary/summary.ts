import { Component, OnInit, computed, inject } from '@angular/core';
import { UserGreetingService } from '../../../core/services/user-greeting.service';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  protected readonly greeting = inject(UserGreetingService);
  private readonly taskService = inject(TaskService);

  protected readonly todoCount = computed(
    () => this.taskService.tasks().filter((t) => t.status === 'todo').length,
  );
  protected readonly doneCount = computed(
    () => this.taskService.tasks().filter((t) => t.status === 'done').length,
  );
  protected readonly urgentCount = computed(
    () => this.taskService.tasks().filter((t) => t.priority === 'urgent').length,
  );
  protected readonly totalCount = computed(() => this.taskService.tasks().length);
  protected readonly inProgressCount = computed(
    () => this.taskService.tasks().filter((t) => t.status === 'inProgress').length,
  );
  protected readonly feedbackCount = computed(
    () => this.taskService.tasks().filter((t) => t.status === 'awaitFeedback').length,
  );

  protected readonly upcomingDeadline = computed(() => {
    const urgentDates = this.taskService
      .tasks()
      .filter((t) => t.priority === 'urgent' && t.dueDate)
      .map((t) => t.dueDate)
      .sort();
    return urgentDates[0] ?? null;
  });

  async ngOnInit(): Promise<void> {
    await Promise.all([this.greeting.loadUserName(), this.taskService.list()]);
  }
}
