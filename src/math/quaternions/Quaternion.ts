import { Vector3 } from '../vectors/Vector3.js';
import { Matrix3 } from '../matrices/Matrix3.js';
import { Matrix4 } from '../matrices/Matrix4.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Quaternion - A quaternion class for 3D rotations
 * 
 * Quaternions are used to represent rotations in 3D space efficiently.
 * They avoid gimbal lock and provide smooth interpolation.
 * 
 * Representation: q = (x, y, z, w) where:
 * - (x, y, z) is the vector (imaginary) part
 * - w is the scalar (real) part
 * 
 * For rotations, quaternions should be normalized (unit quaternions).
 * 
 * Method Patterns:
 * - Instance methods (e.g., q1.multiply(q2)): Mutate the calling quaternion
 * - Static methods (e.g., Quaternion.multiply(q1, q2)): Return a new quaternion, don't mutate inputs
 * 
 * This matches common patterns:
 * - Use instance methods when you want to modify in place (performance, chaining)
 * - Use static methods when you want immutability (functional style)
 */
export class Quaternion {
  /**
   * Quaternion components stored as Float32Array for WebGL compatibility and performance
   * [x, y, z, w] where (x,y,z) is vector part and w is scalar part
   */
  private _elements: Float32Array;

  /**
   * Creates a new Quaternion
   * 
   * @param x - X component (vector part, default: 0)
   * @param y - Y component (vector part, default: 0)
   * @param z - Z component (vector part, default: 0)
   * @param w - W component (scalar part, default: 1 for identity rotation)
   * 
   * @example
   * const q1 = new Quaternion();              // (0, 0, 0, 1) - identity
   * const q2 = new Quaternion(0, 0, 0, 1);   // (0, 0, 0, 1) - identity
   * const q3 = new Quaternion(1, 2, 3, 4);   // (1, 2, 3, 4)
   */
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this._elements = new Float32Array([x, y, z, w]);
  }

  /**
   * Gets the X component (vector part)
   */
  get x(): number {
    return this._elements[0]!;
  }

  /**
   * Sets the X component (vector part)
   */
  set x(value: number) {
    this._elements[0] = value;
  }

  /**
   * Gets the Y component (vector part)
   */
  get y(): number {
    return this._elements[1]!;
  }

  /**
   * Sets the Y component (vector part)
   */
  set y(value: number) {
    this._elements[1] = value;
  }

  /**
   * Gets the Z component (vector part)
   */
  get z(): number {
    return this._elements[2]!;
  }

  /**
   * Sets the Z component (vector part)
   */
  set z(value: number) {
    this._elements[2] = value;
  }

  /**
   * Gets the W component (scalar part)
   */
  get w(): number {
    return this._elements[3]!;
  }

  /**
   * Sets the W component (scalar part)
   */
  set w(value: number) {
    this._elements[3] = value;
  }

  /**
   * Gets all components as an array [x, y, z, w]
   */
  get elements(): Float32Array {
    return this._elements;
  }

  /**
   * Sets this quaternion to the identity quaternion (MUTATING)
   * Identity quaternion represents no rotation: (0, 0, 0, 1)
   * 
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion(1, 2, 3, 4);
   * q.identity();  // q is now (0, 0, 0, 1)
   */
  identity(): this {
    this._elements[0] = 0;
    this._elements[1] = 0;
    this._elements[2] = 0;
    this._elements[3] = 1;
    return this;
  }

  /**
   * Static method: Creates an identity quaternion
   * 
   * @returns New identity quaternion (0, 0, 0, 1)
   * 
   * @example
   * const q = Quaternion.identity();  // (0, 0, 0, 1)
   */
  static identity(): Quaternion {
    return new Quaternion(0, 0, 0, 1);
  }

  /**
   * Sets this quaternion to zero (MUTATING)
   * Note: Zero quaternion is not a valid rotation
   * 
   * @returns This quaternion (for chaining)
   */
  zero(): this {
    this._elements[0] = 0;
    this._elements[1] = 0;
    this._elements[2] = 0;
    this._elements[3] = 0;
    return this;
  }

  /**
   * Static method: Creates a zero quaternion
   * Note: Zero quaternion is not a valid rotation
   * 
   * @returns New zero quaternion (0, 0, 0, 0)
   */
  static zero(): Quaternion {
    return new Quaternion(0, 0, 0, 0);
  }

  /**
   * Calculates the squared length (norm squared) of this quaternion
   * 
   * @returns Squared length: x² + y² + z² + w²
   * 
   * @example
   * const q = new Quaternion(1, 2, 3, 4);
   * q.lengthSquared();  // Returns 1² + 2² + 3² + 4² = 30
   */
  lengthSquared(): number {
    const x = this._elements[0]!;
    const y = this._elements[1]!;
    const z = this._elements[2]!;
    const w = this._elements[3]!;
    return x * x + y * y + z * z + w * w;
  }

  /**
   * Calculates the length (norm) of this quaternion
   * 
   * @returns Length: √(x² + y² + z² + w²)
   * 
   * @example
   * const q = new Quaternion(0, 0, 0, 1);
   * q.length();  // Returns 1.0
   */
  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * Normalizes this quaternion to unit length (MUTATING)
   * Makes the quaternion have length = 1 while preserving its rotation.
   * 
   * If the quaternion is zero, it remains unchanged.
   * 
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion(2, 0, 0, 2);
   * q.normalize();  // q is now (1/√2, 0, 0, 1/√2), length = 1
   */
  normalize(): this {
    const len = this.length();
    if (len === 0) {
      // Cannot normalize zero quaternion - leave it unchanged
      return this;
    }
    const invLen = 1 / len;
    this._elements[0] = this._elements[0]! * invLen;
    this._elements[1] = this._elements[1]! * invLen;
    this._elements[2] = this._elements[2]! * invLen;
    this._elements[3] = this._elements[3]! * invLen;
    return this;
  }

  /**
   * Static method: Normalizes a quaternion to unit length and returns a new quaternion
   * 
   * @param q - The quaternion to normalize
   * @returns New normalized quaternion (length = 1)
   *          If q is zero quaternion, returns zero quaternion
   * 
   * @example
   * const q1 = new Quaternion(2, 0, 0, 2);
   * const q2 = Quaternion.normalize(q1);  // Returns normalized quaternion, q1 unchanged
   */
  static normalize(q: Quaternion): Quaternion {
    const len = q.length();
    if (len === 0) {
      return new Quaternion(0, 0, 0, 0);
    }
    const invLen = 1 / len;
    return new Quaternion(
      q.x * invLen,
      q.y * invLen,
      q.z * invLen,
      q.w * invLen
    );
  }

  /**
   * Calculates the conjugate of this quaternion (MUTATING)
   * Conjugate negates the vector part: (x, y, z, w) → (-x, -y, -z, w)
   * 
   * For unit quaternions, conjugate is the same as inverse.
   * 
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion(1, 2, 3, 4);
   * q.conjugate();  // q is now (-1, -2, -3, 4)
   */
  conjugate(): this {
    this._elements[0] = -this._elements[0]!;
    this._elements[1] = -this._elements[1]!;
    this._elements[2] = -this._elements[2]!;
    return this;
  }

  /**
   * Static method: Calculates the conjugate of a quaternion and returns a new quaternion
   * 
   * @param q - The quaternion
   * @returns New conjugate quaternion (-x, -y, -z, w)
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = Quaternion.conjugate(q1);  // Returns (-1, -2, -3, 4), q1 unchanged
   */
  static conjugate(q: Quaternion): Quaternion {
    return new Quaternion(-q.x, -q.y, -q.z, q.w);
  }

  /**
   * Calculates the inverse of this quaternion (MUTATING)
   * Inverse is conjugate divided by squared length.
   * 
   * For unit quaternions, inverse equals conjugate.
   * 
   * @returns This quaternion (for chaining)
   * @throws Error if quaternion is zero (cannot invert zero quaternion)
   * 
   * @example
   * const q = new Quaternion(1, 0, 0, 1);
   * q.normalize();
   * q.inverse();  // q is now the inverse rotation
   */
  inverse(): this {
    const lenSq = this.lengthSquared();
    if (lenSq === 0) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'Quaternion',
        method: 'inverse',
        detail: 'Cannot invert zero quaternion',
      });
    }
    const invLenSq = 1 / lenSq;
    this._elements[0] = this._elements[0]! * -invLenSq;
    this._elements[1] = this._elements[1]! * -invLenSq;
    this._elements[2] = this._elements[2]! * -invLenSq;
    this._elements[3] = this._elements[3]! * invLenSq;
    return this;
  }

  /**
   * Static method: Calculates the inverse of a quaternion and returns a new quaternion
   * 
   * @param q - The quaternion
   * @returns New inverse quaternion
   * @throws Error if quaternion is zero
   * 
   * @example
   * const q1 = new Quaternion(1, 0, 0, 1);
   * const q2 = Quaternion.inverse(q1);  // Returns inverse, q1 unchanged
   */
  static inverse(q: Quaternion): Quaternion {
    const lenSq = q.lengthSquared();
    if (lenSq === 0) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'Quaternion',
        method: 'inverse',
        detail: 'Cannot invert zero quaternion',
      });
    }
    const invLenSq = 1 / lenSq;
    return new Quaternion(
      -q.x * invLenSq,
      -q.y * invLenSq,
      -q.z * invLenSq,
      q.w * invLenSq
    );
  }

  /**
   * Calculates the dot product of this quaternion with another quaternion
   * 
   * @param q - The other quaternion
   * @returns Dot product: this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(5, 6, 7, 8);
   * q1.dot(q2);  // Returns 1*5 + 2*6 + 3*7 + 4*8 = 70
   */
  dot(q: Quaternion): number {
    return (
      this._elements[0]! * q._elements[0]! +
      this._elements[1]! * q._elements[1]! +
      this._elements[2]! * q._elements[2]! +
      this._elements[3]! * q._elements[3]!
    );
  }

  /**
   * Static method: Calculates the dot product of two quaternions
   * 
   * @param a - First quaternion
   * @param b - Second quaternion
   * @returns Dot product: a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(5, 6, 7, 8);
   * Quaternion.dot(q1, q2);  // Returns 70
   */
  static dot(a: Quaternion, b: Quaternion): number {
    return a.dot(b);
  }

  /**
   * Multiplies this quaternion by another quaternion (MUTATING)
   * Quaternion multiplication represents composition of rotations.
   * 
   * Formula: this = this * q
   * 
   * @param q - The quaternion to multiply by
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = new Quaternion(1, 0, 0, 1);
   * const q2 = new Quaternion(0, 1, 0, 1);
   * q1.multiply(q2);  // q1 is now the composition of rotations
   */
  multiply(q: Quaternion): this {
    const ax = this._elements[0]!;
    const ay = this._elements[1]!;
    const az = this._elements[2]!;
    const aw = this._elements[3]!;
    const bx = q._elements[0]!;
    const by = q._elements[1]!;
    const bz = q._elements[2]!;
    const bw = q._elements[3]!;

    // Quaternion multiplication formula:
    // (a.w, a.x, a.y, a.z) * (b.w, b.x, b.y, b.z) =
    //   (a.w*b.w - a.x*b.x - a.y*b.y - a.z*b.z,
    //    a.w*b.x + a.x*b.w + a.y*b.z - a.z*b.y,
    //    a.w*b.y - a.x*b.z + a.y*b.w + a.z*b.x,
    //    a.w*b.z + a.x*b.y - a.y*b.x + a.z*b.w)
    this._elements[0] = aw * bx + ax * bw + ay * bz - az * by;
    this._elements[1] = aw * by - ax * bz + ay * bw + az * bx;
    this._elements[2] = aw * bz + ax * by - ay * bx + az * bw;
    this._elements[3] = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  /**
   * Static method: Multiplies two quaternions and returns a new quaternion
   * 
   * @param a - First quaternion
   * @param b - Second quaternion
   * @returns New quaternion representing a * b
   * 
   * @example
   * const q1 = new Quaternion(1, 0, 0, 1);
   * const q2 = new Quaternion(0, 1, 0, 1);
   * const q3 = Quaternion.multiply(q1, q2);  // Returns q1 * q2, q1 and q2 unchanged
   */
  static multiply(a: Quaternion, b: Quaternion): Quaternion {
    const ax = a._elements[0]!;
    const ay = a._elements[1]!;
    const az = a._elements[2]!;
    const aw = a._elements[3]!;
    const bx = b._elements[0]!;
    const by = b._elements[1]!;
    const bz = b._elements[2]!;
    const bw = b._elements[3]!;

    return new Quaternion(
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz
    );
  }

  /**
   * Multiplies this quaternion by a scalar (MUTATING)
   * 
   * @param scalar - The scalar value to multiply by
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion(1, 2, 3, 4);
   * q.multiplyScalar(2);  // q is now (2, 4, 6, 8)
   */
  multiplyScalar(scalar: number): this {
    this._elements[0] = this._elements[0]! * scalar;
    this._elements[1] = this._elements[1]! * scalar;
    this._elements[2] = this._elements[2]! * scalar;
    this._elements[3] = this._elements[3]! * scalar;
    return this;
  }

  /**
   * Static method: Multiplies a quaternion by a scalar and returns a new quaternion
   * 
   * @param q - The quaternion
   * @param scalar - The scalar value
   * @returns New scaled quaternion
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = Quaternion.multiplyScalar(q1, 2);  // Returns (2, 4, 6, 8), q1 unchanged
   */
  static multiplyScalar(q: Quaternion, scalar: number): Quaternion {
    return new Quaternion(
      q.x * scalar,
      q.y * scalar,
      q.z * scalar,
      q.w * scalar
    );
  }

  /**
   * Creates a new quaternion with the same values as this quaternion
   * 
   * @returns A new quaternion with the same values
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = q1.clone();  // q2 is a new Quaternion(1, 2, 3, 4), q1 unchanged
   */
  clone(): Quaternion {
    return new Quaternion(
      this._elements[0]!,
      this._elements[1]!,
      this._elements[2]!,
      this._elements[3]!
    );
  }

  /**
   * Copies the values from another quaternion into this quaternion (MUTATING)
   * 
   * @param q - The quaternion to copy from
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(10, 20, 30, 40);
   * q2.copy(q1);  // q2 is now (1, 2, 3, 4), q1 unchanged
   */
  copy(q: Quaternion): this {
    this._elements[0] = q._elements[0]!;
    this._elements[1] = q._elements[1]!;
    this._elements[2] = q._elements[2]!;
    this._elements[3] = q._elements[3]!;
    return this;
  }

  /**
   * Checks if this quaternion equals another quaternion
   * Compares all components for exact equality.
   * 
   * @param q - The quaternion to compare with
   * @returns True if all components are equal, false otherwise
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(1, 2, 3, 4);
   * q1.equals(q2);  // Returns true
   */
  equals(q: Quaternion): boolean {
    return (
      this._elements[0] === q._elements[0]! &&
      this._elements[1] === q._elements[1]! &&
      this._elements[2] === q._elements[2]! &&
      this._elements[3] === q._elements[3]!
    );
  }

  /**
   * Checks if this quaternion equals another quaternion within epsilon tolerance
   * Useful for floating-point comparisons.
   * 
   * @param q - The quaternion to compare with
   * @param epsilon - Tolerance for comparison (default: 1e-6)
   * @returns True if all components are within epsilon, false otherwise
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(1.0000001, 2, 3, 4);
   * q1.equalsEpsilon(q2, 1e-5);  // Returns true
   */
  equalsEpsilon(q: Quaternion, epsilon: number = 1e-6): boolean {
    if (epsilon < 0) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Quaternion',
        method: 'equalsEpsilon',
        detail: 'Epsilon must be non-negative',
      });
    }
    return (
      Math.abs(this._elements[0]! - q._elements[0]!) <= epsilon &&
      Math.abs(this._elements[1]! - q._elements[1]!) <= epsilon &&
      Math.abs(this._elements[2]! - q._elements[2]!) <= epsilon &&
      Math.abs(this._elements[3]! - q._elements[3]!) <= epsilon
    );
  }

  /**
   * Sets this quaternion from an axis-angle representation (MUTATING)
   * 
   * @param axis - Rotation axis (will be normalized)
   * @param angle - Rotation angle in radians
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const axis = new Vector3(1, 0, 0);
   * const q = new Quaternion();
   * q.fromAxisAngle(axis, Math.PI / 2);  // 90 degree rotation around X axis
   */
  fromAxisAngle(axis: Vector3, angle: number): this {
    const halfAngle = angle * 0.5;
    const s = Math.sin(halfAngle);
    const normalizedAxis = Vector3.normalize(axis);

    this._elements[0] = normalizedAxis.x * s;
    this._elements[1] = normalizedAxis.y * s;
    this._elements[2] = normalizedAxis.z * s;
    this._elements[3] = Math.cos(halfAngle);

    return this;
  }

  /**
   * Static method: Creates a quaternion from an axis-angle representation
   * 
   * @param axis - Rotation axis (will be normalized)
   * @param angle - Rotation angle in radians
   * @returns New quaternion representing the rotation
   * 
   * @example
   * const axis = new Vector3(1, 0, 0);
   * const q = Quaternion.fromAxisAngle(axis, Math.PI / 2);  // 90 degree rotation around X axis
   */
  static fromAxisAngle(axis: Vector3, angle: number): Quaternion {
    const q = new Quaternion();
    return q.fromAxisAngle(axis, angle);
  }

  /**
   * Sets this quaternion from Euler angles (MUTATING)
   * Uses ZYX order (yaw-pitch-roll) by default.
   * 
   * @param x - Rotation around X axis (pitch) in radians
   * @param y - Rotation around Y axis (yaw) in radians
   * @param z - Rotation around Z axis (roll) in radians
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion();
   * q.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);  // 45°, 30°, 60°
   */
  fromEulerAngles(x: number, y: number, z: number): this {
    const halfX = x * 0.5;
    const halfY = y * 0.5;
    const halfZ = z * 0.5;

    const sx = Math.sin(halfX);
    const cx = Math.cos(halfX);
    const sy = Math.sin(halfY);
    const cy = Math.cos(halfY);
    const sz = Math.sin(halfZ);
    const cz = Math.cos(halfZ);

    // ZYX order (yaw-pitch-roll)
    this._elements[0] = sx * cy * cz - cx * sy * sz;
    this._elements[1] = cx * sy * cz + sx * cy * sz;
    this._elements[2] = cx * cy * sz - sx * sy * cz;
    this._elements[3] = cx * cy * cz + sx * sy * sz;

    return this;
  }

  /**
   * Static method: Creates a quaternion from Euler angles
   * Uses ZYX order (yaw-pitch-roll) by default.
   * 
   * @param x - Rotation around X axis (pitch) in radians
   * @param y - Rotation around Y axis (yaw) in radians
   * @param z - Rotation around Z axis (roll) in radians
   * @returns New quaternion representing the rotation
   * 
   * @example
   * const q = Quaternion.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
   */
  static fromEulerAngles(x: number, y: number, z: number): Quaternion {
    const q = new Quaternion();
    return q.fromEulerAngles(x, y, z);
  }

  /**
   * Converts this quaternion to a rotation matrix (Matrix3)
   * 
   * @returns New Matrix3 representing the rotation
   * 
   * @example
   * const q = new Quaternion();
   * q.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
   * const m = q.toRotationMatrix3();  // Returns Matrix3
   */
  toRotationMatrix3(): Matrix3 {
    const x = this._elements[0]!;
    const y = this._elements[1]!;
    const z = this._elements[2]!;
    const w = this._elements[3]!;

    // If q is not unit, compensate so the result is still a proper rotation matrix.
    const n = x * x + y * y + z * z + w * w;
    if (n === 0) {
      // Degenerate quaternion—treat as identity rotation
      return new Matrix3(
        1, 0, 0,  // Column 0
        0, 1, 0,  // Column 1
        0, 0, 1   // Column 2
      );
    }

    const s = 2 / n;

    const xx = x * x * s;
    const yy = y * y * s;
    const zz = z * z * s;

    const xy = x * y * s;
    const xz = x * z * s;
    const yz = y * z * s;

    const wx = w * x * s;
    const wy = w * y * s;
    const wz = w * z * s;

    // Column-major order
    return new Matrix3(
      1 - (yy + zz), (xy + wz), (xz - wy),      // Column 0: m00, m10, m20
      (xy - wz), 1 - (xx + zz), (yz + wx),      // Column 1: m01, m11, m21
      (xz + wy), (yz - wx), 1 - (xx + yy)       // Column 2: m02, m12, m22
    );
  }

  /**
   * Converts this quaternion to a rotation matrix (Matrix4)
   * The rotation is placed in the upper-left 3x3, with identity translation.
   * 
   * @returns New Matrix4 representing the rotation
   * 
   * @example
   * const q = new Quaternion();
   * q.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
   * const m = q.toRotationMatrix4();  // Returns Matrix4
   */
  toRotationMatrix4(): Matrix4 {
    const x = this._elements[0]!;
    const y = this._elements[1]!;
    const z = this._elements[2]!;
    const w = this._elements[3]!;

    // If q is not unit, compensate so the result is still a proper rotation matrix.
    const n = x * x + y * y + z * z + w * w;
    if (n === 0) {
      // Degenerate quaternion—treat as identity rotation
      return new Matrix4(
        1, 0, 0, 0,  // Column 0
        0, 1, 0, 0,  // Column 1
        0, 0, 1, 0,  // Column 2
        0, 0, 0, 1   // Column 3
      );
    }

    const s = 2 / n;

    const xx = x * x * s;
    const yy = y * y * s;
    const zz = z * z * s;

    const xy = x * y * s;
    const xz = x * z * s;
    const yz = y * z * s;

    const wx = w * x * s;
    const wy = w * y * s;
    const wz = w * z * s;

    // Column-major order
    return new Matrix4(
      1 - (yy + zz), (xy + wz), (xz - wy), 0,   // Column 0: m00, m10, m20, m30
      (xy - wz), 1 - (xx + zz), (yz + wx), 0,   // Column 1: m01, m11, m21, m31
      (xz + wy), (yz - wx), 1 - (xx + yy), 0,  // Column 2: m02, m12, m22, m32
      0, 0, 0, 1                                 // Column 3: m03, m13, m23, m33
    );
  }

  fromRotationMatrix3(m: Matrix3): this {
    // For column-major matrix, swap indices to get row-major semantics
    // m_rowcol in the algorithm = m.get(col, row) in column-major
    const m00 = m.get(0, 0);  // m[row 0][col 0]
    const m01 = m.get(1, 0);  // m[row 0][col 1] ← SWAPPED
    const m02 = m.get(2, 0);  // m[row 0][col 2] ← SWAPPED
    const m10 = m.get(0, 1);  // m[row 1][col 0] ← SWAPPED
    const m11 = m.get(1, 1);  // m[row 1][col 1]
    const m12 = m.get(2, 1);  // m[row 1][col 2] ← SWAPPED
    const m20 = m.get(0, 2);  // m[row 2][col 0] ← SWAPPED
    const m21 = m.get(1, 2);  // m[row 2][col 1] ← SWAPPED
    const m22 = m.get(2, 2);  // m[row 2][col 2]
  
    const trace = m00 + m11 + m22;
    let s: number;
  
    if (trace > 0) {
      s = Math.sqrt(trace + 1.0) * 2; // s = 4 * qw
      this._elements[3] = 0.25 * s;
      this._elements[0] = (m21 - m12) / s;
      this._elements[1] = (m02 - m20) / s;
      this._elements[2] = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      s = Math.sqrt(1.0 + m00 - m11 - m22) * 2; // s = 4 * qx
      this._elements[3] = (m21 - m12) / s;
      this._elements[0] = 0.25 * s;
      this._elements[1] = (m01 + m10) / s;
      this._elements[2] = (m02 + m20) / s;
    } else if (m11 > m22) {
      s = Math.sqrt(1.0 + m11 - m00 - m22) * 2; // s = 4 * qy
      this._elements[3] = (m02 - m20) / s;
      this._elements[0] = (m01 + m10) / s;
      this._elements[1] = 0.25 * s;
      this._elements[2] = (m12 + m21) / s;
    } else {
      s = Math.sqrt(1.0 + m22 - m00 - m11) * 2; // s = 4 * qz
      this._elements[3] = (m10 - m01) / s;
      this._elements[0] = (m02 + m20) / s;
      this._elements[1] = (m12 + m21) / s;
      this._elements[2] = 0.25 * s;
    }
  
    // Don't normalize - the algorithm already produces a unit quaternion
    // (unless there are numerical errors in the matrix)
    
    return this.normalize();
  }

  /**
   * Static method: Creates a quaternion from a rotation matrix (Matrix3)
   * 
   * @param m - The rotation matrix
   * @returns New quaternion representing the rotation
   * 
   * @example
   * const m = Matrix3.makeRotationZ(Math.PI / 2);
   * const q = Quaternion.fromRotationMatrix3(m);
   */
  static fromRotationMatrix3(m: Matrix3): Quaternion {
    const q = new Quaternion();
    return q.fromRotationMatrix3(m);
  }

  /**
   * Sets this quaternion from a rotation matrix (Matrix4) (MUTATING)
   * Extracts rotation from upper-left 3x3 portion.
   * 
   * @param m - The rotation matrix
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const m = Matrix4.makeRotationZ(Math.PI / 2);
   * const q = new Quaternion();
   * q.fromRotationMatrix4(m);  // q now represents the same rotation
   */
  fromRotationMatrix4(m: Matrix4): this {
    // For column-major matrix, swap indices to get row-major semantics
    const m00 = m.get(0, 0);  // m[row 0][col 0]
    const m01 = m.get(1, 0);  // m[row 0][col 1] ← SWAPPED
    const m02 = m.get(2, 0);  // m[row 0][col 2] ← SWAPPED
    const m10 = m.get(0, 1);  // m[row 1][col 0] ← SWAPPED
    const m11 = m.get(1, 1);  // m[row 1][col 1]
    const m12 = m.get(2, 1);  // m[row 1][col 2] ← SWAPPED
    const m20 = m.get(0, 2);  // m[row 2][col 0] ← SWAPPED
    const m21 = m.get(1, 2);  // m[row 2][col 1] ← SWAPPED
    const m22 = m.get(2, 2);  // m[row 2][col 2]
  
    const trace = m00 + m11 + m22;
    let s: number;
  
    if (trace > 0) {
      s = Math.sqrt(trace + 1.0) * 2;
      this._elements[3] = 0.25 * s;
      this._elements[0] = (m21 - m12) / s;
      this._elements[1] = (m02 - m20) / s;
      this._elements[2] = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
      this._elements[3] = (m21 - m12) / s;
      this._elements[0] = 0.25 * s;
      this._elements[1] = (m01 + m10) / s;
      this._elements[2] = (m02 + m20) / s;
    } else if (m11 > m22) {
      s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
      this._elements[3] = (m02 - m20) / s;
      this._elements[0] = (m01 + m10) / s;
      this._elements[1] = 0.25 * s;
      this._elements[2] = (m12 + m21) / s;
    } else {
      s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
      this._elements[3] = (m10 - m01) / s;
      this._elements[0] = (m02 + m20) / s;
      this._elements[1] = (m12 + m21) / s;
      this._elements[2] = 0.25 * s;
    }
  
    return this.normalize();
  }

  /**
   * Static method: Creates a quaternion from a rotation matrix (Matrix4)
   * Extracts rotation from upper-left 3x3 portion.
   * 
   * @param m - The rotation matrix
   * @returns New quaternion representing the rotation
   * 
   * @example
   * const m = Matrix4.makeRotationZ(Math.PI / 2);
   * const q = Quaternion.fromRotationMatrix4(m);
   */
  static fromRotationMatrix4(m: Matrix4): Quaternion {
    const q = new Quaternion();
    return q.fromRotationMatrix4(m);
  }

  
