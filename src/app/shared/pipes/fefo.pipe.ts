import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fefo',
  standalone: true
})
export class FefoPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
