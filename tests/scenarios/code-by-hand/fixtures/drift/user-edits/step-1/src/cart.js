// Built by hand — code-by-hand session in progress. See .code-by-hand.md.

export function lineTotal(item) {
  return item.price * item.qty;
}

export function cartTotal(items) {
  let sum = 0;
  for (const item of items) {
    sum = sum + lineTotal(item);
  }
  return sum;
}
