import { Component } from '@angular/core';
import { StatusBadgeComponent } from "../status-badge/status-badge.component";

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {

}
