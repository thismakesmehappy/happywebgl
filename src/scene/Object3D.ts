import { Matrix4 } from '../math/matrices/Matrix4.js';
import { Vector3 } from '../math/vectors/Vector3.js';
import { Quaternion } from '../math/quaternions/Quaternion.js';
import { AppError } from '../errors/AppError.js';
import { ErrorCode } from '../errors/ErrorCodes.js';

/**
 * Object3D - Base node for the scene graph
 *
 * Holds local transform (position, rotation, scale) and parent/children
 * hierarchy. The local matrix is recomputed on every access (cheap T*R*S).
 * The world matrix is computed from parent.worldMatrix * localMatrix.
 *
 * Transform order: localMatrix = T * R * S (translation * rotation * scale)
 * World matrix: worldMatrix = parent.worldMatrix * localMatrix
 */
export class Object3D {
  /** @internal */
  private static _nextUid: number = 1;

  /** Application-unique numeric id */
  readonly uid: number = Object3D._nextUid++;

  /** Human-readable id, unique per scene */
  private _id?: string;

  /** Human-readable name (duplicates allowed) */
  private _name?: string;

  /** Human-readable tags (duplicates allowed) */
  private _tags: Set<string> = new Set();

  /** Local position (default 0,0,0) */
  readonly position: Vector3 = new Vector3(0, 0, 0);

  /** Local rotation (default identity) */
  readonly rotation: Quaternion = new Quaternion(0, 0, 0, 1);

  /** Local scale (default 1,1,1) */
  readonly scale: Vector3 = new Vector3(1, 1, 1);

  /** Parent node in the scene graph */
  parent: Object3D | null = null;

  /** Whether this object is visible */
  visible: boolean = true;

  /** Per-object render order hint (default 0). Lower values render first. */
  renderOrder: number = 0;

  /** Bitmask for selective rendering (default 0xFFFFFFFF = all layers) */
  layers: number = 0xFFFFFFFF;

  /** Generic application data bag */
  userData: Record<string, unknown> = {};

  /** @internal */
  private _children: Object3D[] = [];

  /** @internal */
  private _localMatrix: Matrix4 = new Matrix4();

  /** @internal */
  private _worldMatrix: Matrix4 = new Matrix4();

  /**
   * Human-readable id, unique per scene
   */
  get id(): string | undefined {
    return this._id;
  }

  set id(value: string | undefined) {
    const next = value?.trim();
    const normalized = next === '' ? undefined : next;
    if (normalized === this._id) {
      return;
    }
    // TODO: When Scene registration returns, update registry here.
    this._id = normalized;
  }

  /**
   * Human-readable name (duplicates allowed)
   */
  get name(): string | undefined {
    return this._name;
  }

  set name(value: string | undefined) {
    const next = value?.trim();
    const normalized = next === '' ? undefined : next;
    if (normalized === this._name) {
      return;
    }
    // TODO: When Scene registration returns, update registry here.
    this._name = normalized;
  }

  /**
   * Tags (duplicates allowed)
   */
  get tags(): ReadonlySet<string> {
    return new Set(this._tags);
  }

  /** Read-only view of children */
  get children(): readonly Object3D[] {
    return this._children;
  }

  /**
   * Gets the local transform matrix (T * R * S)
   *
   * Recomputed on every access. The T*R*S composition is cheap
   * (quaternion to matrix + scale multiply + translation set).
   */
  get localMatrix(): Matrix4 {
    this._recomputeLocalMatrix();
    return this._localMatrix;
  }

  /**
   * Gets the world transform matrix
   *
   * worldMatrix = parent.worldMatrix * localMatrix
   * For root objects, worldMatrix === localMatrix.
   */
  get worldMatrix(): Matrix4 {
    if (this.parent) {
      this._worldMatrix.multiplyMatrices(this.parent.worldMatrix, this.localMatrix);
    } else {
      this._worldMatrix.copy(this.localMatrix);
    }
    return this._worldMatrix;
  }

