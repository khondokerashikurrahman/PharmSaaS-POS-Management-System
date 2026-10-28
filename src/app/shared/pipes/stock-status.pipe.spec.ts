import { StockStatusPipe } from './stock-status.pipe';

describe('StockStatusPipe', () => {
  it('create an instance', () => {
    const pipe = new StockStatusPipe();
    expect(pipe).toBeTruthy();
  });
});
