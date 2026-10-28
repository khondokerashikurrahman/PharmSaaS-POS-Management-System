import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProductDosageForm {
  id: number;
  tenantId: number;
  name: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DosageFormRequest {
  name: string;
}

@Injectable({ providedIn: 'root' })
export class DosageFormApiService {
  private readonly baseUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  list(tenantId: number): Observable<ProductDosageForm[]> {
    return this.http.get<ProductDosageForm[]>(
      `${this.baseUrl}/${tenantId}/dosage-forms`
    );
  }

  create(
    tenantId: number,
    request: DosageFormRequest
  ): Observable<ProductDosageForm> {
    return this.http.post<ProductDosageForm>(
      `${this.baseUrl}/${tenantId}/dosage-forms`, request
    );
  }

  update(
    tenantId: number,
    formId: number,
    request: DosageFormRequest
  ): Observable<ProductDosageForm> {
    return this.http.put<ProductDosageForm>(
      `${this.baseUrl}/${tenantId}/dosage-forms/${formId}`, request
    );
  }

  archive(tenantId: number, formId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}/${tenantId}/dosage-forms/${formId}`
    );
  }
}
