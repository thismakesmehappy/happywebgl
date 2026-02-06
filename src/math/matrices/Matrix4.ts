import { Matrix } from './Matrix.js';
import { SquareMatrix } from './SquareMatrix.js';
import { Vector3 } from '../vectors/Vector3.js';
import { Vector4 } from '../vectors/Vector4.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Matrix4 - A 4x4 matrix class
 * 
 * Extends SquareMatrix to provide 4x4-specific functionality.
 * 
 * Matrices in 3D graphics are used for:
 * - Transformations (translation, rotation, scale)
 * - View matrices (camera transformations)
 * - Projection matrices (perspective/orthographic)
 * - Model-View-Projection (MVP) composition
 * 
 * Storage Format:
 * - Column-major order (matches WebGL/OpenGL)
 * - 16 elements stored as flat array: [m00, m10, m20, m30, m01, m11, m21, m31, ...]
 * - Column 0: elements 0-3
 * - Column 1: elements 4-7
 * - Column 2: elements 8-11
 * - Column 3: elements 12-15
 * 
 * Element Access:
 * - m.get(column, row) - Explicit method access (inherited from Matrix)
 * - m.elements[column * 4 + row] - Direct array access (inherited from Matrix)
 * - m[column][row] - Proxy-based indexing (column-major, Matrix4-specific)
 * 
 * Method Patterns:
 * - Instance methods (e.g., m1.multiply(m2)): Mutate the calling matrix
 * - Static methods (e.g., Matrix4.multiply(m1, m2)): Return a new matrix, don't mutate inputs
 */
export class Matrix4 extends SquareMatrix {
  /**
   * Transpose type for this matrix (square matrix: transpose is itself)
   * Required for type-safe static transpose() method
   */
  static readonly TransposeType = Matrix4;

  /**
   * Creates a new Matrix4
   * 
   * @param elements - Matrix elements in column-major order (variadic)
   *                  If no arguments provided, creates identity matrix
   *                  If 16 arguments provided, uses them directly
   * 
   * @example
   * const m1 = new Matrix4();  // Identity matrix (default)
   * const m2 = new Matrix4(
   *   1, 0, 0, 0,  // Column 0
   *   0, 1, 0, 0,  // Column 1
   *   0, 0, 1, 0,  // Column 2
   *   0, 0, 0, 1   // Column 3
   * );  // Identity matrix (explicit, column-major)
   */
  /**
   * Gets the number of rows (always 4 for Matrix4)
   */
  get rows(): number {
    return 4;
  }

  /**
   * Gets the number of columns (always 4 for Matrix4)
   */
  get columns(): number {
    return 4;
  }

  constructor(...elements: number[]) {
    // Default to identity matrix if no arguments provided
    if (elements.length === 0) {
      elements = [
        1, 0, 0, 0,  // Column 0: identity
        0, 1, 0, 0,  // Column 1: identity
        0, 0, 1, 0,  // Column 2: identity
        0, 0, 0, 1   // Column 3: identity
      ];
    }
    
    // Pass variadic numbers to base class (converts to Float32Array internally)
    super(...elements);
    
    // Validate size after super() call
    this._validateSize();
    
    // Set up Proxy-based indexing using base class helper
    return this._setupProxy();
  }

  /**
   * Creates an identity matrix
   * 
   * @returns A new identity matrix
   * 
   * @example
   * const m = Matrix4.identity();
   */
  static identity(): Matrix4 {
    return new Matrix4();
  }

  /**
   * Sets this matrix to the identity matrix (MUTATING)
   * 
   * Inherits generic implementation from Matrix base class.
   * Can be overridden for optimization if needed.
   * 
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeIdentity();
   */
  // Inherited from Matrix.makeIdentity() - no override needed


