import { Injectable, computed, inject, signal } from '@angular/core';

import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

export interface ContactRecord {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  phone: string;
  isSelf?: boolean;
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

  /** Synthetic contact representing the currently authenticated user. */
  private readonly selfContact = computed<ContactRecord | null>(() => {
    const user = this.auth.currentUser();
    if (!user) return null;
    const parts = (user.name || user.email).trim().split(/\s+/).filter(Boolean);
    const [first, ...rest] = parts;
    return {
      id: `self:${user.id}`,
      first_name: first || user.email,
      last_name: rest.length ? rest.join(' ') : null,
      email: user.email,
      phone: user.phone ?? '',
      isSelf: true,
    };
  });

  /** Combined list: persisted contacts + self-contact (sorted alphabetically). */
  readonly contacts = computed<ContactRecord[]>(() => {
    const list = this.contactsState();
    const self = this.selfContact();
    const combined = self ? [self, ...list] : list;
    return [...combined].sort((a, b) => a.first_name.localeCompare(b.first_name));
  });
  readonly isLoaded = computed(() => this.loadedState());

  constructor() {
    this.auth.onLogout(() => this.invalidate());
  }

  async list(forceReload = false): Promise<ContactRecord[]> {
    if (this.auth.isGuest()) {
      if (!this.loadedState()) {
        this.contactsState.set([...GUEST_SEED]);
        this.loadedState.set(true);
      }
      return this.contacts();
    }

    if (!forceReload && this.loadedState()) {
      return this.contacts();
    }

    if (this.inflight) {
      await this.inflight;
      return this.contacts();
    }

    this.inflight = (async () => {
      try {
        const { data, error } = await this.supabase.client
          .from(this.table)
          .select(this.columns)
          .order('first_name', { ascending: true });

        if (error) throw error;
        let records = (data ?? []) as ContactRecord[];

        // Seed initial demo contacts on first login so registered users
        // see the same starter data as guests do.
        if (records.length === 0) {
          records = await this.seedInitialContacts();
        }

        this.contactsState.set(records);
        this.loadedState.set(true);
        return records;
      } finally {
        this.inflight = null;
      }
    })();

    await this.inflight;
    return this.contacts();
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
    if (id.startsWith('self:')) {
      return this.updateSelf(patch);
    }

    if (this.auth.isGuest()) {
      let updated: ContactRecord | null = null;
      this.contactsState.update((list) =>
        list.map((entry) => {
          if (entry.id !== id) return entry;
          updated = { ...entry, ...patch };
          return updated;
        }),
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
    this.contactsState.update((list) => list.map((entry) => (entry.id === id ? record : entry)));
    return record;
  }

  async remove(id: string): Promise<void> {
    if (id.startsWith('self:')) {
      throw new Error('You cannot delete your own account from the contacts list.');
    }

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

  private async updateSelf(patch: Partial<ContactInput>): Promise<ContactRecord> {
    const current = this.auth.currentUser();
    if (!current) {
      throw new Error('No authenticated user');
    }

    const newFirst = patch.first_name ?? '';
    const newLast = patch.last_name ?? null;
    const fullName =
      [newFirst, newLast].filter(Boolean).join(' ').trim() || patch.first_name || current.name;

    this.auth.updateCurrentUser({
      name: fullName,
      email: patch.email ?? current.email,
      phone: patch.phone ?? current.phone,
    });

    if (!this.auth.isGuest()) {
      // Best-effort persistence: update Supabase auth metadata + users table.
      try {
        await this.supabase.client.auth.updateUser({
          data: { full_name: fullName, phone: patch.phone ?? current.phone },
          ...(patch.email && patch.email !== current.email ? { email: patch.email } : {}),
        });
        await this.supabase.client
          .from('users')
          .update({
            full_name: fullName,
            email: patch.email ?? current.email,
          })
          .eq('id', current.id);
      } catch (err) {
        console.warn('Profile update could not be persisted', err);
      }
    }

    return this.selfContact()!;
  }

  private async seedInitialContacts(): Promise<ContactRecord[]> {
    try {
      const { data: userResult } = await this.supabase.client.auth.getUser();
      const createdBy = userResult.user?.id ?? null;
      const seedPayload = GUEST_SEED.map(({ id: _omit, ...rest }) => ({
        ...rest,
        created_by: createdBy,
      }));
      const { data, error } = await this.supabase.client
        .from(this.table)
        .insert(seedPayload)
        .select(this.columns);
      if (error) throw error;
      return (data ?? []) as ContactRecord[];
    } catch (err) {
      console.warn('Could not seed initial contacts', err);
      return [...GUEST_SEED];
    }
  }

  private generateLocalId(): string {
    return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}
