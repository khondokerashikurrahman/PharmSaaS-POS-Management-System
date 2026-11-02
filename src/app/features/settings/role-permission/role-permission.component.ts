import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

interface Permission {
  role: string;
  moduleKey: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

interface RoleOption {
  key: string;
  label: string;
  description: string;
}

interface ModuleOption {
  key: string;
  label: string;
  description: string;
}

@Component({
  selector: 'app-role-permission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-permission.component.html',
  styleUrl: './role-permission.component.scss'
})
export class RolePermissionComponent implements OnInit {
  readonly roles: RoleOption[] = [
    { key: 'PHARMACY_ADMIN', label: 'Pharmacy Admin', description: 'Pharmacy পরিচালনা ও প্রশাসনিক কাজ' },
    { key: 'MANAGER', label: 'Manager', description: 'দৈনন্দিন কার্যক্রম ও ব্যবস্থাপনা' },
    { key: 'STORE_KEEPER', label: 'Store Keeper', description: 'Inventory ও stock management' },
    { key: 'PHARMACIST', label: 'Pharmacist', description: 'Medicine ও pharmacy operations' },
    { key: 'STAFF', label: 'Staff', description: 'সাধারণ operational কাজ' },
    { key: 'CASHIER', label: 'Cashier', description: 'POS ও sales operations' }
  ];

  readonly modules: ModuleOption[] = [
    { key: 'DASHBOARD', label: 'Dashboard', description: 'Overview ও business summary' },
    { key: 'POS', label: 'POS', description: 'Point of Sale ও checkout' },
    { key: 'SALES', label: 'Sales', description: 'Sales history ও returns' },
    { key: 'INVENTORY', label: 'Inventory', description: 'Medicine, stock ও batches' },
    { key: 'PROCUREMENT', label: 'Procurement', description: 'Purchase ও goods receiving' },
    { key: 'CUSTOMERS', label: 'Customers', description: 'Customer information ও due' },
    { key: 'SUPPLIERS', label: 'Suppliers', description: 'Supplier ও supplier ledger' },
    { key: 'REPORTS', label: 'Reports', description: 'Business ও financial reports' },
    { key: 'BRANCHES', label: 'Branches', description: 'Branch ও store management' },
    { key: 'STAFF', label: 'Staff Management', description: 'User ও membership management' },
    { key: 'SETTINGS', label: 'Settings', description: 'Pharmacy configuration' }
  ];

  selectedRole = 'MANAGER';
  permissions: Permission[] = [];
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.loadPermissions();
  }

  private getTenantId(): number | null {
    const userTenantId = this.auth.getCurrentUser()?.tenantId;
    const storedTenantId = localStorage.getItem('tenantId');
    const id = Number(userTenantId || storedTenantId);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private createDefaults(): Permission[] {
    const result: Permission[] = [];

    for (const role of this.roles) {
      for (const module of this.modules) {
        const isAdmin = role.key === 'PHARMACY_ADMIN';
        const isCashier = role.key === 'CASHIER';
        const isStoreKeeper = role.key === 'STORE_KEEPER';
        const isPharmacist = role.key === 'PHARMACIST';
        const isManager = role.key === 'MANAGER';

        let canView = isAdmin || isManager;

        if (isCashier) {
          canView = ['DASHBOARD', 'POS', 'SALES', 'CUSTOMERS'].includes(module.key);
        } else if (isStoreKeeper) {
          canView = ['DASHBOARD', 'INVENTORY', 'PROCUREMENT', 'SUPPLIERS'].includes(module.key);
        } else if (isPharmacist) {
          canView = ['DASHBOARD', 'POS', 'SALES', 'INVENTORY', 'CUSTOMERS'].includes(module.key);
        } else if (role.key === 'STAFF') {
          canView = ['DASHBOARD', 'POS', 'SALES', 'CUSTOMERS'].includes(module.key);
        }

        const canCreate = isAdmin ||
          (isManager && !['SETTINGS', 'STAFF', 'BRANCHES'].includes(module.key)) ||
          (isCashier && ['POS', 'SALES', 'CUSTOMERS'].includes(module.key)) ||
          (isStoreKeeper && ['INVENTORY', 'PROCUREMENT'].includes(module.key)) ||
          (isPharmacist && ['POS', 'SALES', 'INVENTORY'].includes(module.key)) ||
          (role.key === 'STAFF' && ['POS', 'SALES'].includes(module.key));

        const canEdit = isAdmin ||
          (isManager && !['SETTINGS', 'STAFF', 'BRANCHES'].includes(module.key)) ||
          (isStoreKeeper && module.key === 'INVENTORY') ||
          (isPharmacist && ['INVENTORY', 'SALES'].includes(module.key));

        const canDelete = isAdmin ||
          (isManager && ['CUSTOMERS', 'SUPPLIERS'].includes(module.key));

        const canApprove = isAdmin ||
          (isManager && ['PROCUREMENT', 'SALES'].includes(module.key));

        result.push({
          role: role.key,
          moduleKey: module.key,
          canView,
          canCreate: canView && canCreate,
          canEdit: canView && canEdit,
          canDelete: canView && canDelete,
          canApprove: canView && canApprove
        });
      }
    }

    return result;
  }

  loadPermissions(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি। আবার login করুন।';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.get<Permission[]>(
      `/tenants/${tenantId}/role-permissions`
    ).subscribe({
      next: response => {
        const defaults = this.createDefaults();
        const saved = Array.isArray(response) ? response : [];

        this.permissions = defaults.map(item => {
          const existing = saved.find(
            savedItem =>
              savedItem.role === item.role &&
              savedItem.moduleKey === item.moduleKey
          );

          return existing ? { ...item, ...existing } : item;
        });

        this.loading = false;
      },
      error: error => {
        this.loading = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Role Permissions load করা যায়নি।';
      }
    });
  }

