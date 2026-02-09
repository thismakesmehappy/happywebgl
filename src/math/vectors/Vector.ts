/**
 * Vector - Abstract base class for N-dimensional vectors
 * 
 * This is the base class for Vector2, Vector3, and Vector4.
 * It provides common vector operations that work for any dimension.
 * 
 * Vectors in graphics represent:
 * - Points in space (position vectors)
 * - Directions (normalized vectors)
 * - Colors (RGB/RGBA values)
 * - Texture coordinates
 * 
 * This class provides operations for vector math including:
 * - Basic arithmetic (add, subtract, multiply, divide)
 * - Dot product (scalar result)
 * - Length/magnitude calculations
 * - Normalization (unit vectors)
 * 
 * Method Patterns:
 * - Instance methods (e.g., v1.add(v2)): Mutate the calling vector
 * - Static methods (e.g., Vector.add(v1, v2)): Return a new vector, don't mutate inputs
 * 
 * This matches common patterns:
 * - Use instance methods when you want to modify in place (performance, chaining)
 * - Use static methods when you want immutability (functional style, like GLSL)
 * 
 * Type Safety:
 * - All operations require vectors of the same size
 * - Attempting operations between different-sized vectors will throw an error
 * - This ensures type safety and prevents dimension mismatches
 */
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { validate } from '../../utils/validate.js';

export abstract class Vector {
  /**
   * Vector components stored as Float32Array for WebGL compatibility and performance
   * Protected so subclasses can access it
   * 
   * Float32Array provides:
   * - Direct compatibility with WebGL buffer uploads
   * - Better performance than regular arrays
   * - Memory efficiency (32-bit floats)
   * - Consistency with Matrix4 implementation
   */
  protected _components: Float32Array;

  /**
   * Creates a new Vector
   * 
   * @param components - The components of the vector (variadic)
   * 
   * @example
   * // In subclasses:
   * const v2 = new Vector2(1, 2);       // (1, 2)
   * const v3 = new Vector3(1, 2, 3);     // (1, 2, 3)
   * const v4 = new Vector4(1, 2, 3, 4); // (1, 2, 3, 4)
   */
  constructor(...components: number[]) {
    this._components = new Float32Array(components);
  }

  get size(): number {
    return this._components.length;
  }

  /**
   * Gets the components as a regular array
   * For compatibility with code that expects number[]
   */
  get components(): number[] {
    return Array.from(this._components);
  }

  /**
   * Gets the components as Float32Array
   * This is the format expected by WebGL buffer uploads
   * Similar to Matrix4.elements
   * 
   * @returns Float32Array of vector components
   * 
   * @example
   * const v = new Vector3(1, 2, 3);
   * gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, v.elements);
   */
  get elements(): Float32Array {
    return this._components;
  }

  get(index: number): number | undefined {
    validate.number.inRange(
      index,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Vector',
        method: 'get',
      },
      0,
      this._components.length - 1,
      {
        requireFinite: false,
        detail: `Index out of bounds for ${this.constructor.name} of size ${this._components.length}`,
      },
    );

