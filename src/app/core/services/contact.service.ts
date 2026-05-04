import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
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

const GUEST_SEED: ContactRecord[] = [
  {
    id: 'guest-1',
    first_name: 'Bruce',
    last_name: 'Wayne',
    email: 'definitely.not.batman@wayne-enterprises.com',
    phone: '+49 151 00000001',
  },
  {
    id: 'guest-2',
    first_name: 'Tony',
    last_name: 'Stark',
    email: 'iam@ironman.com',
    phone: '+49 160 31415926',
  },
  {
    id: 'guest-3',
    first_name: 'Hermione',
    last_name: 'Granger',
    email: 'hermione@hogwarts.edu',
    phone: '+49 176 90909090',
  },
  {
    id: 'guest-4',
    first_name: 'Walter',
    last_name: 'White',
    email: 'heisenberg@chemistry.com',
    phone: '+49 157 50550505',
  },
  {
    id: 'guest-5',
    first_name: 'Leslie',
    last_name: 'Knope',
    email: 'leslie.knope@pawnee.gov',
    phone: '+49 152 42424242',
  },
  {
    id: 'guest-6',
    first_name: 'Sherlock',
    last_name: 'Holmes',
    email: 'sherlock@221b.co.uk',
    phone: '+49 159 22122122',
  },
  {
    id: 'guest-7',
    first_name: 'Lara',
    last_name: 'Croft',
    email: 'lara@tombraider.com',
    phone: '+49 163 19961996',
  },
  {
    id: 'guest-8',
    first_name: 'Princess',
    last_name: 'Leia',
    email: 'leia@rebellion.org',
    phone: '+49 173 49774977',
  },
];

@Injectable({ providedIn: 'root' })
export class ContactService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly table = 'contacts';
  private readonly columns = 'id, first_name, last_name, email, phone';

  private readonly contactsState = signal<ContactRecord[]>([]);
  private readonly loadedState = signal(false);
  private inflight: Promise<ContactRecord[]> | null = null;

  readonly contacts = this.contactsState.asReadonly();
  readonly isLoaded = computed(() => this.loadedState());

  async list(forceReload = false): Promise<ContactRecord[]> {
    if (this.auth.isGuest()) {
      if (!this.loadedState()) {
        this.contactsState.set([...GUEST_SEED]);
        this.loadedState.set(true);
      }
      return this.contactsState();
    }

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
    if (this.auth.isGuest()) {
      const record: ContactRecord = { id: this.generateLocalId(), ...contact };
      this.contactsState.update((list) =>
        [...list, record].sort((a, b) => a.first_name.localeCompare(b.first_name)),
      );
      return record;
    }

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
    if (this.auth.isGuest()) {
      let updated: ContactRecord | null = null;
      this.contactsState.update((list) =>
        list
          .map((entry) => {
            if (entry.id !== id) return entry;
            updated = { ...entry, ...patch };
            return updated;
          })
          .sort((a, b) => a.first_name.localeCompare(b.first_name)),
      );
      if (!updated) throw new Error('Contact not found');
      return updated;
    }

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
    if (this.auth.isGuest()) {
      this.contactsState.update((list) => list.filter((entry) => entry.id !== id));
      return;
    }

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

  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
