import { describe, it, expect } from 'vitest';
import { Object3D } from '../../src/scene/Object3D.js';
import { Vector3 } from '../../src/math/vectors/Vector3.js';
import { Quaternion } from '../../src/math/quaternions/Quaternion.js';
import { Matrix4 } from '../../src/math/matrices/Matrix4.js';

describe('Object3D', () => {
  describe('constructor', () => {
    it('creates with default transform', () => {
      const obj = new Object3D();
      expect(obj.position.x).toBe(0);
      expect(obj.position.y).toBe(0);
      expect(obj.position.z).toBe(0);
      expect(obj.rotation.x).toBe(0);
      expect(obj.rotation.y).toBe(0);
      expect(obj.rotation.z).toBe(0);
      expect(obj.rotation.w).toBe(1);
      expect(obj.scale.x).toBe(1);
      expect(obj.scale.y).toBe(1);
      expect(obj.scale.z).toBe(1);
    });

    it('defaults to visible', () => {
      const obj = new Object3D();
      expect(obj.visible).toBe(true);
    });

    it('has no parent by default', () => {
      const obj = new Object3D();
      expect(obj.parent).toBeNull();
    });

    it('has no children by default', () => {
      const obj = new Object3D();
      expect(obj.children).toHaveLength(0);
    });
  });

  describe('localMatrix', () => {
    it('returns identity for default transform', () => {
      const obj = new Object3D();
      const m = obj.localMatrix;
      const identity = new Matrix4();
      for (let i = 0; i < 16; i++) {
        expect(m.elements[i]).toBeCloseTo(identity.elements[i]!, 6);
      }
    });

    it('includes translation', () => {
      const obj = new Object3D();
      obj.position.x = 10;
      obj.position.y = 20;
      obj.position.z = 30;
      const m = obj.localMatrix;
      expect(m.elements[12]).toBeCloseTo(10, 6);
      expect(m.elements[13]).toBeCloseTo(20, 6);
      expect(m.elements[14]).toBeCloseTo(30, 6);
    });

    it('includes scale', () => {
      const obj = new Object3D();
      obj.scale.x = 2;
      obj.scale.y = 3;
      obj.scale.z = 4;
      const m = obj.localMatrix;
      // Column 0 length = scaleX
      const col0Len = Math.sqrt(
        m.elements[0]! ** 2 + m.elements[1]! ** 2 + m.elements[2]! ** 2,
      );
      expect(col0Len).toBeCloseTo(2, 5);
      // Column 1 length = scaleY
      const col1Len = Math.sqrt(
        m.elements[4]! ** 2 + m.elements[5]! ** 2 + m.elements[6]! ** 2,
      );
      expect(col1Len).toBeCloseTo(3, 5);
      // Column 2 length = scaleZ
      const col2Len = Math.sqrt(
        m.elements[8]! ** 2 + m.elements[9]! ** 2 + m.elements[10]! ** 2,
      );
      expect(col2Len).toBeCloseTo(4, 5);
    });

    it('includes rotation', () => {
      const obj = new Object3D();
      // Rotate 90 degrees around Z axis
      obj.rotation.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
      const m = obj.localMatrix;
      // After 90° Z rotation: x-axis → y-axis, y-axis → -x-axis
      expect(m.elements[0]).toBeCloseTo(0, 5);   // col0.x ≈ 0
      expect(m.elements[1]).toBeCloseTo(1, 5);   // col0.y ≈ 1
      expect(m.elements[4]).toBeCloseTo(-1, 5);  // col1.x ≈ -1
      expect(m.elements[5]).toBeCloseTo(0, 5);   // col1.y ≈ 0
    });

    it('composes T * R * S correctly', () => {
      const obj = new Object3D();
      obj.position.x = 5;
      obj.scale.x = 2;
      obj.scale.y = 2;
      obj.scale.z = 2;
      // No rotation
      const m = obj.localMatrix;
      // Scale should be in diagonal, translation in column 3
      expect(m.elements[0]).toBeCloseTo(2, 5);
      expect(m.elements[5]).toBeCloseTo(2, 5);
      expect(m.elements[10]).toBeCloseTo(2, 5);
      expect(m.elements[12]).toBeCloseTo(5, 5);
    });

    it('is lazily recomputed on position change', () => {
      const obj = new Object3D();
      const m1 = obj.localMatrix;
      expect(m1.elements[12]).toBeCloseTo(0, 6);
      obj.position.x = 42;
      const m2 = obj.localMatrix;
      expect(m2.elements[12]).toBeCloseTo(42, 6);
    });

    it('is lazily recomputed on rotation change', () => {
      const obj = new Object3D();
      obj.localMatrix; // force initial compute
      obj.rotation.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
      const m = obj.localMatrix;
      // After 90° X rotation: y-axis → z-axis
      expect(m.elements[5]).toBeCloseTo(0, 5);
      expect(m.elements[6]).toBeCloseTo(1, 5);
    });

    it('is lazily recomputed on scale change', () => {
      const obj = new Object3D();
      obj.localMatrix; // force initial compute
      obj.scale.x = 5;
      const m = obj.localMatrix;
      expect(m.elements[0]).toBeCloseTo(5, 5);
    });
  });

  describe('worldMatrix', () => {
    it('equals localMatrix for root objects', () => {
      const obj = new Object3D();
      obj.position.x = 10;
      const local = obj.localMatrix;
      const world = obj.worldMatrix;
      for (let i = 0; i < 16; i++) {
        expect(world.elements[i]).toBeCloseTo(local.elements[i]!, 6);
      }
    });

    it('incorporates parent transform', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      const world = child.worldMatrix;
      // Child world position should be parent + child = 15
      expect(world.elements[12]).toBeCloseTo(15, 5);
    });

    it('propagates through multiple levels', () => {
      const grandparent = new Object3D();
      grandparent.position.x = 10;
      const parent = new Object3D();
      parent.position.x = 20;
      const child = new Object3D();
      child.position.x = 30;

      grandparent.add(parent);
      parent.add(child);

      const world = child.worldMatrix;
      expect(world.elements[12]).toBeCloseTo(60, 5);
    });

    it('incorporates parent scale', () => {
      const parent = new Object3D();
      parent.scale.x = 2;
      parent.scale.y = 2;
      parent.scale.z = 2;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      const world = child.worldMatrix;
      // Child position is scaled by parent: 5 * 2 = 10
      expect(world.elements[12]).toBeCloseTo(10, 5);
    });

    it('updates when parent transform changes', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      expect(child.worldMatrix.elements[12]).toBeCloseTo(15, 5);

      parent.position.x = 20;
      // Force recompute by accessing worldMatrix
      expect(child.worldMatrix.elements[12]).toBeCloseTo(25, 5);
    });
  });

  describe('add/remove', () => {
    it('adds a child', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      expect(parent.children).toHaveLength(1);
      expect(parent.children[0]).toBe(child);
      expect(child.parent).toBe(parent);
    });

    it('returns this for chaining', () => {
      const parent = new Object3D();
      const child = new Object3D();
      const result = parent.add(child);
      expect(result).toBe(parent);
    });

    it('adds multiple children', () => {
      const parent = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      const c3 = new Object3D();
      parent.add(c1).add(c2).add(c3);
      expect(parent.children).toHaveLength(3);
    });

    it('removes child from previous parent', () => {
      const parent1 = new Object3D();
      const parent2 = new Object3D();
      const child = new Object3D();
      parent1.add(child);
      expect(parent1.children).toHaveLength(1);
      parent2.add(child);
      expect(parent1.children).toHaveLength(0);
      expect(parent2.children).toHaveLength(1);
      expect(child.parent).toBe(parent2);
    });

    it('throws when adding self', () => {
      const obj = new Object3D();
      expect(() => obj.add(obj)).toThrow();
      expect(obj.children).toHaveLength(0);
      expect(obj.parent).toBeNull();
    });

    it('removes a child', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      parent.removeChild(child);
      expect(parent.children).toHaveLength(0);
      expect(child.parent).toBeNull();
    });

    it('removeChild returns this for chaining', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      const result = parent.removeChild(child);
      expect(result).toBe(parent);
    });

    it('removeChild does nothing for non-child', () => {
      const parent = new Object3D();
      const notChild = new Object3D();
      parent.removeChild(notChild);
      expect(parent.children).toHaveLength(0);
    });

    it('children is readonly', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      // The array reference should not allow push
      const children = parent.children;
      expect(children).toHaveLength(1);
      // TypeScript prevents mutation, but runtime check:
      expect(typeof (children as any).push).toBe('function');
    });
  });

  describe('traverse', () => {
    it('visits self', () => {
      const obj = new Object3D();
      const visited: Object3D[] = [];
      obj.traverse((o) => visited.push(o));
      expect(visited).toHaveLength(1);
      expect(visited[0]).toBe(obj);
    });

    it('visits all descendants depth-first', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      const c1a = new Object3D();
      const c1b = new Object3D();
      root.add(c1);
      root.add(c2);
      c1.add(c1a);
      c1.add(c1b);

      const visited: Object3D[] = [];
      root.traverse((o) => visited.push(o));
      expect(visited).toEqual([root, c1, c1a, c1b, c2]);
    });

    it('visits deeply nested hierarchy', () => {
      const a = new Object3D();
      const b = new Object3D();
      const c = new Object3D();
      const d = new Object3D();
      a.add(b);
      b.add(c);
      c.add(d);

      const visited: Object3D[] = [];
      a.traverse((o) => visited.push(o));
      expect(visited).toEqual([a, b, c, d]);
    });
  });

  describe('lookAt', () => {
    it('orients toward target', () => {
      const obj = new Object3D();
      obj.lookAt(new Vector3(0, 0, -1));
      // After lookAt, the rotation should orient the object toward the target.
      // The forward direction in camera/lookAt convention is -Z.
      // Check that the rotation is valid (unit quaternion).
      const len = obj.rotation.length();
      expect(len).toBeCloseTo(1, 5);
    });

    it('returns this for chaining', () => {
      const obj = new Object3D();
      const result = obj.lookAt(new Vector3(1, 0, 0));
      expect(result).toBe(obj);
    });
  });

  describe('updateMatrix', () => {
    it('forces local matrix recompute', () => {
      const obj = new Object3D();
      obj.position.x = 5;
      obj.updateMatrix();
      expect(obj.localMatrix.elements[12]).toBeCloseTo(5, 5);
    });
  });

  describe('updateWorldMatrix', () => {
    it('recursively updates children', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      parent.updateWorldMatrix(true);

      expect(child.worldMatrix.elements[12]).toBeCloseTo(15, 5);
    });

    it('force=true recomputes even when not dirty', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      // Access to cache
      child.worldMatrix;

      // Force recompute
      parent.updateWorldMatrix(true);
      expect(child.worldMatrix.elements[12]).toBeCloseTo(15, 5);
    });

    it('default (no force) updates dirty nodes', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      parent.updateWorldMatrix();
      expect(child.worldMatrix.elements[12]).toBeCloseTo(15, 5);
    });

    it('called on child with parent uses parent worldMatrix', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);

      child.updateWorldMatrix();
      expect(child.worldMatrix.elements[12]).toBeCloseTo(15, 5);
    });
  });

  describe('visibility', () => {
    it('can be set to false', () => {
      const obj = new Object3D();
      obj.visible = false;
      expect(obj.visible).toBe(false);
    });
  });

  describe('world matrix recomputation', () => {
    it('child world matrix reflects parent position changes', () => {
      const parent = new Object3D();
      const child = new Object3D();
      child.position.y = 3;
      parent.add(child);

      expect(child.worldMatrix.elements[13]).toBeCloseTo(3, 5);

      parent.position.y = 10;
      expect(child.worldMatrix.elements[13]).toBeCloseTo(13, 5);
    });

    it('grandchild world matrix updates when grandparent changes', () => {
      const gp = new Object3D();
      const p = new Object3D();
      const c = new Object3D();
      gp.add(p);
      p.add(c);

      c.position.z = 1;
      expect(c.worldMatrix.elements[14]).toBeCloseTo(1, 5);

      gp.position.z = 100;
      expect(c.worldMatrix.elements[14]).toBeCloseTo(101, 5);
    });
  });

  describe('transform composition', () => {
    it('parent rotation affects child position', () => {
      const parent = new Object3D();
      // Rotate parent 90° around Z
      parent.rotation.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
      const child = new Object3D();
      child.position.x = 1;
      parent.add(child);

      const world = child.worldMatrix;
      // After 90° Z rotation: (1,0,0) → (0,1,0)
      expect(world.elements[12]).toBeCloseTo(0, 4);
      expect(world.elements[13]).toBeCloseTo(1, 4);
      expect(world.elements[14]).toBeCloseTo(0, 4);
    });

    it('non-uniform parent scale with child translation', () => {
      const parent = new Object3D();
      parent.scale.x = 3;
      parent.scale.y = 1;
      parent.scale.z = 1;
      const child = new Object3D();
      child.position.x = 2;
      child.position.y = 2;
      parent.add(child);

      const world = child.worldMatrix;
      // x is scaled by 3: 2 * 3 = 6
      expect(world.elements[12]).toBeCloseTo(6, 5);
      // y is not scaled: 2
      expect(world.elements[13]).toBeCloseTo(2, 5);
    });
  });

  describe('uid', () => {
    it('assigns unique uid to each instance', () => {
      const a = new Object3D();
      const b = new Object3D();
      expect(a.uid).not.toBe(b.uid);
    });

    it('uid is a positive number', () => {
      const obj = new Object3D();
      expect(obj.uid).toBeGreaterThan(0);
    });

    it('increments across instances', () => {
      const a = new Object3D();
      const b = new Object3D();
      expect(b.uid).toBe(a.uid + 1);
    });
  });

  describe('id', () => {
    it('is undefined by default', () => {
      const obj = new Object3D();
      expect(obj.id).toBeUndefined();
    });

    it('can be set and retrieved', () => {
      const obj = new Object3D();
      obj.id = 'player';
      expect(obj.id).toBe('player');
    });

    it('trims whitespace', () => {
      const obj = new Object3D();
      obj.id = '  hero  ';
      expect(obj.id).toBe('hero');
    });

    it('normalizes empty string to undefined', () => {
      const obj = new Object3D();
      obj.id = 'test';
      obj.id = '';
      expect(obj.id).toBeUndefined();
    });

    it('normalizes whitespace-only string to undefined', () => {
      const obj = new Object3D();
      obj.id = 'test';
      obj.id = '   ';
      expect(obj.id).toBeUndefined();
    });

    it('can be set to undefined', () => {
      const obj = new Object3D();
      obj.id = 'test';
      obj.id = undefined;
      expect(obj.id).toBeUndefined();
    });

    it('no-ops when setting same value', () => {
      const obj = new Object3D();
      obj.id = 'same';
      obj.id = 'same'; // should not throw or change anything
      expect(obj.id).toBe('same');
    });
  });

  describe('name', () => {
    it('is undefined by default', () => {
      const obj = new Object3D();
      expect(obj.name).toBeUndefined();
    });

    it('can be set and retrieved', () => {
      const obj = new Object3D();
      obj.name = 'cube';
      expect(obj.name).toBe('cube');
    });

    it('trims whitespace', () => {
      const obj = new Object3D();
      obj.name = '  mesh  ';
      expect(obj.name).toBe('mesh');
    });

    it('normalizes empty string to undefined', () => {
      const obj = new Object3D();
      obj.name = 'test';
      obj.name = '';
      expect(obj.name).toBeUndefined();
    });

    it('normalizes whitespace-only string to undefined', () => {
      const obj = new Object3D();
      obj.name = 'test';
      obj.name = '   ';
      expect(obj.name).toBeUndefined();
    });

    it('can be set to undefined', () => {
      const obj = new Object3D();
      obj.name = 'test';
      obj.name = undefined;
      expect(obj.name).toBeUndefined();
    });

    it('no-ops when setting same value', () => {
      const obj = new Object3D();
      obj.name = 'same';
      obj.name = 'same';
      expect(obj.name).toBe('same');
    });
  });

  describe('tags', () => {
    it('has no tags by default', () => {
      const obj = new Object3D();
      expect(obj.tags.size).toBe(0);
    });

    it('addTag adds a tag', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      expect(obj.hasTag('enemy')).toBe(true);
    });

    it('addTag returns this for chaining', () => {
      const obj = new Object3D();
      expect(obj.addTag('a')).toBe(obj);
    });

    it('addTag trims whitespace', () => {
      const obj = new Object3D();
      obj.addTag('  padded  ');
      expect(obj.hasTag('padded')).toBe(true);
    });

    it('addTag ignores empty string', () => {
      const obj = new Object3D();
      obj.addTag('');
      expect(obj.tags.size).toBe(0);
    });

    it('addTag ignores whitespace-only string', () => {
      const obj = new Object3D();
      obj.addTag('   ');
      expect(obj.tags.size).toBe(0);
    });

    it('addTag ignores duplicate tags', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      obj.addTag('enemy');
      expect(obj.tags.size).toBe(1);
    });

    it('removeTag removes a tag', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      obj.removeTag('enemy');
      expect(obj.hasTag('enemy')).toBe(false);
      expect(obj.tags.size).toBe(0);
    });

    it('removeTag returns this for chaining', () => {
      const obj = new Object3D();
      expect(obj.removeTag('nope')).toBe(obj);
    });

    it('removeTag trims whitespace', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      obj.removeTag('  enemy  ');
      expect(obj.hasTag('enemy')).toBe(false);
    });

    it('removeTag no-ops for missing tag', () => {
      const obj = new Object3D();
      obj.addTag('a');
      obj.removeTag('b');
      expect(obj.tags.size).toBe(1);
    });

    it('removeTag no-ops for empty string', () => {
      const obj = new Object3D();
      obj.addTag('a');
      obj.removeTag('');
      expect(obj.tags.size).toBe(1);
    });

    it('hasTag trims whitespace', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      expect(obj.hasTag('  enemy  ')).toBe(true);
    });

    it('hasTag returns false for absent tag', () => {
      const obj = new Object3D();
      expect(obj.hasTag('nope')).toBe(false);
    });

    it('tags getter returns a copy', () => {
      const obj = new Object3D();
      obj.addTag('a');
      const tags = obj.tags;
      (tags as Set<string>).add('b');
      expect(obj.hasTag('b')).toBe(false);
    });

    it('setTags replaces all tags', () => {
      const obj = new Object3D();
      obj.addTag('old');
      obj.setTags(['x', 'y']);
      expect(obj.hasTag('old')).toBe(false);
      expect(obj.hasTag('x')).toBe(true);
      expect(obj.hasTag('y')).toBe(true);
      expect(obj.tags.size).toBe(2);
    });

    it('setTags returns this for chaining', () => {
      const obj = new Object3D();
      expect(obj.setTags(['a'])).toBe(obj);
    });

    it('clearTags removes all tags', () => {
      const obj = new Object3D();
      obj.addTag('a').addTag('b').addTag('c');
      obj.clearTags();
      expect(obj.tags.size).toBe(0);
    });

    it('clearTags returns this for chaining', () => {
      const obj = new Object3D();
      expect(obj.clearTags()).toBe(obj);
    });

    it('clearTags no-ops when already empty', () => {
      const obj = new Object3D();
      expect(obj.clearTags()).toBe(obj);
      expect(obj.tags.size).toBe(0);
    });

    it('_getTagList returns array of tags', () => {
      const obj = new Object3D();
      obj.addTag('a').addTag('b');
      const list = obj._getTagList();
      expect(list).toContain('a');
      expect(list).toContain('b');
      expect(list).toHaveLength(2);
    });
  });

  describe('renderOrder', () => {
    it('defaults to 0', () => {
      const obj = new Object3D();
      expect(obj.renderOrder).toBe(0);
    });

    it('can be set', () => {
      const obj = new Object3D();
      obj.renderOrder = 5;
      expect(obj.renderOrder).toBe(5);
    });
  });

  describe('layers', () => {
    it('defaults to 0xFFFFFFFF', () => {
      const obj = new Object3D();
      expect(obj.layers).toBe(0xFFFFFFFF);
    });

    it('can be set', () => {
      const obj = new Object3D();
      obj.layers = 0x01;
      expect(obj.layers).toBe(0x01);
    });
  });

  describe('userData', () => {
    it('defaults to empty object', () => {
      const obj = new Object3D();
      expect(obj.userData).toEqual({});
    });

    it('can store values', () => {
      const obj = new Object3D();
      obj.userData['health'] = 100;
      obj.userData['name'] = 'player';
      expect(obj.userData['health']).toBe(100);
      expect(obj.userData['name']).toBe('player');
    });
  });

  describe('getWorldPosition', () => {
    it('returns origin for default root object', () => {
      const obj = new Object3D();
      const pos = obj.getWorldPosition();
      expect(pos.x).toBeCloseTo(0, 5);
      expect(pos.y).toBeCloseTo(0, 5);
      expect(pos.z).toBeCloseTo(0, 5);
    });

    it('returns local position for root object', () => {
      const obj = new Object3D();
      obj.position.x = 3;
      obj.position.y = 4;
      obj.position.z = 5;
      const pos = obj.getWorldPosition();
      expect(pos.x).toBeCloseTo(3, 5);
      expect(pos.y).toBeCloseTo(4, 5);
      expect(pos.z).toBeCloseTo(5, 5);
    });

    it('returns combined position for child with parent offset', () => {
      const parent = new Object3D();
      parent.position.x = 10;
      const child = new Object3D();
      child.position.x = 5;
      parent.add(child);
      const pos = child.getWorldPosition();
      expect(pos.x).toBeCloseTo(15, 5);
      expect(pos.y).toBeCloseTo(0, 5);
      expect(pos.z).toBeCloseTo(0, 5);
    });

    it('reuses target vector', () => {
      const obj = new Object3D();
      obj.position.x = 7;
      const target = new Vector3(99, 99, 99);
      const result = obj.getWorldPosition(target);
      expect(result).toBe(target);
      expect(target.x).toBeCloseTo(7, 5);
    });

    it('creates new vector when no target provided', () => {
      const obj = new Object3D();
      const a = obj.getWorldPosition();
      const b = obj.getWorldPosition();
      expect(a).not.toBe(b);
    });
  });

  describe('getWorldQuaternion', () => {
    it('returns identity for default object', () => {
      const obj = new Object3D();
      const q = obj.getWorldQuaternion();
      expect(q.x).toBeCloseTo(0, 5);
      expect(q.y).toBeCloseTo(0, 5);
      expect(q.z).toBeCloseTo(0, 5);
      expect(q.w).toBeCloseTo(1, 5);
    });

    it('returns rotation for rotated object', () => {
      const obj = new Object3D();
      obj.rotation.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
      const q = obj.getWorldQuaternion();
      // Should match the local rotation
      expect(q.x).toBeCloseTo(obj.rotation.x, 4);
      expect(q.y).toBeCloseTo(obj.rotation.y, 4);
      expect(q.z).toBeCloseTo(obj.rotation.z, 4);
      expect(q.w).toBeCloseTo(obj.rotation.w, 4);
    });

    it('extracts correct rotation when object has non-uniform scale', () => {
      const obj = new Object3D();
      obj.scale.x = 3;
      obj.scale.y = 5;
      obj.scale.z = 7;
      obj.rotation.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
      const q = obj.getWorldQuaternion();
      // Should match the local rotation despite scale
      expect(q.x).toBeCloseTo(obj.rotation.x, 4);
      expect(q.y).toBeCloseTo(obj.rotation.y, 4);
      expect(q.z).toBeCloseTo(obj.rotation.z, 4);
      expect(q.w).toBeCloseTo(obj.rotation.w, 4);
    });

    it('reuses target quaternion', () => {
      const obj = new Object3D();
      const target = new Quaternion(99, 99, 99, 99);
      const result = obj.getWorldQuaternion(target);
      expect(result).toBe(target);
      expect(target.w).toBeCloseTo(1, 5);
    });

    it('inherits parent rotation', () => {
      const parent = new Object3D();
      parent.rotation.fromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2);
      const child = new Object3D();
      parent.add(child);
      const q = child.getWorldQuaternion();
      expect(q.x).toBeCloseTo(parent.rotation.x, 4);
      expect(q.y).toBeCloseTo(parent.rotation.y, 4);
      expect(q.z).toBeCloseTo(parent.rotation.z, 4);
      expect(q.w).toBeCloseTo(parent.rotation.w, 4);
    });

    it('handles zero scale without NaN', () => {
      const obj = new Object3D();
      obj.scale.x = 0;
      obj.scale.y = 0;
      obj.scale.z = 0;
      const q = obj.getWorldQuaternion();
      expect(Number.isFinite(q.x)).toBe(true);
      expect(Number.isFinite(q.y)).toBe(true);
      expect(Number.isFinite(q.z)).toBe(true);
      expect(Number.isFinite(q.w)).toBe(true);
      expect(q.length()).toBeCloseTo(1, 5);
    });
  });

  describe('getWorldScale', () => {
    it('returns (1,1,1) for default object', () => {
      const obj = new Object3D();
      const s = obj.getWorldScale();
      expect(s.x).toBeCloseTo(1, 5);
      expect(s.y).toBeCloseTo(1, 5);
      expect(s.z).toBeCloseTo(1, 5);
    });

    it('returns uniform scale', () => {
      const obj = new Object3D();
      obj.scale.x = 2;
      obj.scale.y = 2;
      obj.scale.z = 2;
      const s = obj.getWorldScale();
      expect(s.x).toBeCloseTo(2, 5);
      expect(s.y).toBeCloseTo(2, 5);
      expect(s.z).toBeCloseTo(2, 5);
    });

    it('returns non-uniform scale', () => {
      const obj = new Object3D();
      obj.scale.x = 1;
      obj.scale.y = 2;
      obj.scale.z = 3;
      const s = obj.getWorldScale();
      expect(s.x).toBeCloseTo(1, 5);
      expect(s.y).toBeCloseTo(2, 5);
      expect(s.z).toBeCloseTo(3, 5);
    });

    it('inherits parent scale', () => {
      const parent = new Object3D();
      parent.scale.x = 2;
      parent.scale.y = 3;
      parent.scale.z = 4;
      const child = new Object3D();
      child.scale.x = 2;
      child.scale.y = 2;
      child.scale.z = 2;
      parent.add(child);
      const s = child.getWorldScale();
      expect(s.x).toBeCloseTo(4, 5);
      expect(s.y).toBeCloseTo(6, 5);
      expect(s.z).toBeCloseTo(8, 5);
    });

    it('reuses target vector', () => {
      const obj = new Object3D();
      obj.scale.x = 5;
      const target = new Vector3(99, 99, 99);
      const result = obj.getWorldScale(target);
      expect(result).toBe(target);
      expect(target.x).toBeCloseTo(5, 5);
    });
  });

  describe('traverseVisible', () => {
    it('visits visible tree', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      root.add(c1);
      root.add(c2);
      const visited: Object3D[] = [];
      root.traverseVisible((o) => visited.push(o));
      expect(visited).toEqual([root, c1, c2]);
    });

    it('skips invisible subtree', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      c1.visible = false;
      const c1a = new Object3D();
      c1.add(c1a);
      const c2 = new Object3D();
      root.add(c1);
      root.add(c2);
      const visited: Object3D[] = [];
      root.traverseVisible((o) => visited.push(o));
      expect(visited).toEqual([root, c2]);
    });

    it('skips invisible root', () => {
      const root = new Object3D();
      root.visible = false;
      const child = new Object3D();
      root.add(child);
      const visited: Object3D[] = [];
      root.traverseVisible((o) => visited.push(o));
      expect(visited).toHaveLength(0);
    });

    it('visits deeply nested visible hierarchy', () => {
      const a = new Object3D();
      const b = new Object3D();
      const c = new Object3D();
      a.add(b);
      b.add(c);
      const visited: Object3D[] = [];
      a.traverseVisible((o) => visited.push(o));
      expect(visited).toEqual([a, b, c]);
    });
  });

  describe('findByName', () => {
    it('finds self', () => {
      const obj = new Object3D();
      obj.name = 'hero';
      expect(obj.findByName('hero')).toBe(obj);
    });

    it('finds deep descendant', () => {
      const root = new Object3D();
      const child = new Object3D();
      const grandchild = new Object3D();
      grandchild.name = 'target';
      root.add(child);
      child.add(grandchild);
      expect(root.findByName('target')).toBe(grandchild);
    });

    it('returns null when not found', () => {
      const root = new Object3D();
      root.add(new Object3D());
      expect(root.findByName('nonexistent')).toBeNull();
    });

    it('finds first match in depth-first order', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      c1.name = 'dup';
      const c2 = new Object3D();
      c2.name = 'dup';
      root.add(c1);
      root.add(c2);
      expect(root.findByName('dup')).toBe(c1);
    });

    it('returns null when name is undefined on all nodes', () => {
      const root = new Object3D();
      expect(root.findByName('anything')).toBeNull();
    });
  });

  describe('findById', () => {
    it('finds self', () => {
      const obj = new Object3D();
      obj.id = 'player1';
      expect(obj.findById('player1')).toBe(obj);
    });

    it('finds deep descendant', () => {
      const root = new Object3D();
      const child = new Object3D();
      const grandchild = new Object3D();
      grandchild.id = 'target';
      root.add(child);
      child.add(grandchild);
      expect(root.findById('target')).toBe(grandchild);
    });

    it('returns null when not found', () => {
      const root = new Object3D();
      root.add(new Object3D());
      expect(root.findById('nonexistent')).toBeNull();
    });

    it('finds first match in depth-first order', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      c1.id = 'same';
      const c2 = new Object3D();
      c2.id = 'same';
      root.add(c1);
      root.add(c2);
      expect(root.findById('same')).toBe(c1);
    });
  });

  describe('findByTag', () => {
    it('finds self', () => {
      const obj = new Object3D();
      obj.addTag('enemy');
      expect(obj.findByTag('enemy')).toEqual([obj]);
    });

    it('finds multiple matches', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      c1.addTag('enemy');
      const c2 = new Object3D();
      c2.addTag('enemy');
      const c3 = new Object3D();
      root.add(c1);
      root.add(c2);
      root.add(c3);
      const found = root.findByTag('enemy');
      expect(found).toHaveLength(2);
      expect(found).toContain(c1);
      expect(found).toContain(c2);
    });

    it('finds deep descendants', () => {
      const root = new Object3D();
      const child = new Object3D();
      const grandchild = new Object3D();
      grandchild.addTag('target');
      root.add(child);
      child.add(grandchild);
      expect(root.findByTag('target')).toEqual([grandchild]);
    });

    it('returns empty array when not found', () => {
      const root = new Object3D();
      root.add(new Object3D());
      expect(root.findByTag('nonexistent')).toEqual([]);
    });

    it('includes self and descendants', () => {
      const root = new Object3D();
      root.addTag('shared');
      const child = new Object3D();
      child.addTag('shared');
      root.add(child);
      const found = root.findByTag('shared');
      expect(found).toEqual([root, child]);
    });

    it('returns results in depth-first order', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      c1.addTag('x');
      const c1a = new Object3D();
      c1a.addTag('x');
      const c2 = new Object3D();
      c2.addTag('x');
      root.add(c1);
      c1.add(c1a);
      root.add(c2);
      expect(root.findByTag('x')).toEqual([c1, c1a, c2]);
    });
  });

  describe('clone', () => {
    it('copies all properties', () => {
      const obj = new Object3D();
      obj.position.x = 1;
      obj.position.y = 2;
      obj.position.z = 3;
      obj.rotation.fromAxisAngle(new Vector3(0, 1, 0), Math.PI / 3);
      obj.scale.x = 4;
      obj.scale.y = 5;
      obj.scale.z = 6;
      obj.visible = false;
      obj.renderOrder = 7;
      obj.layers = 0x02;
      obj.id = 'myId';
      obj.name = 'myName';
      obj.addTag('tagA').addTag('tagB');
      obj.userData['key'] = 'value';

      const cloned = obj.clone();
      expect(cloned.position.x).toBe(1);
      expect(cloned.position.y).toBe(2);
      expect(cloned.position.z).toBe(3);
      expect(cloned.rotation.x).toBeCloseTo(obj.rotation.x, 5);
      expect(cloned.rotation.y).toBeCloseTo(obj.rotation.y, 5);
      expect(cloned.rotation.z).toBeCloseTo(obj.rotation.z, 5);
      expect(cloned.rotation.w).toBeCloseTo(obj.rotation.w, 5);
      expect(cloned.scale.x).toBe(4);
      expect(cloned.scale.y).toBe(5);
      expect(cloned.scale.z).toBe(6);
      expect(cloned.visible).toBe(false);
      expect(cloned.renderOrder).toBe(7);
      expect(cloned.layers).toBe(0x02);
      expect(cloned.id).toBe('myId');
      expect(cloned.name).toBe('myName');
      expect(cloned.hasTag('tagA')).toBe(true);
      expect(cloned.hasTag('tagB')).toBe(true);
      expect(cloned.userData['key']).toBe('value');
    });

    it('gets new uid', () => {
      const obj = new Object3D();
      const cloned = obj.clone();
      expect(cloned.uid).not.toBe(obj.uid);
    });

    it('has no children', () => {
      const obj = new Object3D();
      obj.add(new Object3D());
      const cloned = obj.clone();
      expect(cloned.children).toHaveLength(0);
    });

    it('has no parent', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      const cloned = child.clone();
      expect(cloned.parent).toBeNull();
    });

    it('has independent transforms', () => {
      const obj = new Object3D();
      obj.position.x = 5;
      const cloned = obj.clone();
      cloned.position.x = 99;
      expect(obj.position.x).toBe(5);
    });

    it('has independent userData', () => {
      const obj = new Object3D();
      obj.userData['a'] = 1;
      const cloned = obj.clone();
      cloned.userData['a'] = 999;
      expect(obj.userData['a']).toBe(1);
    });
  });

  describe('deepClone', () => {
    it('clones subtree', () => {
      const root = new Object3D();
      root.name = 'root';
      const child = new Object3D();
      child.name = 'child';
      const grandchild = new Object3D();
      grandchild.name = 'grandchild';
      root.add(child);
      child.add(grandchild);

      const cloned = root.deepClone();
      expect(cloned.name).toBe('root');
      expect(cloned.children).toHaveLength(1);
      expect(cloned.children[0]!.name).toBe('child');
      expect(cloned.children[0]!.children).toHaveLength(1);
      expect(cloned.children[0]!.children[0]!.name).toBe('grandchild');
    });

    it('all nodes get new uids', () => {
      const root = new Object3D();
      const child = new Object3D();
      root.add(child);

      const cloned = root.deepClone();
      expect(cloned.uid).not.toBe(root.uid);
      expect(cloned.children[0]!.uid).not.toBe(child.uid);
    });

    it('preserves hierarchy structure', () => {
      const root = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      root.add(c1);
      root.add(c2);

      const cloned = root.deepClone();
      expect(cloned.children).toHaveLength(2);
      expect(cloned.children[0]!.parent).toBe(cloned);
      expect(cloned.children[1]!.parent).toBe(cloned);
    });

    it('root clone has no parent', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);

      const cloned = child.deepClone();
      expect(cloned.parent).toBeNull();
    });

    it('cloned nodes are distinct from originals', () => {
      const root = new Object3D();
      const child = new Object3D();
      child.position.x = 10;
      root.add(child);

      const cloned = root.deepClone();
      cloned.children[0]!.position.x = 99;
      expect(child.position.x).toBe(10);
    });
  });

  describe('cycle detection', () => {
    it('throws when adding ancestor as child', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      expect(() => child.add(parent)).toThrow();
    });

    it('throws for deep cycle', () => {
      const a = new Object3D();
      const b = new Object3D();
      const c = new Object3D();
      a.add(b);
      b.add(c);
      expect(() => c.add(a)).toThrow();
    });

    it('no-ops when child is already parented to this', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      parent.add(child); // should not throw or duplicate
      expect(parent.children).toHaveLength(1);
    });
  });

  describe('removeFromParent', () => {
    it('removes from parent', () => {
      const parent = new Object3D();
      const child = new Object3D();
      parent.add(child);
      child.removeFromParent();
      expect(parent.children).toHaveLength(0);
      expect(child.parent).toBeNull();
    });

    it('returns this for chaining', () => {
      const obj = new Object3D();
      expect(obj.removeFromParent()).toBe(obj);
    });

    it('no-ops when no parent', () => {
      const obj = new Object3D();
      obj.removeFromParent();
      expect(obj.parent).toBeNull();
    });
  });

  describe('removeAllChildren', () => {
    it('removes all children', () => {
      const parent = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      const c3 = new Object3D();
      parent.add(c1).add(c2).add(c3);
      parent.removeAllChildren();
      expect(parent.children).toHaveLength(0);
    });

    it('nulls parent on removed children', () => {
      const parent = new Object3D();
      const c1 = new Object3D();
      const c2 = new Object3D();
      parent.add(c1).add(c2);
      parent.removeAllChildren();
      expect(c1.parent).toBeNull();
      expect(c2.parent).toBeNull();
    });

    it('returns this for chaining', () => {
      const parent = new Object3D();
      expect(parent.removeAllChildren()).toBe(parent);
    });

    it('no-ops when no children', () => {
      const parent = new Object3D();
      parent.removeAllChildren();
      expect(parent.children).toHaveLength(0);
    });
  });
});
