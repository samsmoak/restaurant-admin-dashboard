export function generateOrderNumber(): string {
  const num = Math.floor(Math.random() * 100000);
  return `ORD-${num.toString().padStart(5, '0')}`;
}
