import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-privacy-policy',
  imports: [TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-policy.html',
  styleUrl: './privacy-policy.scss',
})
export class PrivacyPolicy {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
