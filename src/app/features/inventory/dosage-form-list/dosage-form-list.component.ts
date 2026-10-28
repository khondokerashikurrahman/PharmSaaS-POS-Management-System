import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DosageFormApiService,
  ProductDosageForm
} from '../../../core/services/dosage-form-api.service';

@Component({
  selector: 'app-dosage-form-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dosage-form-list.component.html',
  styleUrls: ['./dosage-form-list.component.scss']
})
export class DosageFormListComponent implements OnInit {
  items: ProductDosageForm[] = [];
  name = '';
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: DosageFormApiService) {}

  ngOnInit(): void {
    this.load();
  }

  private tenantId(): number {
    return Number(localStorage.getItem('tenantId') || 0);
  }

  load(): void {
    const tenantId = this.tenantId();
    if (!tenantId) {
      this.errorMessage = 'Tenant পাওয়া যায়নি। আবার login করে চেষ্টা করো।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.api.list(tenantId).subscribe({
      next: items => {
        this.items = items || [];
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Dosage form list লোড করা যায়নি।';
      }
    });
  }

  save(): void {
    const name = this.name.trim();
    const tenantId = this.tenantId();

    if (!name) {
      this.errorMessage = 'Dosage form name লিখো।';
      return;
    }
    if (!tenantId) {
      this.errorMessage = 'Tenant পাওয়া যায়নি। আবার login করে চেষ্টা করো।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request = { name };
    const operation = this.editingId
      ? this.api.update(tenantId, this.editingId, request)
      : this.api.create(tenantId, request);

    operation.subscribe({
      next: () => {
        this.saving = false;
        this.name = '';
        this.editingId = null;
        this.successMessage = 'Dosage form save হয়েছে।';
        this.load();
      },
      error: err => {
        this.saving = false;
        this.errorMessage =
          err?.error?.message ||
          (err?.status === 409
            ? 'এই dosage form আগে থেকেই আছে।'
            : 'Dosage form save করা যায়নি।');
      }
    });
  }

  edit(item: ProductDosageForm): void {
    this.editingId = item.id;
    this.name = item.name;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.editingId = null;
    this.name = '';
    this.errorMessage = '';
  }

  archive(item: ProductDosageForm): void {
    if (!window.confirm(`"${item.name}" dosage form archive করবে?`)) {
      return;
    }

    this.api.archive(this.tenantId(), item.id).subscribe({
      next: () => {
        this.successMessage = 'Dosage form archive হয়েছে।';
        if (this.editingId === item.id) {
          this.cancelEdit();
        }
        this.load();
      },
      error: err => {
        this.errorMessage =
          err?.error?.message || 'Dosage form archive করা যায়নি।';
      }
    });
  }
}
