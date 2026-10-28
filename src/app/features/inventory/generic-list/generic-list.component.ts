import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ProductGeneric,
  ProductGenericApiService
} from '../../../core/services/product-generic-api.service';

@Component({
  selector: 'app-generic-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './generic-list.component.html',
  styleUrls: ['./generic-list.component.scss']
})
export class GenericListComponent implements OnInit {
  items: ProductGeneric[] = [];
  name = '';
  editingId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(private api: ProductGenericApiService) {}

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
      next: data => {
        this.items = data || [];
        this.loading = false;
      },
      error: err => {
        this.loading = false;
        this.errorMessage =
          err?.error?.message || 'Generic list লোড করা যায়নি।';
      }
    });
  }

  save(): void {
    const name = this.name.trim();
    if (!name) {
      this.errorMessage = 'Generic name লিখো।';
      return;
    }

    const tenantId = this.tenantId();
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
        this.successMessage = 'Generic name save হয়েছে।';
        this.load();
      },
      error: err => {
        this.saving = false;
        this.errorMessage =
          err?.error?.message || 'Save করা যায়নি। নামটি আগে থেকে আছে কি না দেখো।';
      }
    });
  }

  edit(item: ProductGeneric): void {
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

  archive(item: ProductGeneric): void {
    if (!window.confirm(`"${item.name}" Generic Name archive করবে?`)) {
      return;
    }

    this.api.archive(this.tenantId(), item.id).subscribe({
      next: () => {
        this.successMessage = 'Generic name archive হয়েছে।';
        this.load();
      },
      error: err => {
        this.errorMessage =
          err?.error?.message || 'Generic name archive করা যায়নি।';
      }
    });
  }
}