    return this._components[index];
  }

  set(index: number, value: number): void {
    validate.number.inRange(
      index,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Vector',
        method: 'set',
      },
      0,
      this._components.length - 1,
      {
        requireFinite: false,
        detail: `Index out of bounds for ${this.constructor.name} of size ${this._components.length}`,
      },
    );
    this._components[index] = value;
  }

  /**
   * Adds another vector to this vector (MUTATING)
   * Modifies this vector in place.
   * 
   * Requires vectors of the same size for type safety.
   * 
   * @param v - Vector to add (must be same size)
   * @returns This vector (for chaining)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = new Vector3(4, 5, 6);
   * v1.add(v2);  // v1 is now (5, 7, 9)
   */
  add(v: Vector): this {
    this._validateSameSize(this, v, 'add');

    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = this._components[i]! + v._components[i]!;
    }
    return this;
  }

  /**
   * Static method: Adds two vectors and returns a new vector
   * Similar to GLSL: vec c = a + b;
   * 
   * Requires vectors of the same size. Returns a new vector of the same type.
   * 
   * @param a - First vector
   * @param b - Second vector (must be same type and size as a)
   * @returns New vector with the result (same type as a)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = new Vector3(4, 5, 6);
   * const v3 = Vector3.add(v1, v2);  // Returns Vector3, neither v1 nor v2 changed
   */
  static add<T extends Vector>(a: T, b: T): T {
    a._validateSameSize(a, b, 'add');

    const components = new Float32Array(a._components.length);
    for (let i = 0; i < a._components.length; i++) {
      components[i] = a._components[i]! + b._components[i]!;
    }

    // Return new instance of the same type as 'a'
    return new (a.constructor as new (...args: number[]) => T)(...components);
  }

  /**
   * Calculates the squared length (magnitude) of this vector
   * 
   * This is faster than length() because it avoids the square root operation.
   * Useful when you only need to compare lengths (e.g., distance checks).
   * 
   * Formula: sum of all components squared
   * 
   * @returns The squared length of the vector
   * 
   * @example
   * const v = new Vector3(3, 4, 0);
   * v.lengthSquared();  // Returns 25 (not √(9 + 16 + 0))
   * 
   * // Compare distances without sqrt:
   * if (v1.lengthSquared() < v2.lengthSquared()) {
   *   // v1 is closer to origin
   * }
   */
  lengthSquared(): number {
    return this._components.reduce((sum, component) => sum + component * component, 0);
  }

  /**
   * Calculates the length (magnitude) of this vector
   * 
   * The length is the distance from the origin to the point
   * represented by this vector.
   * 
   * Formula: √(sum of all components squared)
   * 
   * Note: If you only need to compare lengths, use lengthSquared() instead
   * for better performance (avoids square root).
   * 
   * @returns The length of the vector
   * 
   * @example
   * const v = new Vector3(3, 4, 0);
   * v.length();  // Returns 5 (√(9 + 16 + 0))
   */
  length(): number {
    return Math.sqrt(this.lengthSquared());
  }

  /**
   * Subtracts another vector from this vector (MUTATING)
   * Modifies this vector in place.
   * 
   * Requires vectors of the same size for type safety.
   * 
   * @param v - Vector to subtract (must be same size)
   * @returns This vector (for chaining)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(5, 7, 9);
   * const v2 = new Vector3(4, 5, 6);
   * v1.subtract(v2);  // v1 is now (1, 2, 3)
   */
  subtract(v: Vector): this {
    this._validateSameSize(this, v, 'subtract');

    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = this._components[i]! - v._components[i]!;
    }
    return this;
  }

  /**
   * Static method: Subtracts two vectors and returns a new vector
   * Similar to GLSL: vec c = a - b;
   * 
   * Requires vectors of the same size. Returns a new vector of the same type.
   * 
   * @param a - First vector (minuend)
   * @param b - Second vector (subtrahend, must be same type and size as a)
   * @returns New vector with the result (a - b, same type as a)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(5, 7, 9);
   * const v2 = new Vector3(4, 5, 6);
   * const v3 = Vector3.subtract(v1, v2);  // Returns Vector3, v3 is (1, 2, 3), v1 and v2 unchanged
   */
  static subtract<T extends Vector>(a: T, b: T): T {
    a._validateSameSize(a, b, 'subtract');

    const components = new Float32Array(a._components.length);
    for (let i = 0; i < a._components.length; i++) {
      components[i] = a._components[i]! - b._components[i]!;
    }

    // Return new instance of the same type as 'a'
    return new (a.constructor as new (...args: number[]) => T)(...components);
  }

  /**
   * Multiplies this vector by a scalar (MUTATING)
   * Scales the vector by the given factor.
   * 
   * @param scalar - The scalar value to multiply by
   * @returns This vector (for chaining)
   * 
   * @example
   * const v = new Vector3(1, 2, 3);
   * v.multiplyScalar(2);  // v is now (2, 4, 6)
   */
  multiplyScalar(scalar: number): this {
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = this._components[i]! * scalar;
    }
    return this;
  }

  /**
   * Static method: Multiplies a vector by a scalar and returns a new vector
   * Similar to GLSL: vec b = a * scalar;
   * 
   * @param v - The vector to scale
   * @param scalar - The scalar value to multiply by
   * @returns New vector with the result (same type as v)
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = Vector3.multiplyScalar(v1, 2);  // Returns Vector3, v2 is (2, 4, 6), v1 unchanged
   */
  static multiplyScalar<T extends Vector>(v: T, scalar: number): T {
    const components = new Float32Array(v._components.length);
    for (let i = 0; i < v._components.length; i++) {
      components[i] = v._components[i]! * scalar;
    }
    // Return new instance of the same type as 'v'
    return new (v.constructor as new (...args: number[]) => T)(...components);
  }

  /**
   * Divides this vector by a scalar (MUTATING)
   * Scales the vector by the inverse of the given factor.
   * 
   * @param scalar - The scalar value to divide by
   * @returns This vector (for chaining)
   * @throws Error if scalar is zero
   * 
   * @example
   * const v = new Vector3(4, 6, 8);
   * v.divideScalar(2);  // v is now (2, 3, 4)
   */
  divideScalar(scalar: number): this {
    if (scalar === 0) {
      throw new AppError(ErrorCode.MATH_DIVIDE_BY_ZERO, {
        resource: 'Vector',
        method: 'divideScalar',
        detail: 'Cannot divide vector by zero',
      });
    }
    return this.multiplyScalar(1 / scalar);
  }

  /**
   * Static method: Divides a vector by a scalar and returns a new vector
   * Similar to GLSL: vec b = a / scalar;
   * 
   * @param v - The vector to divide
   * @param scalar - The scalar value to divide by
   * @returns New vector with the result (same type as v)
   * @throws Error if scalar is zero
   * 
   * @example
   * const v1 = new Vector3(4, 6, 8);
   * const v2 = Vector3.divideScalar(v1, 2);  // Returns Vector3, v2 is (2, 3, 4), v1 unchanged
   */
  static divideScalar<T extends Vector>(v: T, scalar: number): T {
    if (scalar === 0) {
      throw new AppError(ErrorCode.MATH_DIVIDE_BY_ZERO, {
        resource: 'Vector',
        method: 'divideScalar',
        detail: 'Cannot divide vector by zero',
      });
    }
    return Vector.multiplyScalar(v, 1 / scalar);
  }

  /**
   * Normalizes this vector to unit length (MUTATING)
   * Makes the vector have length = 1 while preserving its direction.
   * 
   * If the vector is the zero vector, it remains unchanged
   * (cannot normalize a zero vector).
   * 
   * @returns This vector (for chaining)
   * 
   * @example
   * const v = new Vector3(3, 4, 0);
   * v.normalize();  // v is now (0.6, 0.8, 0), length = 1
   */
  normalize(): this {
    const len = this.length();
    if (len === 0) {
      // Cannot normalize zero vector - leave it unchanged
      return this;
    }
    return this.divideScalar(len);
  }

  /**
   * Static method: Normalizes a vector to unit length and returns a new vector
   * Similar to GLSL: vec normalized = normalize(v);
   * 
   * @param v - The vector to normalize
   * @returns New normalized vector (length = 1, same type as v)
   *          If v is zero vector, returns zero vector of same type
   * 
   * @example
   * const v1 = new Vector3(3, 4, 0);
   * const v2 = Vector3.normalize(v1);  // Returns Vector3, v2 is (0.6, 0.8, 0), v1 unchanged
   */
  static normalize<T extends Vector>(v: T): T {
    const len = v.length();
    if (len === 0) {
      // Cannot normalize zero vector - return zero vector of same type
      const zeroComponents = new Float32Array(v.size);
      return new (v.constructor as new (...args: number[]) => T)(...zeroComponents);
    }
    return Vector.divideScalar(v, len);
  }

  /**
   * Linearly interpolates this vector towards another vector (MUTATING)
   * Interpolates between this vector and v by parameter t.
   * 
   * Formula: this = (1 - t) * this + t * v
   * When t = 0, result equals this vector
   * When t = 1, result equals v
   * When t = 0.5, result is halfway between this and v
   * 
   * Requires vectors of the same size.
   * 
   * @param v - Target vector to interpolate towards (must be same size)
   * @param t - Interpolation parameter, typically in [0, 1]
   * @returns This vector (for chaining)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(0, 0, 0);
   * const v2 = new Vector3(10, 20, 30);
   * v1.lerp(v2, 0.5);  // v1 is now (5, 10, 15)
   */
  lerp(v: Vector, t: number): this {
    this._validateSameSize(this, v, 'lerp');

    const oneMinusT = 1 - t;
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = oneMinusT * this._components[i]! + t * v._components[i]!;
    }
    return this;
  }

  /**
   * Static method: Linearly interpolates between two vectors and returns a new vector
   * Similar to GLSL: vec c = mix(a, b, t);
   * 
   * Formula: result = (1 - t) * a + t * b
   * When t = 0, result equals a
   * When t = 1, result equals b
   * When t = 0.5, result is halfway between a and b
   * 
   * Requires vectors of the same size. Returns a new vector of the same type.
   * 
   * @param a - First vector (when t = 0)
   * @param b - Second vector (when t = 1, must be same type and size as a)
   * @param t - Interpolation parameter, typically in [0, 1]
   * @returns New interpolated vector (same type as a)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(0, 0, 0);
   * const v2 = new Vector3(10, 20, 30);
   * const v3 = Vector3.lerp(v1, v2, 0.5);  // Returns Vector3, v3 is (5, 10, 15), v1 and v2 unchanged
   */
  static lerp<T extends Vector>(a: T, b: T, t: number): T {
    a._validateSameSize(a, b, 'lerp');

    const oneMinusT = 1 - t;
    const components = new Float32Array(a._components.length);
    for (let i = 0; i < a._components.length; i++) {
      components[i] = oneMinusT * a._components[i]! + t * b._components[i]!;
    }

    // Return new instance of the same type as 'a'
    return new (a.constructor as new (...args: number[]) => T)(...components);
  }

  /**
   * Creates a new vector with the same values as this vector
   * Non-mutating - returns a new instance of the same type.
   * 
   * @returns A new vector with the same values (same type as this)
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = v1.clone();  // v2 is a new Vector3(1, 2, 3), v1 unchanged
   */
  clone(): this {
    return new (this.constructor as new (...args: number[]) => this)(...this._components);
  }

  /**
   * Copies the values from another vector into this vector (MUTATING)
   * Modifies this vector to have the same values as the source vector.
   * 
   * Requires vectors of the same size.
   * 
   * @param v - The vector to copy from (must be same size as this)
   * @returns This vector (for chaining)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector4(1, 2, 3, 4);
   * const v2 = new Vector4(10, 20, 30, 40);
   * v2.copy(v1);  // v2 is now (1, 2, 3, 4), v1 unchanged
   */
  copy(v: Vector): this {
    this._validateSameSize(this, v, 'copy');
    this._components.set(v._components);
    return this;
  }

  /**
   * Checks if this vector equals another vector
   * Compares all components for exact equality.
   * 
   * Requires vectors of the same size.
   * 
   * Note: Uses strict equality (===). For floating-point comparisons with
   * tolerance, use `equalsEpsilon()` instead.
   * 
   * @param v - The vector to compare with (must be same size)
   * @returns True if all components are equal, false otherwise
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = new Vector3(1, 2, 3);
   * v1.equals(v2);  // Returns true
   */
  equals(v: Vector): boolean {
    if (!this._areSameSize(this, v)) {
      return false;
    }
    return this._components.every((component, index) => component === v._components[index]);
  }

  /**
   * Checks if this vector equals another vector within a tolerance
   * Useful for floating-point comparisons where exact equality may fail.
   * 
   * Requires vectors of the same size.
   * 
   * @param v - The vector to compare with (must be same size)
   * @param epsilon - Tolerance value (default: 0.00001)
   * @returns True if all components are within epsilon, false otherwise
   * 
   * @example
   * const v1 = new Vector3(1.0, 2.0, 3.0);
   * const v2 = new Vector3(1.000001, 2.000001, 3.000001);
   * v1.equalsEpsilon(v2, 0.00001);  // Returns true
   */
  equalsEpsilon(v: Vector, epsilon: number = 0.00001): boolean {
    if (!this._areSameSize(this, v)) {
      return false;
    }
    return this._components.every((component, index) => Math.abs(component - v._components[index]!) <= epsilon);
  }

  /**
   * Static method: Checks if two vectors are equal
   * Similar to GLSL comparison patterns.
   * 
   * Requires vectors of the same size.
   * 
   * @param a - First vector
   * @param b - Second vector (must be same type and size as a)
   * @returns True if all components are equal, false otherwise
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = new Vector3(1, 2, 3);
   * Vector3.equals(v1, v2);  // Returns true
   */
  static equals<T extends Vector>(a: T, b: T): boolean {
    if (!a._areSameSize(a, b)) {
      return false;
    }
    return a._components.every((component, index) => component === b._components[index]);
  }

  /**
   * Static method: Checks if two vectors are equal within a tolerance
   * Useful for floating-point comparisons where exact equality may fail.
   * 
   * Requires vectors of the same size.
   * 
   * @param a - First vector
   * @param b - Second vector (must be same type and size as a)
   * @param epsilon - Tolerance value (default: 0.00001)
   * @returns True if all components are within epsilon, false otherwise
   * 
   * @example
   * const v1 = new Vector3(1.0, 2.0, 3.0);
   * const v2 = new Vector3(1.000001, 2.000001, 3.000001);
   * Vector3.equalsEpsilon(v1, v2, 0.00001);  // Returns true
   */
  static equalsEpsilon<T extends Vector>(a: T, b: T, epsilon: number = 0.00001): boolean {
    if (!a._areSameSize(a, b)) {
      return false;
    }
    return a._components.every((component, index) => Math.abs(component - b._components[index]!) <= epsilon);
  }

  /**
   * Calculates the dot product with another vector
   * 
   * The dot product is a scalar value that represents:
   * - The cosine of the angle between two vectors (when normalized)
   * - How much one vector points in the direction of another
   * - Used extensively in lighting calculations
   * 
   * Formula: a · b = sum of (a[i] * b[i]) for all components
   * 
   * Properties:
   * - If vectors are perpendicular: dot = 0
   * - If vectors point same direction: dot > 0
   * - If vectors point opposite directions: dot < 0
   * - If both are normalized: dot = cos(angle)
   * 
   * Requires vectors of the same size.
   * 
   * @param v - The vector to calculate dot product with (must be same size)
   * @returns The dot product (scalar value)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(1, 0, 0);
   * const v2 = new Vector3(0, 1, 0);
   * v1.dot(v2);  // Returns 0 (perpendicular)
   * 
   * @example
   * // In lighting: how much light hits a surface
   * const normal = new Vector3(0, 1, 0).normalize();
   * const lightDir = new Vector3(0.707, 0.707, 0).normalize();
   * const intensity = normal.dot(lightDir);  // cos(angle)
   */
  dot(v: Vector): number {
    this._validateSameSize(this, v, 'dot');
    return this._components.reduce((sum, component, index) => sum + component * v._components[index]!, 0);
  }

  /**
   * Static method: Calculates the dot product of two vectors
   * Similar to GLSL: float d = dot(a, b);
   * 
   * Requires vectors of the same size.
   * 
   * @param a - First vector
   * @param b - Second vector (must be same type and size as a)
   * @returns The dot product (scalar value)
   * @throws Error if vectors are different sizes
   * 
   * @example
   * const v1 = new Vector3(1, 2, 3);
   * const v2 = new Vector3(4, 5, 6);
   * Vector3.dot(v1, v2);  // Returns 32 (1*4 + 2*5 + 3*6)
   */
  static dot<T extends Vector>(a: T, b: T): number {
    a._validateSameSize(a, b, 'dot');
    return a._components.reduce((sum, component, index) => sum + component * b._components[index]!, 0);
  }

  /**
   * Checks if two vectors have the same size
   * Used internally for type safety validation
   */
  protected _areSameSize(a: Vector, b: Vector): boolean {
    return a.size === b.size;
  }

  /**
   * Validates that two vectors have the same size
   * Throws an error if they don't match
   */
  protected _validateSameSize(a: Vector, b: Vector, methodName: string): void {
    if (!this._areSameSize(a, b)) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Vector',
        method: methodName,
        detail:
          `Vectors must have the same size: ${a.constructor.name} (size ${a.size}) and ` +
          `${b.constructor.name} (size ${b.size})`,
      });
    }
  }

  /**
   * Validates that all components are finite numbers
   * Throws an error if any component is NaN or Infinity
   * @internal
   */
  protected _validateFinite(methodName: string): void {
    if (!this.isFinite()) {
      const nonFinite = this._components.filter(c => !Number.isFinite(c));
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Vector',
        method: methodName,
        detail: `vector contains non-finite values (${nonFinite.join(', ')})`,
      });
    }
  }

  // ============================================================================
  // Type Checking Methods
  // ============================================================================
  // These methods check the numeric properties of vector components.
  // Useful for validating data before passing to WebGL integer uniforms.

  /**
   * Checks if all components are finite numbers (not NaN or Infinity)
   *
   * @returns True if all components are finite, false otherwise
   *
   * @example
   * new Vector3(1, 2, 3).isFinite();        // true
   * new Vector3(1, NaN, 3).isFinite();      // false
   * new Vector3(1, Infinity, 3).isFinite(); // false
   */
  isFinite(): boolean {
    return this._components.every(c => Number.isFinite(c));
  }

  /**
   * Checks if all components are integers
   *
   * @returns True if all components are integers, false otherwise
   *
   * @example
   * new Vector3(1, 2, 3).isInteger();     // true
   * new Vector3(1.5, 2, 3).isInteger();   // false
   */
  isInteger(): boolean {
    return this._components.every(c => Number.isInteger(c));
  }

  /**
   * Checks if all components are non-negative integers (valid for unsigned int)
   *
   * @returns True if all components are non-negative integers, false otherwise
   *
   * @example
   * new Vector3(1, 2, 3).isUnsignedInteger();   // true
   * new Vector3(-1, 2, 3).isUnsignedInteger();  // false
   * new Vector3(1.5, 2, 3).isUnsignedInteger(); // false
   */
  isUnsignedInteger(): boolean {
    return this._components.every(c => Number.isInteger(c) && c >= 0);
  }

  // ============================================================================
  // Rounding Methods
  // ============================================================================
  // These methods convert floating-point components to integers using different
  // rounding strategies. All methods validate that values are finite first.
  //
  // WebGL silently converts floats to integers using truncation, which can cause
  // subtle bugs. These methods make the conversion explicit and safe.

  /**
   * Truncates all components toward zero (MUTATING)
   *
   * This is the default JavaScript/WebGL behavior for float-to-int conversion.
   * - 3.7 → 3
   * - -3.7 → -3
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.7, -2.3, 3.9).truncate(); // (1, -2, 3)
   */
  truncate(): this {
    this._validateFinite('truncate');
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = Math.trunc(this._components[i]!);
    }
    return this;
  }

  /**
   * Static method: Truncates all components and returns a new vector
   *
   * @param v - The vector to truncate
   * @returns New vector with truncated values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static truncate<T extends Vector>(v: T): T {
    return v.clone().truncate();
  }

  /**
   * Floors all components toward negative infinity (MUTATING)
   *
   * Useful for grid/tile coordinates where you want consistent rounding down.
   * - 3.7 → 3
   * - -3.7 → -4
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.7, -2.3, 3.9).floor(); // (1, -3, 3)
   */
  floor(): this {
    this._validateFinite('floor');
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = Math.floor(this._components[i]!);
    }
    return this;
  }

  /**
   * Static method: Floors all components and returns a new vector
   *
   * @param v - The vector to floor
   * @returns New vector with floored values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static floor<T extends Vector>(v: T): T {
    return v.clone().floor();
  }

  /**
   * Ceils all components toward positive infinity (MUTATING)
   *
   * Useful for size calculations where you want to round up.
   * - 3.1 → 4
   * - -3.7 → -3
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.1, -2.3, 3.9).ceil(); // (2, -2, 4)
   */
  ceil(): this {
    this._validateFinite('ceil');
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = Math.ceil(this._components[i]!);
    }
    return this;
  }

  /**
   * Static method: Ceils all components and returns a new vector
   *
   * @param v - The vector to ceil
   * @returns New vector with ceiled values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static ceil<T extends Vector>(v: T): T {
    return v.clone().ceil();
  }

  /**
   * Rounds all components to nearest integer (MUTATING)
   *
   * Standard rounding: 0.5 rounds up.
   * - 3.4 → 3
   * - 3.5 → 4
   * - -3.5 → -3
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.4, 2.5, -3.5).round(); // (1, 3, -3)
   */
  round(): this {
    this._validateFinite('round');
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = Math.round(this._components[i]!);
    }
    return this;
  }

  /**
   * Static method: Rounds all components and returns a new vector
   *
   * @param v - The vector to round
   * @returns New vector with rounded values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static round<T extends Vector>(v: T): T {
    return v.clone().round();
  }

  /**
   * Expands all components away from zero (MUTATING)
   *
   * Negative values are floored, positive values are ceiled.
   * Useful when you want to ensure you never underestimate magnitude.
   * - 3.1 → 4
   * - -3.1 → -4
   * - 0 → 0
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.1, -2.1, 0).expand(); // (2, -3, 0)
   */
  expand(): this {
    this._validateFinite('expand');
    for (let i = 0; i < this._components.length; i++) {
      const c = this._components[i]!;
      this._components[i] = c >= 0 ? Math.ceil(c) : Math.floor(c);
    }
    return this;
  }

  /**
   * Static method: Expands all components away from zero and returns a new vector
   *
   * @param v - The vector to expand
   * @returns New vector with expanded values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static expand<T extends Vector>(v: T): T {
    return v.clone().expand();
  }

  // ============================================================================
  // Clamping Methods
  // ============================================================================

  /**
   * Clamps all components to be non-negative (MUTATING)
   *
   * Negative values become 0. Does not round - use with a rounding method.
   * - 3.5 → 3.5
   * - -3.5 → 0
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * new Vector3(1.5, -2.5, 3.5).clampNonNegative(); // (1.5, 0, 3.5)
   */
  clampNonNegative(): this {
    this._validateFinite('clampNonNegative');
    for (let i = 0; i < this._components.length; i++) {
      this._components[i] = Math.max(0, this._components[i]!);
    }
    return this;
  }

  /**
   * Static method: Clamps all components to be non-negative and returns a new vector
   *
   * @param v - The vector to clamp
   * @returns New vector with clamped values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static clampNonNegative<T extends Vector>(v: T): T {
    return v.clone().clampNonNegative();
  }

  // ============================================================================
  // Integer Conversion Methods
  // ============================================================================
  // Convenience methods for preparing vectors for WebGL integer uniforms.

  /**
   * Converts this vector to integers for use with int uniforms (ivec) (MUTATING)
   *
   * This method validates all values are finite, then truncates to integers.
   * Use this before passing a Vector to setUniform*i methods.
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * const v = new Vector3(1.7, -2.3, 3.9);
   * v.toInt(); // (1, -2, 3)
   * program.setUniform3i('uCoords', v);
   */
  toInt(): this {
    return this.truncate();
  }

  /**
   * Static method: Converts a vector to integers and returns a new vector
   *
   * @param v - The vector to convert
   * @returns New vector with integer values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static toInt<T extends Vector>(v: T): T {
    return v.clone().toInt();
  }

  /**
   * Converts this vector to unsigned integers for use with uint uniforms (uvec) (MUTATING)
   *
   * This method validates all values are finite, clamps negatives to 0,
   * then truncates to integers.
   * Use this before passing a Vector to setUniform*ui methods.
   *
   * @returns This vector (for chaining)
   * @throws Error if any component is NaN or Infinity
   *
   * @example
   * const v = new Vector3(1.7, -2.3, 3.9);
   * v.toUint(); // (1, 0, 3)
   * program.setUniform3ui('uCoords', v);
   */
  toUint(): this {
    this._validateFinite('toUint');
    return this.clampNonNegative().truncate();
  }

  /**
   * Static method: Converts a vector to unsigned integers and returns a new vector
   *
   * @param v - The vector to convert
   * @returns New vector with unsigned integer values (same type as v)
   * @throws Error if any component is NaN or Infinity
   */
  static toUint<T extends Vector>(v: T): T {
    return v.clone().toUint();
  }
}
