import { Injectable, computed, inject, signal } from '@angular/core';

import { SupabaseService } from './supabase.service';

export interface ContactRecord {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
}

export interface ContactInput {
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly supabase = inject(SupabaseService);
  private readonly table = 'contacts';
  private readonly columns = 'id, first_name, last_name, email, phone';

  private readonly contactsState = signal<ContactRecord[]>([]);
  private readonly loadedState = signal(false);
  private inflight: Promise<ContactRecord[]> | null = null;

  readonly contacts = this.contactsState.asReadonly();
  readonly isLoaded = computed(() => this.loadedState());

  async list(forceReload = false): Promise<ContactRecord[]> {
    if (!forceReload && this.loadedState()) {
      return this.contactsState();
    }

    if (this.inflight) {
      return this.inflight;
    }

    this.inflight = (async () => {
      try {
        const { data, error } = await this.supabase.client
          .from(this.table)
          .select(this.columns)
          .order('first_name', { ascending: true });

        if (error) throw error;
        const records = (data ?? []) as ContactRecord[];
        this.contactsState.set(records);
        this.loadedState.set(true);
        return records;
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }

  async create(contact: ContactInput): Promise<ContactRecord> {
    const { data: userResult } = await this.supabase.client.auth.getUser();
    const createdBy = userResult.user?.id ?? null;

    const { data, error } = await this.supabase.client
      .from(this.table)
      .insert({ ...contact, created_by: createdBy })
      .select(this.columns)
      .single();

    if (error) throw error;
    const record = data as ContactRecord;
    this.contactsState.update((list) =>
      [...list, record].sort((a, b) => a.first_name.localeCompare(b.first_name)),
    );
    return record;
  }

  async update(id: string, patch: Partial<ContactInput>): Promise<ContactRecord> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .update(patch)
      .eq('id', id)
      .select(this.columns)
      .single();

    if (error) throw error;
    const record = data as ContactRecord;
    this.contactsState.update((list) =>
      list
        .map((entry) => (entry.id === id ? record : entry))
        .sort((a, b) => a.first_name.localeCompare(b.first_name)),
    );
    return record;
  }

  async remove(id: string): Promise<void> {
    const { data, error } = await this.supabase.client
      .from(this.table)
      .delete()
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data || data.length === 0) {
      throw new Error(
        `Contact ${id} could not be deleted. Likely missing RLS DELETE policy or the row no longer exists.`,
      );
    }
    this.contactsState.update((list) => list.filter((entry) => entry.id !== id));
  }

  invalidate(): void {
    this.loadedState.set(false);
    this.contactsState.set([]);
  }
}
