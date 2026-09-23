function positive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be positive`);
}
export function calories(met, kg, minutes) {
  positive(met, 'MET'); positive(kg, 'Weight');
  if (!Number.isFinite(minutes) || minutes < 0) throw new RangeError('Invalid duration');
  return met * 3.5 * kg / 200 * minutes;
}
export function duration(met, kg, target) {
  if (!Number.isFinite(target) || target < 0) throw new RangeError('Invalid target');
  return target / calories(met, kg, 1);
}
