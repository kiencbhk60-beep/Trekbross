// TREKBROSS mascot UI. Bloub's MIT-licensed expression engine is in vendor/bloub/.
import {BotEngine} from './vendor/bloub/engine.js';
import {EXPRESSION_BY_ID} from './vendor/bloub/expressions.js';
import {SHAPE_BY_ID} from './vendor/bloub/skins.js';
import {RAYON} from './vendor/bloub/repere.js';
import {REACTIONS, POSITION_KEY, viewportBounds, clampPosition, restorePosition, serializePosition, avoidControls} from './mascot-core.js';

if (!document.getElementById('trek-mascot')) {
  const root = document.createElement('aside');
  root.id = 'trek-mascot';
  root.setAttribute('aria-label', 'Bross, bạn đồng hành TREKKBROSS');
  root.innerHTML = `<button class="trek-mascot-body" type="button" aria-label="Mascot Bross. Kéo hoặc dùng phím mũi tên để di chuyển. Nhấn để chào." title="Kéo để di chuyển · Phím mũi tên để dịch chuyển · Home để đặt lại">
    <svg viewBox="-112 -112 224 224" aria-hidden="true"><defs><clipPath id="bross-eye-clip"><circle r="100"/></clipPath></defs><circle r="100" fill="#ff6a00"/><g fill="#111111" clip-path="url(#bross-eye-clip)"><path data-eye="0"/><path data-eye="1"/></g></svg>
  </button><span class="trek-mascot-bubble" aria-hidden="true"></span><span class="trek-mascot-sr" role="status" aria-live="polite" aria-atomic="true"></span>`;
  document.body.append(root);
  const button = root.querySelector('button');
  const bubble = root.querySelector('.trek-mascot-bubble');
  const announcement = root.querySelector('[role=status]');
  const eyeNodes = [...root.querySelectorAll('[data-eye]')];
  const reducedQuery = matchMedia('(prefers-reduced-motion: reduce)');
  const shape = SHAPE_BY_ID.get('cercle').radii;
  let expression = 'neutre';
  let engine = new BotEngine(RAYON, 'idle', shape, EXPRESSION_BY_ID.get(expression));
  let clock = 1, last = 0, lastDraw = 0, raf = 0, reactionTimer, positionFrame = 0;
  let reduced = false, locked = false, drag = null, suppressClick = false, dockVersion = 0;
  let bounds, position, greetingIndex = 0;

  function draw() {
    const frame = engine.sample(clock);
    eyeNodes.forEach((node, index) => {
      const eye = frame.eyes[index];
      node.setAttribute('d', eye?.d || '');
      node.setAttribute('transform', eye?.matrix || '');
      node.setAttribute('opacity', String(eye?.alpha ?? 0));
    });
  }
  function tick(time) {
    clock += last ? Math.min(.064, Math.max(0, (time - last) / 1000)) : 0;
    last = time;
    if (time - lastDraw >= 32) { draw(); lastDraw = time; }
    raf = requestAnimationFrame(tick);
  }
  function motion() {
    reduced = reducedQuery.matches || document.documentElement.classList.contains('motion-paused');
    cancelAnimationFrame(raf);
    if (reduced) {
      engine = new BotEngine(RAYON, 'idle', shape, EXPRESSION_BY_ID.get(expression));
      clock = 1;
    }
    draw();
    if (!reduced && !document.hidden && !document.documentElement.classList.contains('intro-pending')) { last = 0; raf = requestAnimationFrame(tick); }
  }
  function setExpression(id) {
    expression = EXPRESSION_BY_ID.has(id) ? id : 'neutre';
    root.dataset.expression = expression;
    if (reduced) {
      engine = new BotEngine(RAYON, 'idle', shape, EXPRESSION_BY_ID.get(expression));
      clock = 1;
    } else engine.setExpression(EXPRESSION_BY_ID.get(expression), clock);
    draw();
  }
  function react(type, product = '', quiet = false) {
    if (!REACTIONS[type] || (locked && !['error', 'success'].includes(type))) return;
    const reaction = REACTIONS[type];
    locked = type === 'ordering';
    clearTimeout(reactionTimer);
    setExpression(reaction.expression);
    const message = type === 'added' && product ? `Đã thêm ${product} vào túi kính!` : reaction.message;
    bubble.textContent = message;
    root.classList.toggle('is-speaking', !quiet);
    if (!quiet) announcement.textContent = message;
    if (reaction.duration) reactionTimer = setTimeout(() => {
      root.classList.remove('is-speaking');
      announcement.textContent = '';
      setExpression('neutre');
    }, reaction.duration);
  }
  function geometry() {
    const view = window.visualViewport;
    const size = root.getBoundingClientRect().width;
    return {size, width: Math.min(document.documentElement.clientWidth, view?.width || innerWidth), height: view?.height || innerHeight, left: view?.offsetLeft || 0, top: view?.offsetTop || 0};
  }
  function controls() {
    return [...document.querySelectorAll('.order-submit,#bag-checkout,#dialog-add,#order-back,#bag-toggle,#menu-toggle,#order-form input,#order-form textarea,.close,.order-close,.intro-enter,.intro-play,.u219-tg,.motion-toggle')]
      .filter(node => node.getClientRects().length)
      .map(node => node.getBoundingClientRect())
      .filter(rect => rect.width && rect.height && rect.bottom > bounds.top && rect.top < bounds.bottom + geometry().size);
  }
  function place(next, avoid = false) {
    const view = geometry();
    position = avoid ? avoidControls(next, bounds, view.size, controls()) : clampPosition(next, bounds);
    root.style.setProperty('--mascot-x', `${position.x}px`);
    root.style.setProperty('--mascot-y', `${position.y}px`);
    const bubbleWidth = Math.min(220, view.width - 24);
    const right = position.x + view.size / 2 > view.left + view.width / 2;
    const desired = right ? view.size - bubbleWidth : 0;
    const bubbleLeft = Math.max(view.left + 12 - position.x, Math.min(desired, view.left + view.width - 12 - position.x - bubbleWidth));
    root.style.setProperty('--mascot-bubble-left', `${bubbleLeft}px`);
    root.classList.toggle('is-right', right);
    root.classList.toggle('is-top', position.y < view.top + 104);
  }
  function remember() {
    try { localStorage.setItem(POSITION_KEY, serializePosition(position, bounds)); } catch {}
  }
  function reflow() {
    const previous = bounds && position ? serializePosition(position, bounds) : null;
    const view = geometry();
    bounds = viewportBounds(view.width, view.height, view.size, view.left, view.top);
    let saved = previous;
    if (!saved) { try { saved = localStorage.getItem(POSITION_KEY); } catch {} }
    place(restorePosition(saved, bounds), true);
  }
  function schedulePosition() {
    if (positionFrame) return;
    positionFrame = requestAnimationFrame(() => { positionFrame = 0; if (!drag) reflow(); });
  }
  function finishDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    suppressClick = drag.moved;
    drag = null;
    root.classList.remove('is-dragging');
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    place(position, true);
    remember();
  }
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0 || event.isPrimary === false) return;
    event.preventDefault();
    suppressClick = false;
    drag = {id: event.pointerId, x: event.clientX, y: event.clientY, start: {...position}, moved: false};
    button.setPointerCapture(event.pointerId);
    button.focus({preventScroll: true});
  });
  button.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (Math.hypot(dx, dy) > 5) { drag.moved = true; root.classList.add('is-dragging'); }
    if (drag.moved) place({x: drag.start.x + dx, y: drag.start.y + dy});
  });
  button.addEventListener('pointerup', finishDrag);
  button.addEventListener('pointercancel', finishDrag);
  button.addEventListener('lostpointercapture', event => { if (drag) finishDrag(event); });
  button.addEventListener('click', event => {
    event.stopPropagation();
    if (suppressClick) { suppressClick = false; return; }
    react(greetingIndex++ % 2 ? 'inspect' : 'greeting');
  });
  button.addEventListener('keydown', event => {
    const step = event.shiftKey ? 32 : 16;
    const deltas = {ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step]};
    if (event.key === 'Home') {
      event.preventDefault(); place({x: bounds.left, y: bounds.bottom}, true); remember();
    } else if (deltas[event.key]) {
      event.preventDefault(); const [x, y] = deltas[event.key];
      place({x: position.x + x, y: position.y + y}, true); remember();
    }
  });
  let gazeAt = 0;
  document.addEventListener('pointermove', event => {
    if (reduced || document.hidden || performance.now() - gazeAt < 80) return;
    gazeAt = performance.now();
    const rect = root.getBoundingClientRect();
    engine.setLook({yaw: Math.max(-26, Math.min(26, (event.clientX - rect.x - rect.width / 2) / innerWidth * 52)), pitch: Math.max(-18, Math.min(18, -(event.clientY - rect.y - rect.height / 2) / innerHeight * 36)), mix: .75, spin: 0, wander: .25}, clock);
  }, {passive: true});
  document.addEventListener('pointerleave', () => engine.setLook(null, clock));

  async function dock() {
    const version = ++dockVersion;
    const dialogs = [...document.querySelectorAll('dialog[open]')];
    const target = dialogs.at(-1) || document.body;
    if (target.classList.contains('closing')) { root.classList.add('is-docking'); return; }
    if (root.parentElement === target) { root.classList.remove('is-docking'); schedulePosition(); return; }
    root.classList.add('is-docking');
    if (target !== document.body) await Promise.allSettled(target.getAnimations().map(animation => animation.finished));
    if (version !== dockVersion) return;
    if (target !== document.body && !target.open) { dock(); return; }
    target.append(root);
    root.classList.remove('is-docking');
    reflow();
  }
  document.querySelectorAll('dialog').forEach(dialog => {
    new MutationObserver(dock).observe(dialog, {attributes: true, attributeFilter: ['open', 'class']});
    dialog.addEventListener('close', dock);
  });
  window.addEventListener('trekbross:mascot', event => react(event.detail?.type, event.detail?.product));
  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target.closest('button,a') : null;
    if (!target || target.disabled || root.contains(target)) return;
    if (target.matches('[data-open]')) react('inspect');
    else if (target.matches('[data-filter]')) react('filter');
    else if (target.matches('#bag-toggle')) react('bag');
    else if (target.matches('#bag-checkout') && document.querySelector('#order-dialog[open]')) react('checkout');
    else if (target.matches('#intro-enter')) react('greeting');
    else if (target.matches('.u219-tg')) react('theme');
  });
  document.addEventListener('pointerover', event => {
    if (event.target instanceof Element && event.target.closest('[data-open]') && !event.relatedTarget?.closest?.('[data-open]')) react('inspect', '', true);
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'order-form' && event.target.querySelector('[aria-invalid=true]')) react('error');
  });
  reducedQuery.addEventListener('change', motion);
  new MutationObserver(motion).observe(document.documentElement, {attributes: true, attributeFilter: ['class']});
  document.addEventListener('visibilitychange', motion);
  addEventListener('resize', schedulePosition);
  document.addEventListener('scroll', schedulePosition, {capture: true, passive: true});
  window.visualViewport?.addEventListener('resize', schedulePosition);
  window.visualViewport?.addEventListener('scroll', schedulePosition);
  addEventListener('pageshow', () => { reflow(); dock(); motion(); });
  reflow(); setExpression('neutre'); motion(); dock();
  try {
    if (!sessionStorage.getItem('trekkbross-mascot-greeted')) {
      sessionStorage.setItem('trekkbross-mascot-greeted', 'true'); react('greeting');
    }
  } catch { /* Storage is optional. */ }
}
