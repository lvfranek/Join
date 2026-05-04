import { Injectable, computed, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class UserGreetingService {
  private readonly supabase = inject(SupabaseService);
  private readonly displayName = signal('Guest');

  readonly userName = this.displayName.asReadonly();
  readonly greetingText = computed(() => this.resolveGreetingText(new Date()));

  async loadUserName(): Promise<void> {
    const { data } = await this.supabase.client.auth.getUser();
    const user = data.user;

    if (!user) {
      this.displayName.set('Guest');
      return;
    }

    const metadata = user.user_metadata ?? {};
    const metadataName =
      this.asNonEmptyString(metadata['full_name']) ??
      this.asNonEmptyString(metadata['name']) ??
      this.asNonEmptyString(metadata['display_name']);
    const emailName = this.extractNameFromEmail(user.email);

    this.displayName.set(metadataName ?? emailName ?? 'Guest');
  }

  private resolveGreetingText(date: Date): string {
    const hour = date.getHours();

    if (hour < 12) return 'Good morning,';
    if (hour < 18) return 'Good afternoon,';
    return 'Good evening,';
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
