import { Vector3 } from '../../math/vectors/Vector3.js';
import { BoundingBox } from './BoundingBox.js';

/**
 * BoundingSphere - Spherical bounding volume
 *
 * Represents a sphere defined by a center point and radius. Used for
 * fast spatial queries, frustum culling, and collision detection.
 * Sphere tests are often faster than box tests.
 *
 * **Usage:**
 * ```typescript
 * // Create from center and radius
 * const sphere = new BoundingSphere(
 *   new Vector3(0, 0, 0),
 *   5.0
 * );
 *
 * // Query properties
 * console.log(sphere.center);  // (0, 0, 0)
 * console.log(sphere.radius);  // 5.0
 *
 * // From geometry
 * geometry.computeBoundingSphere();
 * const bounds = geometry.boundingSphere;
 * ```
 *
 * @see BoundingBox for axis-aligned box bounds
 * @see Geometry.computeBoundingSphere for computing from vertex data
 */
export class BoundingSphere {
  /**
   * Center point of the sphere
   */
  readonly center: Vector3;

  /**
   * Radius of the sphere
   */
  radius: number;

  /**
   * Creates a new BoundingSphere
   *
   * @param center - Center point (cloned)
   * @param radius - Sphere radius (default: 0)
   */
  constructor(center: Vector3, radius: number = 0) {
    this.center = center.clone() as Vector3;
    this.radius = radius;
  }

  /**
   * Creates an empty bounding sphere (zero radius at origin)
   */
  static empty(): BoundingSphere {
    return new BoundingSphere(new Vector3(0, 0, 0), -1);
  }

  /**
   * Whether this bounding sphere is empty (negative radius)
   */
  get isEmpty(): boolean {
    return this.radius < 0;
  }

  /**
   * Checks if a point is inside the sphere
   *
   * @param point - Point to test
   * @returns true if the point is inside or on the surface
   */
  containsPoint(point: Vector3): boolean {
    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    const dz = point.z - this.center.z;
    return dx * dx + dy * dy + dz * dz <= this.radius * this.radius;
  }

  /**
   * Checks if this sphere intersects another sphere
   *
   * @param other - Other sphere to test
   * @returns true if the spheres overlap
   */
  intersectsSphere(other: BoundingSphere): boolean {
    const dx = other.center.x - this.center.x;
    const dy = other.center.y - this.center.y;
    const dz = other.center.z - this.center.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const radiusSum = this.radius + other.radius;
    return distSq <= radiusSum * radiusSum;
  }

  /**
   * Checks if this sphere intersects a bounding box
   *
   * @param box - Bounding box to test
   * @returns true if the sphere and box overlap
   */
  intersectsBox(box: BoundingBox): boolean {
    // Find the closest point on the box to the sphere center
    const closestX = Math.max(box.min.x, Math.min(this.center.x, box.max.x));
    const closestY = Math.max(box.min.y, Math.min(this.center.y, box.max.y));
    const closestZ = Math.max(box.min.z, Math.min(this.center.z, box.max.z));

    // Check if the closest point is within the sphere
    const dx = closestX - this.center.x;
    const dy = closestY - this.center.y;
    const dz = closestZ - this.center.z;
    return dx * dx + dy * dy + dz * dz <= this.radius * this.radius;
  }

  /**
   * Expands this sphere to include a point
   *
   * @param point - Point to include
   * @returns this for method chaining
   */
  expandByPoint(point: Vector3): this {
    if (this.isEmpty) {
      this.center.x = point.x;
      this.center.y = point.y;
      this.center.z = point.z;
      this.radius = 0;
      return this;
    }

    const dx = point.x - this.center.x;
    const dy = point.y - this.center.y;
    const dz = point.z - this.center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist > this.radius) {
      // Expand sphere to include the point
      const newRadius = (this.radius + dist) * 0.5;
      const ratio = (newRadius - this.radius) / dist;
      this.center.x += dx * ratio;
      this.center.y += dy * ratio;
      this.center.z += dz * ratio;
      this.radius = newRadius;
    }

    return this;
  }

  /**
   * Creates a bounding sphere that encloses a bounding box
   *
   * @param box - Bounding box to enclose
   * @returns New bounding sphere
   */
  static fromBox(box: BoundingBox): BoundingSphere {
    const center = box.center;
    const halfSize = box.halfSize;
    const radius = Math.sqrt(
      halfSize.x * halfSize.x +
      halfSize.y * halfSize.y +
      halfSize.z * halfSize.z,
    );
    return new BoundingSphere(center, radius);
  }

  /**
   * Creates a clone of this bounding sphere
   */
  clone(): BoundingSphere {
    return new BoundingSphere(this.center, this.radius);
  }

  /**
   * Copies values from another bounding sphere
   *
   * @param sphere - Sphere to copy from
   * @returns this for method chaining
   */
  copy(sphere: BoundingSphere): this {
    this.center.x = sphere.center.x;
    this.center.y = sphere.center.y;
    this.center.z = sphere.center.z;
    this.radius = sphere.radius;
    return this;
  }

  /**
   * Checks equality with another bounding sphere
   *
   * @param sphere - Sphere to compare
   * @returns true if center and radius are equal
   */
  equals(sphere: BoundingSphere): boolean {
    return this.center.equals(sphere.center) && this.radius === sphere.radius;
  }
}
