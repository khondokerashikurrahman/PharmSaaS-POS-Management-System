import { Component } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],
  templateUrl: './public-layout.component.html',
  styleUrl: './public-layout.component.scss'
})
export class PublicLayoutComponent {

  constructor(private router: Router) {}

  goToFeatures(): void {

    if (this.router.url === '/' || this.router.url === '') {

      setTimeout(() => {
        document
          .getElementById('features')
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      }, 100);

    } else {

      this.router.navigate(['/']).then(() => {

        setTimeout(() => {
          document
            .getElementById('features')
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }, 300);

      });

    }
  }
}