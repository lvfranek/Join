import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpSite } from './help-site';

describe('HelpSite', () => {
  let component: HelpSite;
  let fixture: ComponentFixture<HelpSite>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpSite],
    }).compileComponents();

    fixture = TestBed.createComponent(HelpSite);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
