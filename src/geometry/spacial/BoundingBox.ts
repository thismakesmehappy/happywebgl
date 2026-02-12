import { Vector3 } from '../../math/vectors/Vector3.js';

/**
 * BoundingBox - Axis-Aligned Bounding Box (AABB)
 *
 * Represents a box aligned to the coordinate axes, defined by minimum and
 * maximum corner points. Used for spatial queries, frustum culling, and
 * collision detection.
 *
 * **Usage:**
 * ```typescript
 * // Create from min/max points
 * const box = new BoundingBox(
 *   new Vector3(-1, -1, -1),
 *   new Vector3(1, 1, 1)
 * );
 *
 * // Query properties
 * console.log(box.center);  // (0, 0, 0)
 * console.log(box.size);    // (2, 2, 2)
 *
 * // From geometry
 * geometry.computeBoundingBox();
 * const bounds = geometry.boundingBox;
 * ```
 *
 * @see BoundingSphere for spherical bounds
 * @see Geometry.computeBoundingBox for computing from vertex data
 */
export class BoundingBox {
  /**
   * Minimum corner of the bounding box (smallest x, y, z)
   */
  readonly min: Vector3;

  /**
   * Maximum corner of the bounding box (largest x, y, z)
   */
  readonly max: Vector3;

  /**
   * Creates a new BoundingBox
   *
   * @param min - Minimum corner (cloned)
   * @param max - Maximum corner (cloned)
   */
  constructor(min: Vector3, max: Vector3) {
    this.min = min.clone() as Vector3;
    this.max = max.clone() as Vector3;
  }

  /**
   * Creates an empty bounding box (inverted bounds)
   *
   * An empty box has min at +Infinity and max at -Infinity,
   * so any point will expand it correctly.
   */
  static empty(): BoundingBox {
    return new BoundingBox(
      new Vector3(Infinity, Infinity, Infinity),
      new Vector3(-Infinity, -Infinity, -Infinity),
    );
  }

  /**
   * Whether this bounding box is empty (no valid bounds)
   */
  get isEmpty(): boolean {
    return (
      this.min.x > this.max.x ||
      this.min.y > this.max.y ||
      this.min.z > this.max.z
    );
  }

  /**
   * Gets the center point of the bounding box
   */
  get center(): Vector3 {
    return new Vector3(
      (this.min.x + this.max.x) * 0.5,
      (this.min.y + this.max.y) * 0.5,
      (this.min.z + this.max.z) * 0.5,
    );
  }

  /**
   * Gets the size (dimensions) of the bounding box
   */
  get size(): Vector3 {
    return new Vector3(
      this.max.x - this.min.x,
      this.max.y - this.min.y,
      this.max.z - this.min.z,
    );
  }

  /**
   * Gets the half-size (extents) of the bounding box
   */
  get halfSize(): Vector3 {
    return new Vector3(
      (this.max.x - this.min.x) * 0.5,
      (this.max.y - this.min.y) * 0.5,
      (this.max.z - this.min.z) * 0.5,
    );
  }

  /**
   * Checks if a point is inside the bounding box
   *
   * @param point - Point to test
   * @returns true if the point is inside or on the boundary
   */
  containsPoint(point: Vector3): boolean {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y &&
      point.z >= this.min.z &&
      point.z <= this.max.z
    );
  }

  /**
   * Checks if this bounding box intersects another
   *
   * @param other - Other bounding box to test
   * @returns true if the boxes overlap
   */
  intersects(other: BoundingBox): boolean {
    return (
      this.min.x <= other.max.x &&
      this.max.x >= other.min.x &&
      this.min.y <= other.max.y &&
      this.max.y >= other.min.y &&
      this.min.z <= other.max.z &&
      this.max.z >= other.min.z
    );
  }

  /**
   * Expands this bounding box to include a point
   *
   * @param point - Point to include
   * @returns this for method chaining
   */
  expandByPoint(point: Vector3): this {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.min.z = Math.min(this.min.z, point.z);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.max.z = Math.max(this.max.z, point.z);
    return this;
  }

  /**
   * Expands this bounding box to include another box
   *
   * @param box - Box to include
   * @returns this for method chaining
   */
  expandByBox(box: BoundingBox): this {
    this.min.x = Math.min(this.min.x, box.min.x);
    this.min.y = Math.min(this.min.y, box.min.y);
    this.min.z = Math.min(this.min.z, box.min.z);
    this.max.x = Math.max(this.max.x, box.max.x);
    this.max.y = Math.max(this.max.y, box.max.y);
    this.max.z = Math.max(this.max.z, box.max.z);
    return this;
  }

  /**
   * Expands the bounding box by a scalar value in all directions
   *
   * @param scalar - Amount to expand
   * @returns this for method chaining
   */
  expandByScalar(scalar: number): this {
    this.min.x -= scalar;
    this.min.y -= scalar;
    this.min.z -= scalar;
    this.max.x += scalar;
    this.max.y += scalar;
    this.max.z += scalar;
    return this;
  }

  /**
   * Creates a clone of this bounding box
   */
  clone(): BoundingBox {
    return new BoundingBox(this.min, this.max);
  }

  /**
   * Copies values from another bounding box
   *
   * @param box - Box to copy from
   * @returns this for method chaining
   */
  copy(box: BoundingBox): this {
    this.min.x = box.min.x;
    this.min.y = box.min.y;
    this.min.z = box.min.z;
    this.max.x = box.max.x;
    this.max.y = box.max.y;
    this.max.z = box.max.z;
    return this;
  }

  /**
   * Checks equality with another bounding box
   *
   * @param box - Box to compare
   * @returns true if min and max are equal
   */
  equals(box: BoundingBox): boolean {
    return this.min.equals(box.min) && this.max.equals(box.max);
  }
}
