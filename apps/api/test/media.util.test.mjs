import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Тестируем скомпилированный JS (после `nest build`).
const require = createRequire(import.meta.url);
const { detectMediaType, isImage } = require('../dist/media/media.util.js');

test('detectMediaType: JPEG', () => {
  const buf = Buffer.alloc(16);
  buf[0] = 0xff;
  buf[1] = 0xd8;
  buf[2] = 0xff;
  assert.equal(detectMediaType(buf), 'image/jpeg');
});

test('detectMediaType: PNG', () => {
  const buf = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
  ]);
  assert.equal(detectMediaType(buf), 'image/png');
});

test('detectMediaType: WebP', () => {
  const buf = Buffer.alloc(16);
  buf.write('RIFF', 0, 'ascii');
  buf.write('WEBP', 8, 'ascii');
  assert.equal(detectMediaType(buf), 'image/webp');
});

test('detectMediaType: MP4', () => {
  const buf = Buffer.alloc(16);
  buf.write('ftyp', 4, 'ascii');
  assert.equal(detectMediaType(buf), 'video/mp4');
});

test('detectMediaType: неизвестный формат', () => {
  assert.equal(detectMediaType(Buffer.from('not an image at all', 'ascii')), null);
});

test('isImage', () => {
  assert.equal(isImage('image/jpeg'), true);
  assert.equal(isImage('image/png'), true);
  assert.equal(isImage('image/webp'), true);
  assert.equal(isImage('video/mp4'), false);
  assert.equal(isImage(null), false);
});
