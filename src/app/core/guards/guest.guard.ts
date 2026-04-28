import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const guestGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const supabase = inject(SupabaseService);

  if (auth.isAuthenticated()) {
    return router.parseUrl('/summary');
  }

  return supabase.client.auth.getSession().then(({ data }) => {
    const hasSession = !!data.session;
    return auth.syncFromSession(hasSession) ? router.parseUrl('/summary') : true;
  });
};
