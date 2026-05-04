import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTask } from './add-task';

describe('AddTask', () => {
  let component: AddTask;
  let fixture: ComponentFixture<AddTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTask],
    }).compileComponents();

    fixture = TestBed.createComponent(AddTask);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark required fields invalid after submitting an empty task', () => {
    component.createTask();

    expect(component.isFieldInvalid('title')).toBe(true);
    expect(component.isFieldInvalid('dueDate')).toBe(true);
    expect(component.isFieldInvalid('category')).toBe(true);
  });

  it('should mark required fields valid after they are filled', () => {
    component.updateField('title', 'Test task');
    component.updateField('dueDate', '04/05/2026');
    component.updateField('category', 'Technical Task');
    component.createTask();

    expect(component.isFieldValid('title')).toBe(true);
    expect(component.isFieldValid('dueDate')).toBe(true);
    expect(component.isFieldValid('category')).toBe(true);
  });
});
