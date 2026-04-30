import { Component, OnInit, inject } from '@angular/core';

import { UserGreetingService } from '../../../core/services/user-greeting.service';

@Component({
  selector: 'app-summary',
  imports: [],
  templateUrl: './summary.html',
  styleUrl: './summary.scss',
})
export class Summary implements OnInit {
  protected readonly greeting = inject(UserGreetingService);

  async ngOnInit(): Promise<void> {
    await this.greeting.loadUserName();
  }
}
