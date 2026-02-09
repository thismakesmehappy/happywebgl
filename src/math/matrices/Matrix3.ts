import { Matrix } from './Matrix.js';
import { SquareMatrix } from './SquareMatrix.js';
import { Vector2 } from '../vectors/Vector2.js';
import { Vector3 } from '../vectors/Vector3.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Matrix3 - A 3x3 matrix class
 * 
 * Extends SquareMatrix to provide 3x3-specific functionality.
 * 
 * Matrices in 2D graphics are used for:
 * - Transformations (translation, rotation, scale)
 * - View matrices (camera transformations)
 * - Model-View composition
 * 
 * Storage Format:
 * - Column-major order (matches WebGL/OpenGL)
 * - 9 elements stored as flat array: [m00, m10, m20, m01, m11, m21, ...]
 * - Column 0: elements 0-2
 * - Column 1: elements 3-5
 * - Column 2: elements 6-8
 * 
 * Element Access:
 * - m.get(column, row) - Explicit method access (inherited from Matrix)
 * - m.elements[column * 3 + row] - Direct array access (inherited from Matrix)
 * - m[column][row] - Proxy-based indexing (column-major, Matrix3-specific)
 * 
 * Method Patterns:
 * - Instance methods (e.g., m1.multiply(m2)): Mutate the calling matrix
 * - Static methods (e.g., Matrix3.multiply(m1, m2)): Return a new matrix, don't mutate inputs
 */
export class Matrix3 extends SquareMatrix {
  /**
   * Transpose type for this matrix (square matrix: transpose is itself)
   * Required for type-safe static transpose() method
   */
  static readonly TransposeType = Matrix3;

  /**
   * Gets the number of rows (always 3 for Matrix3)
   */
  get rows(): number {
    return 3;
  }

  /**
   * Gets the number of columns (always 3 for Matrix3)
   */
  get columns(): number {
    return 3;
  }

  /**
   * Creates a new Matrix3
   * 
   * @param elements - Matrix elements in column-major order (variadic)
   *                  If no arguments provided, creates identity matrix
   *                  If 9 arguments provided, uses them directly
   * 
   * @example
   * const m1 = new Matrix3();  // Identity matrix (default)
   * const m2 = new Matrix3(
   *   1, 0, 0,  // Column 0
   *   0, 1, 0,  // Column 1
   *   0, 0, 1   // Column 2
   * );  // Identity matrix (explicit, column-major)
   */
  constructor(...elements: number[]) {
    // Default to identity matrix if no arguments provided
    if (elements.length === 0) {
      elements = [
        1, 0, 0,  // Column 0: identity
        0, 1, 0,  // Column 1: identity
        0, 0, 1   // Column 2: identity
      ];
    }
    
    // Pass variadic numbers to base class (converts to Float32Array internally)
    super(...elements);
    
    // Validate size after super() call
    this._validateSize('constructor');
    
    // Set up Proxy-based indexing using base class helper
    return this._setupProxy();
  }

  /**
   * Creates an identity matrix
   * 
   * @returns A new identity matrix
   * 
   * @example
   * const m = Matrix3.identity();
   */
  static identity(): Matrix3 {
    return new Matrix3();
  }

