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

  isMobileMenuOpen = false;

  constructor(private router: Router) {}

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

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