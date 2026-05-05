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
    component.updateField('dueDate', component.minDueDate);
    component.updateField('category', 'Technical Task');
    component.createTask();

    expect(component.isFieldValid('title')).toBe(true);
    expect(component.isFieldValid('dueDate')).toBe(true);
    expect(component.isFieldValid('category')).toBe(true);
  });

  it('should reject past due dates', () => {
    component.updateField('dueDate', '2000-01-01');
    component.markTouched('dueDate');

    expect(component.isFieldInvalid('dueDate')).toBe(true);
    expect(component.getFieldError('dueDate')).toBe('Date cannot be in the past');
  });

  it('should reject due dates without a 4-digit year', () => {
    component.updateField('dueDate', '10000-01-01');
    component.markTouched('dueDate');

    expect(component.isFieldInvalid('dueDate')).toBe(true);
    expect(component.getFieldError('dueDate')).toBe('Use a 4-digit year');
  });
});
