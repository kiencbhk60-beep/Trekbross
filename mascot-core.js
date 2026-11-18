export const POSITION_KEY = 'trekkbross-mascot-position-v1';
export const IDLE_DELAY = 8000;
export const IDLE_SEQUENCE = [
  {state:'wink',duration:1600},
  {state:'thinking',duration:2600},
  {state:'wide',duration:1800},
];
export const IDLE_INTERLUDES = [
  {state:'idle',expression:'curieux',duration:2000},
  {state:'idle',expression:'heureux',duration:2200},
  {state:'idle',expression:'hilare',duration:2200},
  {state:'idle',expression:'surpris',duration:1800},
  {state:'idle',expression:'timide',duration:2400},
  {state:'idle',expression:'excite',duration:2000},
  {state:'idle',expression:'fier',duration:2200},
  {state:'idle',expression:'mefiant',duration:2000},
];
export function chooseIdleInterlude(previous=-1,random=Math.random) {
  const size=IDLE_INTERLUDES.length;
  const index=previous<0?Math.floor(random()*size):(previous+1+Math.floor(random()*(size-1)))%size;
  return {index,step:IDLE_INTERLUDES[index],pause:2400+Math.round(random()*1600)};
}

export const REACTIONS = {
  greeting: {expression: 'heureux', message: 'Mình là Bross. Kéo mình đến chỗ bạn thích nhé!', duration: 4200},
  added: {expression: 'excite', message: 'Đã thêm kính vào túi!', duration: 3000},
  ordering: {expression: 'attentif', message: 'Đang gửi đơn hàng của bạn…', duration: 0},
  success: {expression: 'hilare', message: 'Đã gửi đơn hàng. Cảm ơn bạn!', duration: 4800},
  error: {expression: 'confus', message: 'Có chút trục trặc. Bạn kiểm tra thông tin giúp mình nhé.', duration: 4200},
  inspect: {expression: 'curieux', message: 'Cùng xem kỹ mẫu kính này nhé.', duration: 2400},
  bag: {expression: 'heureux', message: 'Đây là túi kính của bạn.', duration: 2600},
  checkout: {expression: 'attentif', message: 'Điền thông tin nhận hàng nhé.', duration: 3000},
  filter: {expression: 'attentif', message: 'Chọn góc nhìn hợp với hành trình của bạn.', duration: 2400},
  theme: {expression: 'surpris', message: 'Một góc nhìn khác!', duration: 2200},
};

export function viewportBounds(width, height, size, left = 0, top = 0) {
  return {left: left + 12, top: top + 12, right: Math.max(left + 12, left + width - size - 12), bottom: Math.max(top + 12, top + height - size - 12)};
}

export function clampPosition(position, bounds) {
  return {
    x: Math.max(bounds.left, Math.min(bounds.right, Number.isFinite(position?.x) ? position.x : bounds.left)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, Number.isFinite(position?.y) ? position.y : bounds.bottom)),
  };
}

export function restorePosition(value, bounds) {
  try {
    const parsed = JSON.parse(value);
    if (Number.isFinite(parsed?.x) && Number.isFinite(parsed?.y)) {
      return clampPosition({x: bounds.left + parsed.x * (bounds.right - bounds.left), y: bounds.top + parsed.y * (bounds.bottom - bounds.top)}, bounds);
    }
  } catch {}
  return {x: bounds.left, y: bounds.bottom};
}

export function serializePosition(position, bounds) {
  const safe = clampPosition(position, bounds);
  return JSON.stringify({x: (safe.x - bounds.left) / Math.max(1, bounds.right - bounds.left), y: (safe.y - bounds.top) / Math.max(1, bounds.bottom - bounds.top)});
}

export function avoidControls(position, bounds, size, controls) {
  const overlaps = (p, r) => p.x < r.right + 8 && p.x + size > r.left - 8 && p.y < r.bottom + 8 && p.y + size > r.top - 8;
  const safe = clampPosition(position, bounds);
  if (!controls.some(r => overlaps(safe, r))) return safe;
  const candidates = controls.flatMap(r => [
    {x: safe.x, y: r.top - size - 12}, {x: safe.x, y: r.bottom + 12},
    {x: r.left - size - 12, y: safe.y}, {x: r.right + 12, y: safe.y},
  ]).concat([{x: bounds.left, y: bounds.top}, {x: bounds.right, y: bounds.top}, {x: bounds.right, y: bounds.bottom}, {x: bounds.left, y: bounds.bottom}])
    .map(p => clampPosition(p, bounds))
    .filter(p => !controls.some(r => overlaps(p, r)))
    .sort((a, b) => Math.hypot(a.x - safe.x, a.y - safe.y) - Math.hypot(b.x - safe.x, b.y - safe.y));
  return candidates[0] || safe;
}
