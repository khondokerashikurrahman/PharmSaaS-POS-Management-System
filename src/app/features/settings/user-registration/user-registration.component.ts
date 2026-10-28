import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserManagementFormComponent } from '../../../shared/components/UserManagement/user-management-form/user-management-form.component';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, RouterLink, UserManagementFormComponent],
  template: `
    <main class="registration-page">
      <a routerLink="/app/settings/users" class="back-link">
        <span>←</span> Back to team members
      </a>

      <header class="page-heading">
        <div class="heading-icon">✦</div>
        <div>
          <p class="eyebrow">TEAM & ACCESS</p>
          <h1>Register a team member</h1>
          <p>Create a staff account and assign the appropriate role.</p>
        </div>
      </header>

      <app-user-management-form></app-user-management-form>
    </main>
  `,
  styles: [`
    :host { display: block; }

    .registration-page {
      max-width: 1050px;
      margin: 0 auto;
      padding: 28px;
      color: #172033;
    }

    .back-link {
      display: inline-flex;
      gap: 9px;
      align-items: center;
      margin-bottom: 28px;
      color: #52647d;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
    }

    .back-link:hover { color: #2563eb; }

    .page-heading {
      display: flex;
      align-items: center;
      gap: 17px;
      margin-bottom: 28px;
    }

    .heading-icon {
      display: grid;
      place-items: center;
      width: 54px;
      height: 54px;
      flex-shrink: 0;
      border-radius: 17px;
      background: #eaf1ff;
      color: #2563eb;
      font-size: 25px;
    }

    .eyebrow {
      margin: 0 0 7px;
      color: #2563eb;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
    }

    h1 {
      margin: 0 0 7px;
      font-size: clamp(23px, 3vw, 31px);
      font-weight: 800;
      letter-spacing: -0.8px;
    }

    .page-heading p:last-child {
      margin: 0;
      color: #718096;
      font-size: 14px;
      line-height: 1.6;
    }

    @media (max-width: 600px) {
      .registration-page { padding: 18px; }
      .page-heading { align-items: flex-start; }
    }
  `]
})
export class UserRegistrationComponent {}