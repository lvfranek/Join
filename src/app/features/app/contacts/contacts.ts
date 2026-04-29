import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import contactsData from '../../../../dummy-data.json';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  colorClass: string;
};

type DummyContact = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type ContactGroup = {
  letter: string;
  contacts: Contact[];
};

@Component({
  selector: 'app-contacts',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  selectedContact: Contact | null = null;
  isDialogOpen = signal(false);
  isDialogClosing = signal(false);
  isMobileActionsOpen = signal(false);
  dialogMode = signal<'create' | 'edit'>('create');
  editingContactId = signal<string | null>(null);
  isSuccessToastOpen = signal(false);
  isSuccessToastClosing = signal(false);
  newContactName = signal('');
  newContactEmail = signal('');
  newContactPhone = signal('');

  private dialogAnimationDuration = 400;
  private toastVisibleDuration = 2500;
  private toastAnimationDuration = 400;
  private toastHideTimer: ReturnType<typeof setTimeout> | null = null;
  private toastCleanupTimer: ReturnType<typeof setTimeout> | null = null;

  private avatarColorClasses = [
    'avatar--orange',
    'avatar--purple',
    'avatar--violet',
    'avatar--pink',
    'avatar--yellow',
    'avatar--turquoise',
    'avatar--dark-purple',
    'avatar--red',
  ];

  contacts: Contact[] = (contactsData as DummyContact[])
    .map((contact, index) => ({
      ...contact,
      colorClass: this.getAvatarColorClass(index),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  contactGroups: ContactGroup[] = this.groupContacts(this.contacts);

  selectContact(contact: Contact): void {
    this.isMobileActionsOpen.set(false);

    if (this.selectedContact?.id === contact.id) {
      this.selectedContact = null;
      return;
    }

    this.selectedContact = contact;
  }

  closeContactDetail(): void {
    this.selectedContact = null;
    this.isMobileActionsOpen.set(false);
  }

  toggleMobileActions(): void {
    this.isMobileActionsOpen.update((isOpen) => !isOpen);
  }

  getInitials(name: string): string {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  getPhoneHref(phone: string): string {
    return `tel:${phone.replace(/\s/g, '')}`;
  }

  private getAvatarColorClass(index: number): string {
    return this.avatarColorClasses[index % this.avatarColorClasses.length];
  }

  private groupContacts(contacts: Contact[]): ContactGroup[] {
    const groups = contacts.reduce<Record<string, Contact[]>>((result, contact) => {
      const firstLetter = contact.name.charAt(0).toUpperCase();

      if (!result[firstLetter]) {
        result[firstLetter] = [];
      }

      result[firstLetter].push(contact);
      return result;
    }, {});

    return Object.entries(groups).map(([letter, groupedContacts]) => ({
      letter,
      contacts: groupedContacts,
    }));
  }

  openDialog(): void {
    this.dialogMode.set('create');
    this.editingContactId.set(null);
    this.resetForm();
    this.isDialogOpen.set(true);
  }

  openEditDialog(): void {
    if (!this.selectedContact) {
      return;
    }

    this.dialogMode.set('edit');
    this.editingContactId.set(this.selectedContact.id);
    this.newContactName.set(this.selectedContact.name);
    this.newContactEmail.set(this.selectedContact.email);
    this.newContactPhone.set(this.selectedContact.phone);
    this.isDialogOpen.set(true);
  }

  closeDialog(): void {
    this.isDialogClosing.set(true);
    setTimeout(() => {
      this.isDialogOpen.set(false);
      this.isDialogClosing.set(false);
      this.dialogMode.set('create');
      this.editingContactId.set(null);
      this.resetForm();
    }, this.dialogAnimationDuration);
  }

  submitContact(): void {
    if (this.dialogMode() === 'edit') {
      this.updateContact();
      return;
    }

    this.createContact();
  }

  createContact(): void {
    if (!this.newContactName() || !this.newContactEmail() || !this.newContactPhone()) {
      return;
    }

    // TODO: Add contact to backend
    console.log('Creating contact:', {
      name: this.newContactName(),
      email: this.newContactEmail(),
      phone: this.newContactPhone(),
    });

    this.closeDialog();
    setTimeout(() => {
      this.showSuccessToast();
    }, this.dialogAnimationDuration);
  }

  deleteContact(): void {
    const editingContactId = this.editingContactId();

    if (!editingContactId) {
      return;
    }

    this.contacts = this.contacts.filter((contact) => contact.id !== editingContactId);
    this.contactGroups = this.groupContacts(this.contacts);

    if (this.selectedContact?.id === editingContactId) {
      this.selectedContact = null;
    }

    this.closeDialog();
  }

  private updateContact(): void {
    const editingContactId = this.editingContactId();

    if (!editingContactId || !this.newContactName() || !this.newContactEmail() || !this.newContactPhone()) {
      return;
    }

    const currentContact = this.contacts.find((contact) => contact.id === editingContactId);

    if (!currentContact) {
      return;
    }

    const updatedContact: Contact = {
      ...currentContact,
      name: this.newContactName(),
      email: this.newContactEmail(),
      phone: this.newContactPhone(),
    };

    this.contacts = this.contacts
      .map((contact) => (contact.id === editingContactId ? updatedContact : contact))
      .sort((a, b) => a.name.localeCompare(b.name));
    this.contactGroups = this.groupContacts(this.contacts);
    this.selectedContact = updatedContact;

    this.closeDialog();
  }

  private showSuccessToast(): void {
    if (this.toastHideTimer) {
      clearTimeout(this.toastHideTimer);
    }

    if (this.toastCleanupTimer) {
      clearTimeout(this.toastCleanupTimer);
    }

    this.isSuccessToastClosing.set(false);
    this.isSuccessToastOpen.set(true);

    this.toastHideTimer = setTimeout(() => {
      this.isSuccessToastClosing.set(true);
      this.toastCleanupTimer = setTimeout(() => {
        this.isSuccessToastOpen.set(false);
        this.isSuccessToastClosing.set(false);
        this.toastCleanupTimer = null;
      }, this.toastAnimationDuration);
      this.toastHideTimer = null;
    }, this.toastVisibleDuration);
  }

  private resetForm(): void {
    this.newContactName.set('');
    this.newContactEmail.set('');
    this.newContactPhone.set('');
  }
}
