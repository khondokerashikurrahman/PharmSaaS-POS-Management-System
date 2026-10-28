import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'stockStatus',
  standalone: true
})
export class StockStatusPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
