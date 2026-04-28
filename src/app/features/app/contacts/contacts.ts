import { Component } from '@angular/core';

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
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {
  selectedContact: Contact | null = null;

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
    if (this.selectedContact?.id === contact.id) {
      this.selectedContact = null;
      return;
    }

    this.selectedContact = contact;
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
}
