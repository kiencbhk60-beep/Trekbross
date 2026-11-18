import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const guard = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source = readFileSync(new URL('../intro.js', import.meta.url), 'utf8');

for (const [hash, seen, blocked, expected, historySeen = false] of [
  ['', null, false, true], ['', 'true', false, false],
  ['#projects', null, false, false], ['', null, true, false], ['', null, false, false, true],
]) {
  let gated = false;
  vm.runInNewContext(guard, {
    location: { hash }, sessionStorage: { getItem() { if (blocked) throw Error('denied'); return seen; } },
    history: { state: { trekkbrossIntroSeen: historySeen } },
    document: { documentElement: { classList: { add() { gated = true; } } } },
  });
  assert.equal(gated, expected, 'first visit / seen / deep-link / denied storage');
}

function boot({ gated = true, reduced = false, deniedWrite = false } = {}) {
  const events = new Map(), nodes = new Map(), scripts = [];
  let stored = null, reloads = 0;
  const history = { state: { existing: 'preserved' }, replaceState(value) { history.state = value; } };
  function node(id, tagName = 'DIV') {
    const listeners = new Map();
    const el = { id, tagName, inert: false, hidden: true, paused: true, dataset: { src: 'reference.mp4' },
      addEventListener(name, fn) { listeners.set(name, fn); },
      removeEventListener() {}, setAttribute() {}, removeAttribute() {}, load() {}, focus() { el.focused = true; },
      play() { el.paused = false; return Promise.resolve(); }, pause() { el.paused = true; },
      remove() { el.removed = true; },
      querySelector() { return node('path'); }, querySelectorAll() { return [link]; },
      fire(name, event = {}) { return listeners.get(name)?.(event); },
    };
    nodes.set(id, el); return el;
  }
  const link = node('link', 'A');
  const intro = node('trekkbross-intro'), video = node('intro-video', 'VIDEO');
  const enter = node('intro-enter', 'BUTTON'), play = node('intro-play', 'BUTTON'), main = node('main', 'MAIN');
  const media = { matches: reduced, addEventListener() {}, removeEventListener() {} };
  const root = { classList: { contains: () => gated, remove() { gated = false; } } };
  const document = {
    documentElement: root, getElementById: id => nodes.get(id), hidden: false,
    body: { children: [intro, main], append(script) { scripts.push(script); } },
    createElement: () => ({}), addEventListener() {}, removeEventListener() {},
  };
  vm.runInNewContext(source, {
    document, history, matchMedia: () => media, window: {},
    sessionStorage: { getItem: () => stored, setItem(_k, v) { if (deniedWrite) throw Error('denied'); stored = v; } },
    location: { reload() { reloads++; } },
    addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); },
  });
  return { intro, video, enter, play, main, scripts, events, link, history, gated: () => gated, seen: () => stored, reloads: () => reloads };
}

const skipped = boot({ gated: false });
assert.ok(skipped.intro.removed);
assert.equal(skipped.scripts[0].src, 'about.js');

for (const deniedWrite of [false, true]) {
  const app = boot({ reduced: true, deniedWrite });
  assert.equal(app.video.autoplay, false);
  assert.equal(app.video.paused, true);
  assert.equal(app.main.inert, true);
  app.enter.fire('click');
  app.enter.fire('click');
  assert.equal(app.scripts.length, 1, 'double Enter must not load animations twice');
  assert.equal(app.intro.removed, undefined, 'overlay stays until the main script resolves');
  app.scripts[0].onload();
  await Promise.resolve();
  assert.equal(app.main.inert, false);
  assert.equal(app.gated(), false);
  assert.equal(app.intro.removed, true);
  assert.equal(app.main.focused, true);
  assert.equal(app.seen(), deniedWrite ? null : 'true');
  assert.equal(app.history.state.existing, 'preserved');
  if (deniedWrite) assert.equal(app.history.state.trekkbrossIntroSeen, true);
  assert.equal(app.events.has('pageshow'), false, 'restore listener is released');
}

const failedScript = boot({ reduced: true });
failedScript.enter.fire('click');
failedScript.scripts[0].onerror();
await Promise.resolve();
assert.equal(failedScript.intro.removed, true, 'script failure must still release the static website');

const videoFailure = boot();
videoFailure.video.fire('error');
assert.equal(videoFailure.video.hidden, true);
assert.equal(videoFailure.play.hidden, true);
assert.equal(videoFailure.enter.disabled, undefined, 'failed media must not block entry');

const restored = boot();
restored.link.fire('click');
restored.events.get('pageshow')({ persisted: true });
assert.equal(restored.reloads(), 1, 'cached intro is reconciled with the seen session');

console.log('PASS: first/seen/deep/blocked sessions, delayed main readiness, double Enter, denied writes, reduced motion, failed video/script, BFCache cleanup.');
