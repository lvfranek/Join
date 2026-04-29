import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-legal-notice',
  imports: [TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './legal-notice.html',
  styleUrl: './legal-notice.scss',
})
export class LegalNotice {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