  /**
   * Adds a child to this object
   *
   * Removes the child from its current parent first if necessary.
   *
   * @throws AppError if adding self or creating a cycle
   */
  add(child: Object3D): this {
    if (child === this) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'Object3D',
        method: 'add',
        detail: 'Object cannot be added to itself',
      });
    }

    if (this._wouldCreateCycle(child)) {
      throw new AppError(ErrorCode.CORE_INVALID_ARG, {
        resource: 'Object3D',
        method: 'add',
        detail: 'Cannot add ancestor as child (would create cycle)',
      });
    }

    if (child.parent === this) {
      return this;
    }

    if (child.parent) {
      child.parent.removeChild(child);
    }

    child.parent = this;
    this._children.push(child);

    return this;
  }

  /**
   * Removes a child from this object
   */
  removeChild(child: Object3D): this {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      child.parent = null;
      this._children.splice(index, 1);
    }

    return this;
  }

  /**
   * Removes this object from its parent
   */
  removeFromParent(): this {
    if (this.parent) {
      this.parent.removeChild(this);
    }
    return this;
  }

  /**
   * Removes all children from this object
   */
  removeAllChildren(): this {
    for (const child of this._children) {
      child.parent = null;
    }
    this._children = [];
    return this;
  }

  /**
   * Traverses this object and all descendants depth-first
   */
  traverse(callback: (object: Object3D) => void): void {
    callback(this);
    for (const child of this._children) {
      child.traverse(callback);
    }
  }

  /**
   * Orients this object to look at a target position
   *
   * Uses Quaternion.lookAt to compute the rotation from the object's
   * current position to the target.
   */
  lookAt(target: Vector3): this {
    const q = Quaternion.lookAt(
      this.position,
      target,
      new Vector3(0, 1, 0),
    );
    this.rotation.copy(q);
    return this;
  }

  /**
   * Extracts world position from the world matrix
   *
   * @param target - Optional Vector3 to store the result (avoids allocation)
   * @returns The world position
   */
  getWorldPosition(target?: Vector3): Vector3 {
    const result = target ?? new Vector3();
    const e = this.worldMatrix.elements;
    result.x = e[12]!;
    result.y = e[13]!;
    result.z = e[14]!;
    return result;
  }

  /**
   * Extracts world rotation from the world matrix
   *
   * @param target - Optional Quaternion to store the result (avoids allocation)
   * @returns The world rotation
   */
  getWorldQuaternion(target?: Quaternion): Quaternion {
    const result = target ?? new Quaternion();
    const e = this.worldMatrix.elements;

    // Extract column vectors and compute their lengths (scale)
    const sx = Math.sqrt(e[0]! * e[0]! + e[1]! * e[1]! + e[2]! * e[2]!);
    const sy = Math.sqrt(e[4]! * e[4]! + e[5]! * e[5]! + e[6]! * e[6]!);
    const sz = Math.sqrt(e[8]! * e[8]! + e[9]! * e[9]! + e[10]! * e[10]!);

    // Build a rotation-only matrix by dividing each column by its scale
    const invSx = sx === 0 ? 0 : 1 / sx;
    const invSy = sy === 0 ? 0 : 1 / sy;
    const invSz = sz === 0 ? 0 : 1 / sz;

    const rotMatrix = new Matrix4(
      e[0]! * invSx, e[1]! * invSx, e[2]! * invSx, 0,
      e[4]! * invSy, e[5]! * invSy, e[6]! * invSy, 0,
      e[8]! * invSz, e[9]! * invSz, e[10]! * invSz, 0,
      0, 0, 0, 1,
    );

    result.fromRotationMatrix4(rotMatrix);
    return result;
  }

  /**
   * Extracts world scale from the world matrix
   *
   * @param target - Optional Vector3 to store the result (avoids allocation)
   * @returns The world scale
   */
  getWorldScale(target?: Vector3): Vector3 {
    const result = target ?? new Vector3();
    const e = this.worldMatrix.elements;
    result.x = Math.sqrt(e[0]! * e[0]! + e[1]! * e[1]! + e[2]! * e[2]!);
    result.y = Math.sqrt(e[4]! * e[4]! + e[5]! * e[5]! + e[6]! * e[6]!);
    result.z = Math.sqrt(e[8]! * e[8]! + e[9]! * e[9]! + e[10]! * e[10]!);
    return result;
  }

  /**
   * Traverses visible objects depth-first, skipping invisible subtrees
   *
   * If a node is not visible, it and all its descendants are skipped.
   */
  traverseVisible(callback: (object: Object3D) => void): void {
    if (!this.visible) return;
    callback(this);
    for (const child of this._children) {
      child.traverseVisible(callback);
    }
  }

  /**
   * Finds the first descendant (or self) with the given name
   *
   * @returns The first matching object, or null if not found
   */
  findByName(name: string): Object3D | null {
    if (this._name === name) return this;
    for (const child of this._children) {
      const found = child.findByName(name);
      if (found) return found;
    }
    return null;
  }

  /**
   * Finds the first descendant (or self) with the given id
   *
   * @returns The first matching object, or null if not found
   */
  findById(id: string): Object3D | null {
    if (this._id === id) return this;
    for (const child of this._children) {
      const found = child.findById(id);
      if (found) return found;
    }
    return null;
  }

  /**
   * Finds all descendants (and self) with the given tag
   *
   * @returns Array of matching objects (empty if none found)
   */
  findByTag(tag: string): Object3D[] {
    const results: Object3D[] = [];
    this._findByTagRecursive(tag, results);
    return results;
  }

  /** @internal */
  private _findByTagRecursive(tag: string, results: Object3D[]): void {
    if (this._tags.has(tag)) results.push(this);
    for (const child of this._children) {
      child._findByTagRecursive(tag, results);
    }
  }

  /**
   * Creates a shallow clone of this object
   *
   * Copies transform, visibility, id, name, tags, renderOrder, layers, userData.
   * Does NOT clone children — the returned object has no parent and no children.
   */
  clone(): Object3D {
    const cloned = new Object3D();
    cloned.position.copy(this.position);
    cloned.rotation.copy(this.rotation);
    cloned.scale.copy(this.scale);
    cloned.visible = this.visible;
    cloned.renderOrder = this.renderOrder;
    cloned.layers = this.layers;
    cloned.id = this._id;
    cloned.name = this._name;
    cloned.setTags(this._tags);
    cloned.userData = { ...this.userData };
    return cloned;
  }

  /**
   * Creates a deep clone of this object and all descendants
   *
   * Recursively clones the entire subtree. Each cloned node gets new uid.
   * The returned root has no parent.
   */
  deepClone(): Object3D {
    const cloned = this.clone();
    for (const child of this._children) {
      cloned.add(child.deepClone());
    }
    return cloned;
  }

  /**
   * Forces recompute of the local matrix
   */
  updateMatrix(): void {
    this._recomputeLocalMatrix();
  }

  /**
   * Recursively updates world matrices
   *
   * Recomputes local and world matrices for this object and all descendants.
   *
   * @param force - Reserved for future dirty-flag optimization
   */
  updateWorldMatrix(_force: boolean = false): void {
    // Recompute local matrix
    this._recomputeLocalMatrix();

    // Recompute world matrix
    if (this.parent) {
      this._worldMatrix.multiplyMatrices(this.parent.worldMatrix, this.localMatrix);
    } else {
      this._worldMatrix.copy(this.localMatrix);
    }

    // Recurse into children
    for (const child of this._children) {
      child._updateWorldMatrixFromParent(this._worldMatrix);
    }
  }

  /** @internal */
  private _recomputeLocalMatrix(): void {
    // T * R * S in column-major
    const rotMatrix = this.rotation.toRotationMatrix4();
    const te = this._localMatrix.elements;
    const re = rotMatrix.elements;
    const sx = this.scale.x;
    const sy = this.scale.y;
    const sz = this.scale.z;

    // Column 0: rotation col0 * scaleX
    te[0] = re[0]! * sx;
    te[1] = re[1]! * sx;
    te[2] = re[2]! * sx;
    te[3] = 0;

    // Column 1: rotation col1 * scaleY
    te[4] = re[4]! * sy;
    te[5] = re[5]! * sy;
    te[6] = re[6]! * sy;
    te[7] = 0;

    // Column 2: rotation col2 * scaleZ
    te[8] = re[8]! * sz;
    te[9] = re[9]! * sz;
    te[10] = re[10]! * sz;
    te[11] = 0;

    // Column 3: translation
    te[12] = this.position.x;
    te[13] = this.position.y;
    te[14] = this.position.z;
    te[15] = 1;
  }

  /** @internal */
  private _wouldCreateCycle(child: Object3D): boolean {
    let current: Object3D | null = this;
    while (current) {
      if (current === child) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  /** @internal */
  private _updateWorldMatrixFromParent(parentWorldMatrix: Matrix4): void {
    this._recomputeLocalMatrix();
    this._worldMatrix.multiplyMatrices(parentWorldMatrix, this.localMatrix);
    for (const child of this._children) {
      child._updateWorldMatrixFromParent(this._worldMatrix);
    }
  }

  /** @internal */
  _getTagList(): string[] {
    return Array.from(this._tags);
  }

  /**
   * Adds a tag to this object
   */
  addTag(tag: string): this {
    const normalized = tag.trim();
    if (!normalized || this._tags.has(normalized)) {
      return this;
    }
    this._tags.add(normalized);
    // TODO: When Scene registration returns, update registry here.
    return this;
  }

  /**
   * Removes a tag from this object
   */
  removeTag(tag: string): this {
    const normalized = tag.trim();
    if (!normalized || !this._tags.has(normalized)) {
      return this;
    }
    this._tags.delete(normalized);
    // TODO: When Scene registration returns, update registry here.
    return this;
  }

  /**
   * Checks whether this object has a tag
   */
  hasTag(tag: string): boolean {
    return this._tags.has(tag.trim());
  }

  /**
   * Replaces all tags on this object
   */
  setTags(tags: Iterable<string>): this {
    this.clearTags();
    for (const tag of tags) {
      this.addTag(tag);
    }
    return this;
  }

  /**
   * Removes all tags from this object
   */
  clearTags(): this {
    if (this._tags.size === 0) {
      return this;
    }
    // TODO: When Scene registration returns, update registry here.
    this._tags.clear();
    return this;
  }
}
