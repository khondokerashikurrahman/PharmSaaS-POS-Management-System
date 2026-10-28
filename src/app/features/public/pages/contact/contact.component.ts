import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink
  ],
  templateUrl:'./contact.component.html',
  styleUrl: './contact.component.scss'
})
export class ContactComponent {

  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  submitted = false;

  submitForm(): void {
    this.submitted = true;

    setTimeout(() => {
      this.submitted = false;

      this.formData = {
        name: '',
        email: '',
        subject: '',
        message: ''
      };
    }, 3000);
  }
}