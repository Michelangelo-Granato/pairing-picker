import { convertTo24Hour, convertTo12Hour, formatTimeForDisplay } from './time';

describe('convertTo24Hour', () => {
  it('should return the same time if format is 24h', () => {
    expect(convertTo24Hour('13:00', '24h')).toBe('13:00');
    expect(convertTo24Hour('00:00', '24h')).toBe('00:00');
  });

  it('should convert 12h time to 24h time', () => {
    expect(convertTo24Hour('1:00 PM', '12h')).toBe('13:00');
    expect(convertTo24Hour('12:00 AM', '12h')).toBe('00:00');
    expect(convertTo24Hour('12:00 PM', '12h')).toBe('12:00');
    expect(convertTo24Hour('11:59 PM', '12h')).toBe('23:59');
  });

  it('should handle empty or invalid input', () => {
    expect(convertTo24Hour('', '12h')).toBe('');
    expect(convertTo24Hour('', '24h')).toBe('');
  });
});

describe('convertTo12Hour', () => {
  it('should convert 24h time to 12h time', () => {
    expect(convertTo12Hour('13:00')).toBe('1:00 PM');
    expect(convertTo12Hour('00:00')).toBe('12:00 AM');
    expect(convertTo12Hour('12:00')).toBe('12:00 PM');
    expect(convertTo12Hour('23:59')).toBe('11:59 PM');
  });

  it('should handle empty input', () => {
    expect(convertTo12Hour('')).toBe('');
  });
});

describe('formatTimeForDisplay', () => {
  it('should format time based on selected format', () => {
    expect(formatTimeForDisplay('13:00', '12h')).toBe('1:00 PM');
    expect(formatTimeForDisplay('13:00', '24h')).toBe('13:00');
    expect(formatTimeForDisplay('00:00', '12h')).toBe('12:00 AM');
    expect(formatTimeForDisplay('00:00', '24h')).toBe('00:00');
  });

  it('should handle empty input', () => {
    expect(formatTimeForDisplay('', '12h')).toBe('');
    expect(formatTimeForDisplay('', '24h')).toBe('');
  });
}); 