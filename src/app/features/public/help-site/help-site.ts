import { Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';

@Component({
  selector: 'app-help-site',
  imports: [TuiButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './help-site.html',
  styleUrl: './help-site.scss',
})
export class HelpSite {
  private readonly location = inject(Location);

  protected goBack(): void {
    this.location.back();
  }
}