  get selectedRoleInfo(): RoleOption | undefined {
    return this.roles.find(role => role.key === this.selectedRole);
  }

  get selectedPermissions(): Permission[] {
    return this.modules.map(module => {
      const permission = this.permissions.find(
        item =>
          item.role === this.selectedRole &&
          item.moduleKey === module.key
      );

      return permission ?? {
        role: this.selectedRole,
        moduleKey: module.key,
        canView: false,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canApprove: false
      };
    });
  }

  isAllowed(moduleKey: string, action: keyof Permission): boolean {
    const item = this.permissions.find(
      permission =>
        permission.role === this.selectedRole &&
        permission.moduleKey === moduleKey
    );

    return item ? Boolean(item[action]) : false;
  }

  updatePermission(
    moduleKey: string,
    action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canApprove',
    checked: boolean
  ): void {
    const item = this.permissions.find(
      permission =>
        permission.role === this.selectedRole &&
        permission.moduleKey === moduleKey
    );

    if (!item) return;

    item[action] = checked;

    if (action === 'canView' && !checked) {
      item.canCreate = false;
      item.canEdit = false;
      item.canDelete = false;
      item.canApprove = false;
    }

    if (action !== 'canView' && checked) {
      item.canView = true;
    }
  }

  savePermissions(): void {
    const tenantId = this.getTenantId();

    if (!tenantId) {
      this.errorMessage = 'Tenant ID পাওয়া যায়নি।';
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.put<Permission[]>(
      `/tenants/${tenantId}/role-permissions`,
      { permissions: this.permissions }
    ).subscribe({
      next: response => {
        this.permissions = response;
        this.saving = false;
        this.successMessage = 'Role Permissions সফলভাবে সংরক্ষণ হয়েছে।';
      },
      error: error => {
        this.saving = false;
        this.errorMessage =
          error?.error?.detail ||
          error?.error?.message ||
          'Role Permissions সংরক্ষণ করা যায়নি।';
      }
    });
  }

  resetPermissions(): void {
    this.loadPermissions();
  }

  enableAllForSelectedRole(): void {
    for (const item of this.permissions) {
      if (item.role !== this.selectedRole) continue;
      item.canView = true;
      item.canCreate = true;
      item.canEdit = true;
      item.canDelete = true;
      item.canApprove = true;
    }
  }

  clearSelectedRole(): void {
    for (const item of this.permissions) {
      if (item.role !== this.selectedRole) continue;
      item.canView = false;
      item.canCreate = false;
      item.canEdit = false;
      item.canDelete = false;
      item.canApprove = false;
    }
  }
}