/**
 * Rotates a Vector3 by this quaternion
 * @param v - The vector to rotate
 * @returns A new rotated Vector3
 */
rotateVector(v: Vector3): Vector3 {
  // Convert vector to quaternion [v.x, v.y, v.z, 0]
  const vQuat = new Quaternion(v.x, v.y, v.z, 0);
  
  // Calculate q * v * q⁻¹
  const qConjugate = Quaternion.conjugate(this);
  const temp = Quaternion.multiply(this, vQuat);
  const result = Quaternion.multiply(temp, qConjugate);
  
  return new Vector3(result.x, result.y, result.z);
}

/**
 * Rotates a Vector3 by a quaternion (static version)
 * @param v - The vector to rotate
 * @param q - The quaternion to rotate by
 * @returns A new rotated Vector3
 */
static rotateVector(v: Vector3, q: Quaternion): Vector3 {
  return q.rotateVector(v);
}
  

  /**
   * Performs spherical linear interpolation (slerp) between this quaternion and another (MUTATING)
   * Provides smooth rotation interpolation along the shortest path.
   * 
   * @param q - Target quaternion
   * @param t - Interpolation parameter in [0, 1]
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
   * q1.slerp(q2, 0.5);  // q1 is now halfway between q1 and q2
   */
  slerp(q: Quaternion, t: number): this {
    const dot = this.dot(q);
    let q2 = q;

    // If dot product is negative, negate one quaternion to take shorter path
    if (dot < 0) {
      q2 = q.clone().multiplyScalar(-1);
    }

    // If quaternions are very close, use linear interpolation
    if (Math.abs(dot) > 0.9995) {
      return this.lerp(q2, t);
    }

    const theta = Math.acos(Math.abs(dot));
    const sinTheta = Math.sin(theta);
    const w1 = Math.sin((1 - t) * theta) / sinTheta;
    const w2 = Math.sin(t * theta) / sinTheta;

    this._elements[0] = this._elements[0]! * w1 + q2._elements[0]! * w2;
    this._elements[1] = this._elements[1]! * w1 + q2._elements[1]! * w2;
    this._elements[2] = this._elements[2]! * w1 + q2._elements[2]! * w2;
    this._elements[3] = this._elements[3]! * w1 + q2._elements[3]! * w2;

    return this.normalize();
  }

  /**
   * Performs linear interpolation followed by normalization (nlerp) (MUTATING)
   * Faster than slerp but may not follow the shortest path.
   * 
   * @param q - Target quaternion
   * @param t - Interpolation parameter in [0, 1]
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
   * q1.nlerp(q2, 0.5);  // q1 is now halfway between q1 and q2 (normalized lerp)
   */
  lerp(q: Quaternion, t: number): this {
    const oneMinusT = 1 - t;
    this._elements[0] = oneMinusT * this._elements[0]! + t * q._elements[0]!;
    this._elements[1] = oneMinusT * this._elements[1]! + t * q._elements[1]!;
    this._elements[2] = oneMinusT * this._elements[2]! + t * q._elements[2]!;
    this._elements[3] = oneMinusT * this._elements[3]! + t * q._elements[3]!;
    return this.normalize();
  }

  /**
   * Static method: Performs spherical linear interpolation (slerp) between two quaternions
   * 
   * @param a - First quaternion
   * @param b - Second quaternion
   * @param t - Interpolation parameter in [0, 1]
   * @returns New interpolated quaternion
   * 
   * @example
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
   * const q3 = Quaternion.slerp(q1, q2, 0.5);  // Returns interpolated quaternion
   */
  static slerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    return a.clone().slerp(b, t);
  }

  /**
   * Static method: Performs linear interpolation followed by normalization (nlerp) between two quaternions
   * 
   * @param a - First quaternion
   * @param b - Second quaternion
   * @param t - Interpolation parameter in [0, 1]
   * @returns New interpolated quaternion
   * 
   * @example
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
   * const q3 = Quaternion.nlerp(q1, q2, 0.5);  // Returns interpolated quaternion
   */
  static nlerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
    return a.clone().lerp(b, t);
  }

  /**
   * Extracts the axis-angle representation from this quaternion
   * 
   * @returns Object with axis (Vector3) and angle (number in radians)
   * 
   * @example
   * const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
   * const { axis, angle } = q.toAxisAngle();
   * // axis ≈ (1, 0, 0), angle ≈ π/2
   */
  toAxisAngle(): { axis: Vector3; angle: number } {
    const x = this._elements[0]!;
    const y = this._elements[1]!;
    const z = this._elements[2]!;
    const w = this._elements[3]!;

    // Normalize to ensure unit quaternion
    const len = Math.sqrt(x * x + y * y + z * z + w * w);
    if (len === 0) {
      // Zero quaternion - return default axis and zero angle
      return { axis: new Vector3(1, 0, 0), angle: 0 };
    }

    const invLen = 1 / len;
    const nx = x * invLen;
    const ny = y * invLen;
    const nz = z * invLen;
    const nw = w * invLen;

    // Clamp w to [-1, 1] to avoid numerical errors
    const clampedW = Math.max(-1, Math.min(1, nw));
    let angle = 2 * Math.acos(clampedW);
    // Normalize angle to [0, π] range
    if (angle > Math.PI) {
      angle = 2 * Math.PI - angle;
    }
    const sinHalfAngle = Math.sin(angle / 2);

    let axis: Vector3;
    if (sinHalfAngle > 1e-6) {
      // Normal case: extract axis from vector part
      axis = new Vector3(nx / sinHalfAngle, ny / sinHalfAngle, nz / sinHalfAngle);
      axis.normalize();
    } else {
      // Angle is very small or zero - use default axis
      axis = new Vector3(1, 0, 0);
    }

    return { axis, angle };
  }

  /**
   * Converts this quaternion to Euler angles (ZYX order - yaw-pitch-roll)
   * 
   * @returns Object with x (pitch), y (yaw), z (roll) in radians
   * 
   * @example
   * const q = Quaternion.fromEulerAngles(Math.PI / 4, Math.PI / 6, Math.PI / 3);
   * const { x, y, z } = q.toEulerAngles();
   */
  toEulerAngles(): { x: number; y: number; z: number } {
    const x = this._elements[0]!;
    const y = this._elements[1]!;
    const z = this._elements[2]!;
    const w = this._elements[3]!;

    // ZYX order (yaw-pitch-roll)
    const sinr_cosp = 2 * (w * x + y * z);
    const cosr_cosp = 1 - 2 * (x * x + y * y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (w * y - z * x);
    let pitch: number;
    if (Math.abs(sinp) >= 1) {
      pitch = Math.sign(sinp) * Math.PI / 2; // Use 90 degrees if out of range
    } else {
      pitch = Math.asin(sinp);
    }

    const siny_cosp = 2 * (w * z + x * y);
    const cosy_cosp = 1 - 2 * (y * y + z * z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { x: pitch, y: yaw, z: roll };
  }

  /**
   * Sets this quaternion to look at a target from a position (MUTATING)
   * 
   * @param from - Eye position
   * @param target - Target position
   * @param up - Up vector (default: (0, 1, 0))
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion();
   * q.fromLookAt(new Vector3(0, 0, 0), new Vector3(1, 0, 0), new Vector3(0, 1, 0));
   */
  fromLookAt(from: Vector3, target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): this {
    const forward = Vector3.normalize(Vector3.subtract(target, from));
    const right = Vector3.normalize(Vector3.cross(forward, up));
    const correctedUp = Vector3.normalize(Vector3.cross(right, forward));

    // Build rotation matrix from forward, right, up vectors
    // Column-major order
    const m00 = right.x;
    const m01 = right.y;
    const m02 = right.z;
    const m10 = correctedUp.x;
    const m11 = correctedUp.y;
    const m12 = correctedUp.z;
    const m20 = -forward.x;
    const m21 = -forward.y;
    const m22 = -forward.z;

    // Convert matrix to quaternion
    const trace = m00 + m11 + m22;
    let s: number;

    if (trace > 0) {
      s = Math.sqrt(trace + 1.0) * 2;
      this._elements[3] = 0.25 * s;
      this._elements[0] = (m21 - m12) / s;
      this._elements[1] = (m02 - m20) / s;
      this._elements[2] = (m10 - m01) / s;
    } else if (m00 > m11 && m00 > m22) {
      s = Math.sqrt(1.0 + m00 - m11 - m22) * 2;
      this._elements[3] = (m21 - m12) / s;
      this._elements[0] = 0.25 * s;
      this._elements[1] = (m01 + m10) / s;
      this._elements[2] = (m02 + m20) / s;
    } else if (m11 > m22) {
      s = Math.sqrt(1.0 + m11 - m00 - m22) * 2;
      this._elements[3] = (m02 - m20) / s;
      this._elements[0] = (m01 + m10) / s;
      this._elements[1] = 0.25 * s;
      this._elements[2] = (m12 + m21) / s;
    } else {
      s = Math.sqrt(1.0 + m22 - m00 - m11) * 2;
      this._elements[3] = (m10 - m01) / s;
      this._elements[0] = (m02 + m20) / s;
      this._elements[1] = (m12 + m21) / s;
      this._elements[2] = 0.25 * s;
    }

    return this.normalize();
  }

  /**
   * Static method: Creates a quaternion that looks at a target from a position
   * 
   * @param from - Eye position
   * @param target - Target position
   * @param up - Up vector (default: (0, 1, 0))
   * @returns New quaternion representing the look-at rotation
   * 
   * @example
   * const q = Quaternion.lookAt(new Vector3(0, 0, 0), new Vector3(1, 0, 0));
   */
  static lookAt(from: Vector3, target: Vector3, up: Vector3 = new Vector3(0, 1, 0)): Quaternion {
    return new Quaternion().fromLookAt(from, target, up);
  }

  /**
   * Sets this quaternion to rotate from vector a to vector b (MUTATING)
   * 
   * @param a - Source vector (will be normalized)
   * @param b - Destination vector (will be normalized)
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion();
   * q.fromRotationBetweenVectors(new Vector3(1, 0, 0), new Vector3(0, 1, 0));
   */
  fromRotationBetweenVectors(a: Vector3, b: Vector3): this {
    const v0 = Vector3.normalize(a);
    const v1 = Vector3.normalize(b);

    const dot = Vector3.dot(v0, v1);

    // If vectors are parallel, return identity
    if (dot > 0.999999) {
      this.identity();
      return this;
    }

    // If vectors are opposite, use perpendicular axis
    if (dot < -0.999999) {
      // Find a perpendicular vector
      let axis = Vector3.cross(new Vector3(1, 0, 0), v0);
      if (axis.lengthSquared() < 1e-6) {
        axis = Vector3.cross(new Vector3(0, 1, 0), v0);
      }
      axis.normalize();
      return this.fromAxisAngle(axis, Math.PI);
    }

    // General case: use cross product as rotation axis
    const axis = Vector3.cross(v0, v1).normalize();
    const angle = Math.acos(dot);

    return this.fromAxisAngle(axis, angle);
  }

  /**
   * Static method: Creates a quaternion that rotates from vector a to vector b
   * 
   * @param a - Source vector (will be normalized)
   * @param b - Destination vector (will be normalized)
   * @returns New quaternion representing the rotation
   * 
   * @example
   * const q = Quaternion.fromRotationBetweenVectors(new Vector3(1, 0, 0), new Vector3(0, 1, 0));
   */
  static fromRotationBetweenVectors(a: Vector3, b: Vector3): Quaternion {
    return new Quaternion().fromRotationBetweenVectors(a, b);
  }

  /**
   * Sets all components of this quaternion (MUTATING)
   * 
   * @param x - X component
   * @param y - Y component
   * @param z - Z component
   * @param w - W component
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion();
   * q.set(1, 2, 3, 4);
   */
  set(x: number, y: number, z: number, w: number): this {
    this._elements[0] = x;
    this._elements[1] = y;
    this._elements[2] = z;
    this._elements[3] = w;
    return this;
  }

  /**
   * Sets this quaternion from an array [x, y, z, w] (MUTATING)
   * 
   * @param array - Array-like object containing quaternion components
   * @param offset - Optional offset into the array (default: 0)
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = new Quaternion();
   * q.fromArray([1, 2, 3, 4]);
   * q.fromArray([0, 0, 0, 1, 0, 0, 0, 1], 4); // Start at index 4
   */
  fromArray(array: ArrayLike<number>, offset: number = 0): this {
    this._elements[0] = array[offset] ?? 0;
    this._elements[1] = array[offset + 1] ?? 0;
    this._elements[2] = array[offset + 2] ?? 0;
    this._elements[3] = array[offset + 3] ?? 1;
    return this;
  }

  /**
   * Converts this quaternion to an array [x, y, z, w]
   * 
   * @param array - Optional array to write into
   * @param offset - Optional offset into the array (default: 0)
   * @returns The array containing the quaternion components
   * 
   * @example
   * const q = new Quaternion(1, 2, 3, 4);
   * const arr = q.toArray(); // [1, 2, 3, 4]
   * const buffer = new Float32Array(8);
   * q.toArray(buffer, 4); // Writes to buffer[4..7]
   */
  toArray(array: number[] = [], offset: number = 0): number[] {
    array[offset] = this._elements[0]!;
    array[offset + 1] = this._elements[1]!;
    array[offset + 2] = this._elements[2]!;
    array[offset + 3] = this._elements[3]!;
    return array;
  }

  /**
   * Calculates the angle between this quaternion and another
   * 
   * @param q - The other quaternion
   * @returns Angle in radians (always positive, in range [0, PI])
   * 
   * @example
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
   * const angle = q1.angleTo(q2); // ≈ π/2
   */
  angleTo(q: Quaternion): number {
    const dot = this.dot(q);
    // Use absolute value to get shortest angle
    const absDot = Math.abs(dot);
    // Clamp to [0, 1] to avoid numerical errors (since we use abs, it's always positive)
    // For identical quaternions, dot will be very close to 1, so we need to clamp carefully
    const clampedDot = Math.min(1, absDot);
    // If dot is very close to 1, return 0 to avoid numerical errors
    if (clampedDot >= 1 - 1e-6) {
      return 0;
    }
    return 2 * Math.acos(clampedDot);
  }

  /**
   * Performs spherical cubic interpolation (SQUAD) for smoother interpolation
   * 
   * @param q0 - First control quaternion
   * @param q1 - Second control quaternion
   * @param q2 - Third control quaternion
   * @param q3 - Fourth control quaternion
   * @param t - Interpolation parameter in [0, 1]
   * @returns New interpolated quaternion
   * 
   * @example
   * const q0 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const q1 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 4);
   * const q2 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2);
   * const q3 = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 3 * Math.PI / 4);
   * const q = Quaternion.squad(q0, q1, q2, q3, 0.5);
   */
  static squad(q0: Quaternion, q1: Quaternion, q2: Quaternion, q3: Quaternion, t: number): Quaternion {
    // SQUAD: slerp(slerp(q0, q3, t), slerp(q1, q2, t), 2t(1-t))
    const slerp1 = Quaternion.slerp(q0, q3, t);
    const slerp2 = Quaternion.slerp(q1, q2, t);
    const t2 = 2 * t * (1 - t);
    return Quaternion.slerp(slerp1, slerp2, t2);
  }

  /**
   * Rotates this quaternion towards target by a maximum angle (MUTATING)
   * 
   * @param target - Target quaternion
   * @param maxRadians - Maximum rotation angle in radians
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), 0);
   * const target = Quaternion.fromAxisAngle(new Vector3(1, 0, 0), Math.PI);
   * q.rotateTowards(target, Math.PI / 4); // Rotates by at most π/4
   */
  rotateTowards(target: Quaternion, maxRadians: number): this {
    const angle = this.angleTo(target);
    if (angle === 0) {
      return this;
    }
    const t = Math.min(1, maxRadians / angle);
    return this.slerp(target, t);
  }

  /**
   * Pre-multiplies this quaternion: this = q * this (MUTATING)
   * 
   * @param q - The quaternion to pre-multiply by
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = new Quaternion(1, 0, 0, 1);
   * const q2 = new Quaternion(0, 1, 0, 1);
   * q1.premultiply(q2); // q1 = q2 * q1
   */
  premultiply(q: Quaternion): this {
    const ax = q._elements[0]!;
    const ay = q._elements[1]!;
    const az = q._elements[2]!;
    const aw = q._elements[3]!;
    const bx = this._elements[0]!;
    const by = this._elements[1]!;
    const bz = this._elements[2]!;
    const bw = this._elements[3]!;

    // Quaternion multiplication: q * this
    this._elements[0] = aw * bx + ax * bw + ay * bz - az * by;
    this._elements[1] = aw * by - ax * bz + ay * bw + az * bx;
    this._elements[2] = aw * bz + ax * by - ay * bx + az * bw;
    this._elements[3] = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  /**
   * Adds another quaternion to this one (MUTATING)
   * Useful for interpolation averaging.
   * 
   * @param q - The quaternion to add
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = new Quaternion(1, 2, 3, 4);
   * const q2 = new Quaternion(5, 6, 7, 8);
   * q1.add(q2); // q1 is now (6, 8, 10, 12)
   */
  add(q: Quaternion): this {
    this._elements[0] = this._elements[0]! + q._elements[0]!;
    this._elements[1] = this._elements[1]! + q._elements[1]!;
    this._elements[2] = this._elements[2]! + q._elements[2]!;
    this._elements[3] = this._elements[3]! + q._elements[3]!;
    return this;
  }

  /**
   * Subtracts another quaternion from this one (MUTATING)
   * 
   * @param q - The quaternion to subtract
   * @returns This quaternion (for chaining)
   * 
   * @example
   * const q1 = new Quaternion(5, 6, 7, 8);
   * const q2 = new Quaternion(1, 2, 3, 4);
   * q1.subtract(q2); // q1 is now (4, 4, 4, 4)
   */
  subtract(q: Quaternion): this {
    this._elements[0] = this._elements[0]! - q._elements[0]!;
    this._elements[1] = this._elements[1]! - q._elements[1]!;
    this._elements[2] = this._elements[2]! - q._elements[2]!;
    this._elements[3] = this._elements[3]! - q._elements[3]!;
    return this;
  }
}
