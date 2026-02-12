import { describe, it, expect } from 'vitest';
import { BoundingBox } from '../../src/geometry/spacial/BoundingBox.js';
import { Vector3 } from '../../src/math/vectors/Vector3.js';

describe('BoundingBox', () => {
  it('creates an empty box', () => {
    const box = BoundingBox.empty();
    expect(box.isEmpty).toBe(true);
    expect(box.min.x).toBe(Infinity);
    expect(box.max.x).toBe(-Infinity);
  });

  it('reports non-empty boxes as not empty', () => {
    const box = new BoundingBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    expect(box.isEmpty).toBe(false);
  });

  it('clones constructor vectors', () => {
    const min = new Vector3(0, 0, 0);
    const max = new Vector3(1, 1, 1);
    const box = new BoundingBox(min, max);
    min.x = -5;
    max.y = 7;
    expect(box.min.equals(new Vector3(0, 0, 0))).toBe(true);
    expect(box.max.equals(new Vector3(1, 1, 1))).toBe(true);
  });

  it('computes center, size, and halfSize', () => {
    const box = new BoundingBox(
      new Vector3(-1, -2, -3),
      new Vector3(3, 2, 1),
    );
    expect(box.center.equals(new Vector3(1, 0, -1))).toBe(true);
    expect(box.size.equals(new Vector3(4, 4, 4))).toBe(true);
    expect(box.halfSize.equals(new Vector3(2, 2, 2))).toBe(true);
  });

  it('contains points on the boundary', () => {
    const box = new BoundingBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    expect(box.containsPoint(new Vector3(0, 0, 0))).toBe(true);
    expect(box.containsPoint(new Vector3(1, 1, 1))).toBe(true);
    expect(box.containsPoint(new Vector3(2, 0, 0))).toBe(false);
  });

  it('excludes points outside a single axis', () => {
    const box = new BoundingBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    expect(box.containsPoint(new Vector3(2, 0.5, 0.5))).toBe(false);
    expect(box.containsPoint(new Vector3(0.5, -1, 0.5))).toBe(false);
    expect(box.containsPoint(new Vector3(0.5, 0.5, 2))).toBe(false);
  });

  it('detects intersections', () => {
    const a = new BoundingBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    const b = new BoundingBox(new Vector3(0.5, 0.5, 0.5), new Vector3(2, 2, 2));
    const c = new BoundingBox(new Vector3(2, 2, 2), new Vector3(3, 3, 3));
    expect(a.intersects(b)).toBe(true);
    expect(a.intersects(c)).toBe(false);
  });

  it('expands by point, box, and scalar', () => {
    const box = BoundingBox.empty();
    box.expandByPoint(new Vector3(1, 2, 3));
    expect(box.min.equals(new Vector3(1, 2, 3))).toBe(true);
    expect(box.max.equals(new Vector3(1, 2, 3))).toBe(true);

    const other = new BoundingBox(new Vector3(-1, -1, -1), new Vector3(0, 0, 0));
    box.expandByBox(other);
    expect(box.min.equals(new Vector3(-1, -1, -1))).toBe(true);
    expect(box.max.equals(new Vector3(1, 2, 3))).toBe(true);

    box.expandByScalar(1);
    expect(box.min.equals(new Vector3(-2, -2, -2))).toBe(true);
    expect(box.max.equals(new Vector3(2, 3, 4))).toBe(true);
  });

  it('clones, copies, and compares equality', () => {
    const box = new BoundingBox(new Vector3(0, 0, 0), new Vector3(1, 1, 1));
    const clone = box.clone();
    expect(clone.equals(box)).toBe(true);
    expect(clone).not.toBe(box);

    const target = BoundingBox.empty();
    target.copy(box);
    expect(target.equals(box)).toBe(true);
    expect(target.equals(new BoundingBox(new Vector3(0, 0, 0), new Vector3(2, 2, 2)))).toBe(false);
  });
});
