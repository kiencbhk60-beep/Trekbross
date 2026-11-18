import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../page-transition.js', import.meta.url), 'utf8');
function boot({ hash = '', pending, reduced = false, blocked = false, paused = false } = {}) {
  const classes = new Set(), events = {}, timers = new Map(), frames = [];
  const storage = new Map(pending ? [['trekkbross-page-transition', JSON.stringify(pending)]] : []);
  const navigations = [];
  const href = `https://example.test/shop.html${hash}`;
  const root = { classList: {
    add: (...names) => names.forEach(name => classes.add(name)),
    remove: (...names) => names.forEach(name => classes.delete(name)),
    contains: name => classes.has(name),
  } };
  vm.runInNewContext(source, {
    URL, Date, JSON,
    document: { documentElement: root, addEventListener: (name, fn) => { events[name] = fn; } },
    location: { href, pathname: '/shop.html', assign: url => navigations.push(url) },
    matchMedia: () => ({ matches: reduced }),
    sessionStorage: {
      getItem(key) { if (blocked) throw Error('blocked'); return storage.get(key); },
      setItem(key, value) { if (blocked) throw Error('blocked'); storage.set(key, value); },
      removeItem: key => storage.delete(key),
    },
    localStorage: { getItem: () => paused ? 'off' : null },
    addEventListener: (name, fn) => { events[name] = fn; },
    requestAnimationFrame: fn => frames.push(fn),
    setTimeout: (fn, delay) => { timers.set(delay, fn); return delay; },
    clearTimeout: id => timers.delete(id),
  });
  function click(url, extra = {}, attributes = {}) {
    let prevented = false;
    const link = { href: url, target: '', hasAttribute: name => Boolean(attributes[name]), ...attributes };
    events.click({ button: 0, target: { closest: () => link }, preventDefault() { prevented = true; }, ...extra });
    return prevented;
  }
  return { classes, events, timers, frames, navigations, storage, click };
}

const destination = 'https://example.test/index.html';
for (const url of ['https://example.test/shop.html#collection', 'https://outside.test/index.html', 'https://example.test/credits.html']) {
  const page = boot();
  assert.equal(page.click(url), false, 'section and unrelated links stay native');
}
for (const extra of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }, { defaultPrevented: true }]) {
  assert.equal(boot().click(destination, extra), false, 'modified clicks stay native');
}
assert.equal(boot().click(destination, {}, { target: '_blank' }), false);
assert.equal(boot().click(destination, {}, { download: true }), false);
assert.equal(boot({ reduced: true }).click(destination), false);
assert.equal(boot({ paused: true }).click(destination), false);

for (const blocked of [false, true]) {
  const page = boot({ blocked });
  assert.equal(page.click(destination), true);
  assert(page.classes.has('page-leaving'));
  assert.equal(page.navigations.length, 0, 'cover fades before navigation');
  page.click(destination);
  page.timers.get(180)();
  assert.deepEqual(page.navigations, [destination], 'repeated clicks navigate once');
  page.timers.get(2000)();
  assert(!page.classes.has('page-leaving'), 'cancelled navigation recovers');
}

const pending = { url: 'https://example.test/shop.html#top', time: Date.now() };
const incoming = boot({ hash: '#top', pending });
assert(incoming.classes.has('page-entering'));
incoming.events.DOMContentLoaded();
while (incoming.frames.length) incoming.frames.shift()();
assert(!incoming.classes.has('page-entering'), 'incoming page reveals after paint');
assert(!boot({ pending }).classes.has('page-entering'), 'unmatched URLs do not cover page');
assert(!boot({ hash: '#top', pending: { ...pending, time: Date.now() - 20000 } }).classes.has('page-entering'));
assert(!boot({ hash: '#top', pending, reduced: true }).classes.has('page-entering'));

const restored = boot();
restored.click(destination);
restored.events.pageshow({ persisted: true });
assert(!restored.classes.has('page-leaving'));
assert.equal(restored.timers.size, 0, 'history restore clears stale navigation');
console.log('Page transition navigation, motion preferences, storage and history checks passed.');
