import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardWorkspaceView } from './board';

describe('Board', () => {
  let component: BoardWorkspaceView;
  let fixture: ComponentFixture<BoardWorkspaceView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardWorkspaceView],
    }).compileComponents();

    fixture = TestBed.createComponent(BoardWorkspaceView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
