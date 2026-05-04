import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SupabaseService } from '../../../core/services/supabase.service';
import { Greeting } from './greeting';

describe('Greeting', () => {
  let component: Greeting;
  let fixture: ComponentFixture<Greeting>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Greeting],
      providers: [
        provideRouter([]),
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

    fixture = TestBed.createComponent(Greeting);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
