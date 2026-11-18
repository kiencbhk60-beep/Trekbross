import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BotEngine} from '../vendor/bloub/engine.js';
import {EXPRESSION_BY_ID} from '../vendor/bloub/expressions.js';
import {SHAPE_BY_ID} from '../vendor/bloub/skins.js';

const core = readFileSync(new URL('../mascot-core.js', import.meta.url), 'utf8');
const {REACTIONS, viewportBounds, clampPosition, restorePosition, serializePosition, avoidControls} = await import('data:text/javascript;base64,' + Buffer.from(core).toString('base64'));
for (const width of [320, 375, 390, 430, 1440]) {
  const size = width > 600 ? 84 : 68;
  const bounds = viewportBounds(width, 568, size);
  for (const point of [{x: -999, y: -999}, {x: 9999, y: 9999}, {x: NaN, y: Infinity}]) {
    const safe = clampPosition(point, bounds);
    assert(safe.x >= 12 && safe.x + size <= width - 12);
    assert(safe.y >= 12 && safe.y + size <= 556);
    const restored = restorePosition(serializePosition(safe, bounds), bounds);
    assert(Math.abs(restored.x - safe.x) < .001);
    assert(Math.abs(restored.y - safe.y) < .001);
  }
  for (const value of [null, 'bad-json', '{}', '{"x":null}', '{"x":200,"y":-100}']) {
    const safe = restorePosition(value, bounds);
    assert(Number.isFinite(safe.x) && Number.isFinite(safe.y));
    assert(safe.x >= bounds.left && safe.x <= bounds.right);
  }
  const checkout = {left: 0, right: width, top: 480, bottom: 550};
  const clear = avoidControls({x: bounds.left, y: bounds.bottom}, bounds, size, [checkout]);
  assert(clear.y + size <= checkout.top - 8, 'mascot leaves the checkout action clear');
}
const desktop = viewportBounds(1440, 900, 84), phone = viewportBounds(320, 568, 68);
assert.deepEqual(restorePosition(serializePosition({x: desktop.right, y: desktop.bottom}, desktop), phone), {x: phone.right, y: phone.bottom});
for (const reaction of Object.values(REACTIONS)) {
  assert(EXPRESSION_BY_ID.has(reaction.expression));
  const engine = new BotEngine(100, 'idle', SHAPE_BY_ID.get('cercle').radii, EXPRESSION_BY_ID.get(reaction.expression));
  for (const time of [0, 1, 2.5]) {
    const frame = engine.sample(time);
    assert.equal(frame.eyes.length, 2);
    for (const eye of frame.eyes) {
      assert(!/NaN|Infinity/.test(eye.d + eye.matrix));
      assert(eye.d.length > 0);
    }
  }
}
assert.equal(REACTIONS.ordering.duration, 0, 'pending state waits for a real result');
console.log('PASS: viewport bounds, corrupted storage, responsive persistence, checkout clearance and all real Bloub expressions.');
