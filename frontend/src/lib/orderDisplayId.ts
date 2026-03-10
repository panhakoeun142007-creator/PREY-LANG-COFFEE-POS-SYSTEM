export function buildOrderDisplayIdMap(orderIds: string[]): Record<string, string> {
  const map: Record<string, string> = {};

  orderIds.forEach((id, index) => {
    map[id] = `POS_${String(index + 1).padStart(3, '0')}`;
  });

  return map;
}
