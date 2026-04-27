import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  readonly label: string;
  readonly path: string;
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="footer" [class.footer--centered]="links().length > 0">
      @if (links().length) {
        @for (link of links(); track link.path) {
          <a [routerLink]="link.path">{{ link.label }}</a>
        }
      } @else {
        <span>© {{ year() }} Join</span>
      }
    </footer>
  `,
  styleUrl: './app-footer.scss',
})
export class AppFooter {
  readonly links = input<readonly FooterLink[]>([]);
  readonly year = input<number>(2026);
}
