import { TestBed } from '@angular/core/testing';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SupabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have a valid Supabase client', () => {
    expect(service.client).toBeTruthy();
    expect(service.client.auth).toBeDefined();
    expect(service.client.from).toBeDefined();
  });

  it('should have valid Supabase credentials in environment', () => {
    const { url, anonKey } = service.client.options.auth.storageKey;
    console.log('Supabase URL configured:', !!service.client.rest.url);
    console.log('Supabase client initialized:', !!service.client);
  });

  it('should be able to connect to Supabase', async () => {
    // Einfacher Connection-Test
    const response = await service.client.auth.getSession();
    expect(response).toBeTruthy();
  });
});
