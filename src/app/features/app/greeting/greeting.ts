import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-greeting',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './greeting.html',
  styleUrl: './greeting.scss',
})
export class Greeting implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly supabase = inject(SupabaseService);
  private readonly timers: number[] = [];

  protected readonly userName = signal('Guest');
  protected readonly isLeaving = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadUserName();
    this.scheduleSummaryRedirect();
  }

  ngOnDestroy(): void {
    this.timers.forEach((timer) => window.clearTimeout(timer));
  }

  private async loadUserName(): Promise<void> {
    const { data } = await this.supabase.client.auth.getUser();
    const user = data.user;

    if (!user) return;

    const metadata = user.user_metadata ?? {};
    const metadataName =
      this.asNonEmptyString(metadata['full_name']) ??
      this.asNonEmptyString(metadata['name']) ??
      this.asNonEmptyString(metadata['display_name']);
    const emailName = this.extractNameFromEmail(user.email);

    this.userName.set(metadataName ?? emailName ?? 'Guest');
  }

  private scheduleSummaryRedirect(): void {
    this.timers.push(
      window.setTimeout(() => {
        this.isLeaving.set(true);
      }, 2200),
    );

    this.timers.push(
      window.setTimeout(() => {
        void this.router.navigateByUrl('/summary');
      }, 3100),
    );
  }

  private asNonEmptyString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private extractNameFromEmail(email: string | undefined): string | undefined {
    const [name] = email?.split('@') ?? [];
    if (!name) return undefined;

    return name
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
