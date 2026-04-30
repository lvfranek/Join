import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Summary } from './summary';

describe('Summary', () => {
  let component: Summary;
  let fixture: ComponentFixture<Summary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Summary],
      providers: [
        {
          provide: SupabaseService,
          useValue: {
            client: {
              auth: {
                getUser: async () => ({
                  data: {
                    user: {
                      email: 'sofia.mueller@example.com',
                      user_metadata: {
                        full_name: 'Sofia Mueller',
                      },
                    },
                  },
                }),
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Summary);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
