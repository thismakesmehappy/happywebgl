import { describe, it, expect } from 'vitest';
import { BoundingSphere } from '../../src/geometry/spacial/BoundingSphere.js';
import { BoundingBox } from '../../src/geometry/spacial/BoundingBox.js';
import { Vector3 } from '../../src/math/vectors/Vector3.js';

describe('BoundingSphere', () => {
  it('creates an empty sphere', () => {
    const sphere = BoundingSphere.empty();
    expect(sphere.isEmpty).toBe(true);
    expect(sphere.radius).toBeLessThan(0);
  });

  it('clones constructor center', () => {
    const center = new Vector3(1, 2, 3);
    const sphere = new BoundingSphere(center, 4);
    center.x = -2;
    center.z = 9;
    expect(sphere.center.equals(new Vector3(1, 2, 3))).toBe(true);
  });

  it('contains points inside or on the surface', () => {
    const sphere = new BoundingSphere(new Vector3(0, 0, 0), 2);
    expect(sphere.containsPoint(new Vector3(0, 0, 0))).toBe(true);
    expect(sphere.containsPoint(new Vector3(2, 0, 0))).toBe(true);
    expect(sphere.containsPoint(new Vector3(2.1, 0, 0))).toBe(false);
  });

  it('detects sphere intersections', () => {
    const a = new BoundingSphere(new Vector3(0, 0, 0), 1);
    const b = new BoundingSphere(new Vector3(1, 0, 0), 1);
    const c = new BoundingSphere(new Vector3(3, 0, 0), 1);
    expect(a.intersectsSphere(b)).toBe(true);
    expect(a.intersectsSphere(c)).toBe(false);
  });

  it('detects sphere-box intersections', () => {
    const sphere = new BoundingSphere(new Vector3(0, 0, 0), 1);
    const hit = new BoundingBox(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5));
    const miss = new BoundingBox(new Vector3(2, 2, 2), new Vector3(3, 3, 3));
    expect(sphere.intersectsBox(hit)).toBe(true);
    expect(sphere.intersectsBox(miss)).toBe(false);
  });

  it('detects box intersections on the boundary', () => {
    const sphere = new BoundingSphere(new Vector3(0, 0, 0), 1);
    const box = new BoundingBox(new Vector3(1, -0.5, -0.5), new Vector3(2, 0.5, 0.5));
    expect(sphere.intersectsBox(box)).toBe(true);
  });

  it('expands by point (empty and non-empty)', () => {
    const sphere = BoundingSphere.empty();
    sphere.expandByPoint(new Vector3(1, 0, 0));
    expect(sphere.center.equals(new Vector3(1, 0, 0))).toBe(true);
    expect(sphere.radius).toBe(0);

    sphere.expandByPoint(new Vector3(3, 0, 0));
    expect(sphere.radius).toBeGreaterThan(0);
    expect(sphere.containsPoint(new Vector3(3, 0, 0))).toBe(true);
  });

  it('keeps radius when expanding by an interior point', () => {
    const sphere = new BoundingSphere(new Vector3(0, 0, 0), 2);
    sphere.expandByPoint(new Vector3(1, 0, 0));
    expect(sphere.radius).toBe(2);
  });

  it('creates a sphere from a box', () => {
    const box = new BoundingBox(new Vector3(-1, -2, -3), new Vector3(1, 2, 3));
    const sphere = BoundingSphere.fromBox(box);
    expect(sphere.center.equals(new Vector3(0, 0, 0))).toBe(true);
    expect(sphere.radius).toBeCloseTo(Math.sqrt(1 * 1 + 2 * 2 + 3 * 3));
  });

  it('clones, copies, and compares equality', () => {
    const sphere = new BoundingSphere(new Vector3(1, 2, 3), 4);
    const clone = sphere.clone();
    expect(clone.equals(sphere)).toBe(true);
    expect(clone).not.toBe(sphere);

    const target = BoundingSphere.empty();
    target.copy(sphere);
    expect(target.equals(sphere)).toBe(true);
    expect(target.equals(new BoundingSphere(new Vector3(0, 0, 0), 1))).toBe(false);
  });
});