  /**
   * Multiplies two matrices and stores the result in this matrix (MUTATING)
   * Result: this = a * b
   * 
   * Implements the abstract method from Matrix base class.
   * 
   * @param a - First matrix (must be Matrix3)
   * @param b - Second matrix (must be Matrix3)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are not Matrix3 or incompatible sizes
   * 
   * @example
   * const m1 = new Matrix3();
   * const m2 = new Matrix3();
   * const m3 = new Matrix3();
   * m3.multiplyMatrices(m1, m2);  // m3 = m1 * m2
   */
  multiplyMatrices(a: Matrix, b: Matrix): this {
    // Validate: a.columns === b.rows (compatibility)
    if (a.columns !== b.rows) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix3',
        method: 'multiplyMatrices',
        detail: `Matrix multiplication incompatible: ${a.rows}x${a.columns} * ${b.rows}x${b.columns}`,
      });
    }
    
    // Validate: result size matches this matrix (must be 3x3)
    if (this.rows !== a.rows || this.columns !== b.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix3',
        method: 'multiplyMatrices',
        detail:
          `Result matrix size mismatch: expected ${a.rows}x${b.columns}, ` +
          `got ${this.rows}x${this.columns}`,
      });
    }
    
    // If both inputs are 3x3, use optimized implementation
    if (a.rows === 3 && a.columns === 3 && b.rows === 3 && b.columns === 3) {
      // TypeScript narrowing: we know these are 3x3 matrices, safe to access _elements
      const ae = (a as any)._elements as Float32Array;
      const be = (b as any)._elements as Float32Array;
      const te = this._elements;

      // Matrix multiplication: result[i][j] = sum over k: a[i][k] * b[k][j]
      // In column-major: a[i][k] = ae[k*3+i], b[k][j] = be[j*3+k]
      // For result column j, row i: te[j*3+i] = sum over k: ae[k*3+i] * be[j*3+k]
      
      // Column 0 (j=0): te[0+i] = sum over k: ae[k*3+i] * be[0*3+k] = sum over k: ae[k*3+i] * be[k]
      const a11 = ae[0]!, a12 = ae[3]!, a13 = ae[6]!;  // a[0][0], a[0][1], a[0][2]
      const a21 = ae[1]!, a22 = ae[4]!, a23 = ae[7]!;  // a[1][0], a[1][1], a[1][2]
      const a31 = ae[2]!, a32 = ae[5]!, a33 = ae[8]!;  // a[2][0], a[2][1], a[2][2]

      // For b: b[k][j] = be[j*3+k]
      // Column 0 (j=0): b[k][0] = be[0*3+k] = be[k]
      // Column 1 (j=1): b[k][1] = be[1*3+k] = be[3+k]
      // Column 2 (j=2): b[k][2] = be[2*3+k] = be[6+k]
      const b11 = be[0]!, b12 = be[3]!, b13 = be[6]!;  // b[0][0], b[0][1], b[0][2]
      const b21 = be[1]!, b22 = be[4]!, b23 = be[7]!;  // b[1][0], b[1][1], b[1][2]
      const b31 = be[2]!, b32 = be[5]!, b33 = be[8]!;  // b[2][0], b[2][1], b[2][2]

      // Result column 0: te[0] = a[0][0]*b[0][0] + a[0][1]*b[1][0] + a[0][2]*b[2][0]
      te[0] = a11 * b11 + a12 * b21 + a13 * b31;
      te[3] = a11 * b12 + a12 * b22 + a13 * b32;
      te[6] = a11 * b13 + a12 * b23 + a13 * b33;

      te[1] = a21 * b11 + a22 * b21 + a23 * b31;
      te[4] = a21 * b12 + a22 * b22 + a23 * b32;
      te[7] = a21 * b13 + a22 * b23 + a23 * b33;

      te[2] = a31 * b11 + a32 * b21 + a33 * b31;
      te[5] = a31 * b12 + a32 * b22 + a33 * b32;
      te[8] = a31 * b13 + a32 * b23 + a33 * b33;

      return this;
    }
    
    // Fall back to generic implementation for non-3x3 inputs
    return super.multiplyMatrices(a, b);
  }

  /**
   * Calculates the determinant of this matrix
   * 
   * Overrides SquareMatrix.determinant() for optimized O(1) performance
   * vs O(n!) generic recursive implementation.
   * 
   * @returns The determinant value
   * 
   * @example
   * const m = new Matrix3();
   * const det = m.determinant();  // Returns 1 for identity
   */
  override determinant(): number {
    const te = this._elements;

    const n11 = te[0]!, n12 = te[3]!, n13 = te[6]!;
    const n21 = te[1]!, n22 = te[4]!, n23 = te[7]!;
    const n31 = te[2]!, n32 = te[5]!, n33 = te[8]!;

    return (
      n11 * (n22 * n33 - n23 * n32) -
      n12 * (n21 * n33 - n23 * n31) +
      n13 * (n21 * n32 - n22 * n31)
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
   * const m = new Matrix3();
   * m.invert();
   */
  override invert(): this {
    const inverse = Matrix3.getInverse(this);
    return this.copy(inverse);
  }

  /**
   * Static method: Calculates the inverse of a matrix and returns a new matrix
   * Similar to GLSL: mat3 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix3)
   * @returns New inverted matrix
   * @throws Error if matrix is not invertible (determinant is 0)
   * 
   * @example
   * const m1 = new Matrix3();
   * const m2 = Matrix3.getInverse(m1);  // m1 unchanged
   */
  static getInverse(m: Matrix3): Matrix3 {
    if (!(m instanceof Matrix3)) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix3',
        method: 'getInverse',
        detail: 'Matrix3.getInverse requires Matrix3 instance',
      });
    }
    const te = m._elements;
    const n11 = te[0]!, n12 = te[3]!, n13 = te[6]!;
    const n21 = te[1]!, n22 = te[4]!, n23 = te[7]!;
    const n31 = te[2]!, n32 = te[5]!, n33 = te[8]!;

    const t11 = n22 * n33 - n23 * n32;
    const t12 = n13 * n32 - n12 * n33;
    const t13 = n12 * n23 - n13 * n22;
    const t21 = n23 * n31 - n21 * n33;
    const t22 = n11 * n33 - n13 * n31;
    const t23 = n13 * n21 - n11 * n23;
    const t31 = n21 * n32 - n22 * n31;
    const t32 = n12 * n31 - n11 * n32;
    const t33 = n11 * n22 - n12 * n21;

    const det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'Matrix3',
        method: 'getInverse',
        detail: 'Matrix3.getInverse(): Matrix is not invertible (determinant is 0)',
      });
    }

    const detInv = 1 / det;

    const result = new Matrix3();
    const re = result._elements;

    re[0] = t11 * detInv;
    re[1] = t21 * detInv;
    re[2] = t31 * detInv;
    re[3] = t12 * detInv;
    re[4] = t22 * detInv;
    re[5] = t32 * detInv;
    re[6] = t13 * detInv;
    re[7] = t23 * detInv;
    re[8] = t33 * detInv;

    return result;
  }

  /**
   * Static method: Calculates the inverse of a matrix (alias for getInverse)
   * Similar to GLSL: mat3 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix3)
   * @returns New inverted matrix
   */
  static inverse(m: Matrix3): Matrix3 {
    return Matrix3.getInverse(m);
  }

  /**
   * Transforms a Vector2 as a direction vector (ignores translation)
   * Multiplies the vector by the upper-left 2x2 portion of the matrix
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = new Matrix3();
   * const v = new Vector2(1, 0);
   * const result = m.transformDirection(v);  // Transforms v as a direction
   */
  transformDirection(v: Vector2): Vector2 {
    const te = this._elements;
    const x = v.x, y = v.y;
    
    return new Vector2(
      te[0]! * x + te[3]! * y,
      te[1]! * x + te[4]! * y
    );
  }

  /**
   * Transforms a Vector2 as a point (includes translation)
   * Multiplies the vector by the full matrix, treating w=1
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = Matrix3.makeTranslation(1, 2);
   * const v = new Vector2(0, 0);
   * const transformed = m.transformPoint(v);  // Returns (1, 2)
   */
  transformPoint(v: Vector2): Vector2 {
    const te = this._elements;
    const x = v.x, y = v.y;
    const w = 1 / (te[2]! * x + te[5]! * y + te[8]!);
    
    return new Vector2(
      (te[0]! * x + te[3]! * y + te[6]!) * w,
      (te[1]! * x + te[4]! * y + te[7]!) * w
    );
  }

  /**
   * Transforms a Vector3 by this matrix
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = new Matrix3();
   * const v = new Vector3(1, 2, 1);
   * const transformed = m.transformVector(v);
   */
  transformVector(v: Vector3): Vector3 {
    const te = this._elements;
    const x = v.x, y = v.y, z = v.z;
    
    return new Vector3(
      te[0]! * x + te[3]! * y + te[6]! * z,
      te[1]! * x + te[4]! * y + te[7]! * z,
      te[2]! * x + te[5]! * y + te[8]! * z
    );
  }

  /**
   * Sets this matrix to a translation matrix (MUTATING)
   * 
   * @param x - X translation
   * @param y - Y translation
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix3();
   * m.makeTranslation(1, 2);
   */
  makeTranslation(x: number, y: number): this {
    this.makeIdentity();
    this.set(2, 0, x);
    this.set(2, 1, y);
    return this;
  }

  /**
   * Sets this matrix to a rotation matrix around Z axis (MUTATING)
   * 
   * @param theta - Rotation angle in radians
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix3();
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
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix3();
   * m.makeScale(2, 2);  // Uniform scale by 2
   */
  makeScale(x: number, y: number): this {
    this.makeIdentity();
    this.set(0, 0, x);
    this.set(1, 1, y);
    return this;
  }
}