  /**
   * Multiplies two matrices and stores the result in this matrix (MUTATING)
   * Result: this = a * b
   * 
   * Implements the abstract method from Matrix base class.
   * 
   * @param a - First matrix (must be Matrix4)
   * @param b - Second matrix (must be Matrix4)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are not Matrix4 or incompatible sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * const m3 = new Matrix4();
   * m3.multiplyMatrices(m1, m2);  // m3 = m1 * m2
   */
  multiplyMatrices(a: Matrix, b: Matrix): this {
    // Validate: a.columns === b.rows (compatibility)
    if (a.columns !== b.rows) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix4',
        method: 'multiplyMatrices',
        detail: `Matrix multiplication incompatible: ${a.rows}x${a.columns} * ${b.rows}x${b.columns}`,
      });
    }
    
    // Validate: result size matches this matrix (must be 4x4)
    if (this.rows !== a.rows || this.columns !== b.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix4',
        method: 'multiplyMatrices',
        detail:
          `Result matrix size mismatch: expected ${a.rows}x${b.columns}, ` +
          `got ${this.rows}x${this.columns}`,
      });
    }
    
    // If both inputs are 4x4, use optimized implementation
    if (a.rows === 4 && a.columns === 4 && b.rows === 4 && b.columns === 4) {
      // TypeScript narrowing: we know these are 4x4 matrices, safe to access _elements
      const ae = (a as any)._elements as Float32Array;
      const be = (b as any)._elements as Float32Array;
      const te = this._elements;

      const a11 = ae[0]!, a12 = ae[4]!, a13 = ae[8]!, a14 = ae[12]!;
      const a21 = ae[1]!, a22 = ae[5]!, a23 = ae[9]!, a24 = ae[13]!;
      const a31 = ae[2]!, a32 = ae[6]!, a33 = ae[10]!, a34 = ae[14]!;
      const a41 = ae[3]!, a42 = ae[7]!, a43 = ae[11]!, a44 = ae[15]!;

      const b11 = be[0]!, b12 = be[4]!, b13 = be[8]!, b14 = be[12]!;
      const b21 = be[1]!, b22 = be[5]!, b23 = be[9]!, b24 = be[13]!;
      const b31 = be[2]!, b32 = be[6]!, b33 = be[10]!, b34 = be[14]!;
      const b41 = be[3]!, b42 = be[7]!, b43 = be[11]!, b44 = be[15]!;

      te[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
      te[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
      te[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
      te[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

      te[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
      te[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
      te[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
      te[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

      te[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
      te[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
      te[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
      te[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

      te[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
      te[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
      te[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
      te[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

      return this;
    }
    
    // Fall back to generic implementation for non-4x4 inputs
    return super.multiplyMatrices(a, b);
  }

  /**
   * Static method: Multiplies two matrices and returns a new matrix
   * Similar to GLSL: mat4 c = a * b;
   * 
   * Inherits generic implementation from Matrix base class.
   * 
   * @param a - First matrix
   * @param b - Second matrix
   * @returns New matrix with the result
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * const m3 = Matrix4.multiply(m1, m2);  // Neither m1 nor m2 changed
   */
  // Inherited from Matrix.multiply() - no override needed

  /**
   * Transposes this matrix (MUTATING)
   * Swaps rows and columns
   * 
   * Inherits generic implementation from SquareMatrix base class.
   * Can be overridden for optimization if needed.
   * 
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.transpose();
   */
  // Inherited from SquareMatrix.transpose() - no override needed

  /**
   * Static method: Transposes a matrix and returns a new matrix
   * Similar to GLSL: mat4 b = transpose(a);
   * 
   * Inherits Matrix.transpose() which is type-safe via TransposeType.
   * The return type is correctly inferred as Matrix4 due to TransposeType = Matrix4.
   * 
   * @param m - The matrix to transpose
   * @returns New transposed matrix
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = Matrix4.transpose(m1);  // m1 unchanged, m2 is Matrix4
   */
  // Inherited from Matrix.transpose() - no override needed

  /**
   * Calculates the determinant of this matrix
   * 
   * Overrides SquareMatrix.determinant() for optimized O(1) performance
   * vs O(n!) generic recursive implementation.
   * 
   * @returns The determinant value
   * 
   * @example
   * const m = new Matrix4();
   * const det = m.determinant();  // Returns 1 for identity
   */
  override determinant(): number {
    const te = this._elements;

    const n11 = te[0]!, n12 = te[4]!, n13 = te[8]!, n14 = te[12]!;
    const n21 = te[1]!, n22 = te[5]!, n23 = te[9]!, n24 = te[13]!;
    const n31 = te[2]!, n32 = te[6]!, n33 = te[10]!, n34 = te[14]!;
    const n41 = te[3]!, n42 = te[7]!, n43 = te[11]!, n44 = te[15]!;

    return (
      n41 * (
        n14 * n23 * n32
        - n13 * n24 * n32
        - n14 * n22 * n33
        + n12 * n24 * n33
        + n13 * n22 * n34
        - n12 * n23 * n34
      ) -
      n42 * (
        n14 * n23 * n31
        - n13 * n24 * n31
        - n14 * n21 * n33
        + n11 * n24 * n33
        + n13 * n21 * n34
        - n11 * n23 * n34
      ) +
      n43 * (
        n14 * n22 * n31
        - n12 * n24 * n31
        - n14 * n21 * n32
        + n11 * n24 * n32
        + n12 * n21 * n34
        - n11 * n22 * n34
      ) -
      n44 * (
        n13 * n22 * n31
        - n12 * n23 * n31
        - n13 * n21 * n32
        + n11 * n23 * n32
        + n12 * n21 * n33
        - n11 * n22 * n33
      )
    );
  }

  /**
   * Inverts this matrix (MUTATING)
   * 
   * Overrides SquareMatrix.invert() for optimized performance
   * vs generic adjugate implementation.
   * 
   * @returns This matrix (for chaining)
   * @throws Error if matrix is not invertible (determinant is 0)
   * 
   * @example
   * const m = new Matrix4();
   * m.invert();
   */
  override invert(): this {
    const inverse = Matrix4.getInverse(this);
    return this.copy(inverse);
  }

  /**
   * Static method: Calculates the inverse of a matrix and returns a new matrix
   * Similar to GLSL: mat4 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix4)
   * @returns New inverted matrix
   * @throws Error if matrix is not invertible (determinant is 0)
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = Matrix4.getInverse(m1);  // m1 unchanged
   */
  static getInverse(m: Matrix4): Matrix4 {
    if (!(m instanceof Matrix4)) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix4',
        method: 'getInverse',
        detail: 'Matrix4.getInverse requires Matrix4 instance',
      });
    }
    const te = m._elements;
    const n11 = te[0]!, n12 = te[4]!, n13 = te[8]!, n14 = te[12]!;
    const n21 = te[1]!, n22 = te[5]!, n23 = te[9]!, n24 = te[13]!;
    const n31 = te[2]!, n32 = te[6]!, n33 = te[10]!, n34 = te[14]!;
    const n41 = te[3]!, n42 = te[7]!, n43 = te[11]!, n44 = te[15]!;

    const t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
    const t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
    const t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
    const t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'Matrix4',
        method: 'getInverse',
        detail: 'Matrix4.getInverse(): Matrix is not invertible (determinant is 0)',
      });
    }

    const detInv = 1 / det;

    const result = new Matrix4();
    const re = result._elements;

    re[0] = t11 * detInv;
    re[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
    re[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
    re[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

    re[4] = t12 * detInv;
    re[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
    re[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
    re[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

    re[8] = t13 * detInv;
    re[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
    re[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
    re[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

    re[12] = t14 * detInv;
    re[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
    re[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
    re[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

    return result;
  }

  /**
   * Static method: Calculates the inverse of a matrix (alias for getInverse)
   * Similar to GLSL: mat4 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix4)
   * @returns New inverted matrix
   */
  static inverse(m: Matrix4): Matrix4 {
    return Matrix4.getInverse(m);
  }

  /**
   * Transforms a Vector3 as a direction vector (ignores translation)
   * Multiplies the vector by the upper-left 3x3 portion of the matrix
   * 
   * @param v - The vector to transform
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * const v = new Vector3(1, 0, 0);
   * m.transformDirection(v);  // Transforms v as a direction
   */
  transformDirection(v: Vector3): Vector3 {
    const te = this._elements;
    const x = v.x, y = v.y, z = v.z;
    
    return new Vector3(
      te[0]! * x + te[4]! * y + te[8]! * z,
      te[1]! * x + te[5]! * y + te[9]! * z,
      te[2]! * x + te[6]! * y + te[10]! * z
    );
  }

  /**
   * Transforms a Vector3 as a point (includes translation)
   * Multiplies the vector by the full matrix, treating w=1
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = Matrix4.makeTranslation(1, 2, 3);
   * const v = new Vector3(0, 0, 0);
   * const transformed = m.transformPoint(v);  // Returns (1, 2, 3)
   */
  transformPoint(v: Vector3): Vector3 {
    const te = this._elements;
    const x = v.x, y = v.y, z = v.z;
    const w = 1 / (te[3]! * x + te[7]! * y + te[11]! * z + te[15]!);
    
    return new Vector3(
      (te[0]! * x + te[4]! * y + te[8]! * z + te[12]!) * w,
      (te[1]! * x + te[5]! * y + te[9]! * z + te[13]!) * w,
      (te[2]! * x + te[6]! * y + te[10]! * z + te[14]!) * w
    );
  }

  /**
   * Transforms a Vector4 by this matrix
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = new Matrix4();
   * const v = new Vector4(1, 2, 3, 1);
   * const transformed = m.transformVector(v);
   */
  transformVector(v: Vector4): Vector4 {
    const te = this._elements;
    const x = v.x, y = v.y, z = v.z, w = v.w;
    
    return new Vector4(
      te[0]! * x + te[4]! * y + te[8]! * z + te[12]! * w,
      te[1]! * x + te[5]! * y + te[9]! * z + te[13]! * w,
      te[2]! * x + te[6]! * y + te[10]! * z + te[14]! * w,
      te[3]! * x + te[7]! * y + te[11]! * z + te[15]! * w
    );
  }

  /**
   * Sets this matrix to a translation matrix (MUTATING)
   * 
   * @param x - X translation
   * @param y - Y translation
   * @param z - Z translation
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeTranslation(1, 2, 3);
   */
  makeTranslation(x: number, y: number, z: number): this {
    this.makeIdentity();
    this.set(3, 0, x);
    this.set(3, 1, y);
    this.set(3, 2, z);
    return this;
  }

  /**
   * Sets this matrix to a rotation matrix around X axis (MUTATING)
   * 
   * @param theta - Rotation angle in radians
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeRotationX(Math.PI / 2);  // 90 degrees
   */
  makeRotationX(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    
    this.makeIdentity();
    this.set(1, 1, c);
    this.set(1, 2, -s);
    this.set(2, 1, s);
    this.set(2, 2, c);
    return this;
  }

  /**
   * Sets this matrix to a rotation matrix around Y axis (MUTATING)
   * 
   * @param theta - Rotation angle in radians
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeRotationY(Math.PI / 2);  // 90 degrees
   */
  makeRotationY(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    
    this.makeIdentity();
    this.set(0, 0, c);
    this.set(0, 2, s);
    this.set(2, 0, -s);
    this.set(2, 2, c);
    return this;
  }

  /**
   * Sets this matrix to a rotation matrix around Z axis (MUTATING)
   * 
   * @param theta - Rotation angle in radians
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeRotationZ(Math.PI / 2);  // 90 degrees
   */
  makeRotationZ(theta: number): this {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    
    this.makeIdentity();
    this.set(0, 0, c);
    this.set(0, 1, -s);
    this.set(1, 0, s);
    this.set(1, 1, c);
    return this;
  }

  /**
   * Sets this matrix to a scale matrix (MUTATING)
   * 
   * @param x - X scale
   * @param y - Y scale
   * @param z - Z scale
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeScale(2, 2, 2);  // Uniform scale by 2
   */
  makeScale(x: number, y: number, z: number): this {
    this.makeIdentity();
    this.set(0, 0, x);
    this.set(1, 1, y);
    this.set(2, 2, z);
    return this;
  }

}
