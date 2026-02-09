import { Matrix } from './Matrix.js';
import { SquareMatrix } from './SquareMatrix.js';
import { Vector2 } from '../vectors/Vector2.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * Matrix2 - A 2x2 matrix class
 * 
 * Extends SquareMatrix to provide 2x2-specific functionality.
 * 
 * Matrices in 2D graphics are used for:
 * - Rotations
 * - Scaling
 * - Shearing
 * 
 * Storage Format:
 * - Column-major order (matches WebGL/OpenGL)
 * - 4 elements stored as flat array: [m00, m10, m01, m11]
 * - Column 0: elements 0-1
 * - Column 1: elements 2-3
 * 
 * Element Access:
 * - m.get(column, row) - Explicit method access (inherited from Matrix)
 * - m.elements[column * 2 + row] - Direct array access (inherited from Matrix)
 * - m[column][row] - Proxy-based indexing (column-major, Matrix2-specific)
 * 
 * Method Patterns:
 * - Instance methods (e.g., m1.multiply(m2)): Mutate the calling matrix
 * - Static methods (e.g., Matrix2.multiply(m1, m2)): Return a new matrix, don't mutate inputs
 */
export class Matrix2 extends SquareMatrix {
  /**
   * Transpose type for this matrix (square matrix: transpose is itself)
   * Required for type-safe static transpose() method
   */
  static readonly TransposeType = Matrix2;

  /**
   * Gets the number of rows (always 2 for Matrix2)
   */
  get rows(): number {
    return 2;
  }

  /**
   * Gets the number of columns (always 2 for Matrix2)
   */
  get columns(): number {
    return 2;
  }

  /**
   * Creates a new Matrix2
   * 
   * @param elements - Matrix elements in column-major order (variadic)
   *                  If no arguments provided, creates identity matrix
   *                  If 4 arguments provided, uses them directly
   * 
   * @example
   * const m1 = new Matrix2();  // Identity matrix (default)
   * const m2 = new Matrix2(
   *   1, 0,  // Column 0
   *   0, 1   // Column 1
   * );  // Identity matrix (explicit, column-major)
   */
  constructor(...elements: number[]) {
    // Default to identity matrix if no arguments provided
    if (elements.length === 0) {
      elements = [
        1, 0,  // Column 0: identity
        0, 1   // Column 1: identity
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
   * const m = Matrix2.identity();
   */
  static identity(): Matrix2 {
    return new Matrix2();
  }

  /**
   * Multiplies two matrices and stores the result in this matrix (MUTATING)
   * Result: this = a * b
   * 
   * Implements the abstract method from Matrix base class.
   * 
   * @param a - First matrix (must be Matrix2)
   * @param b - Second matrix (must be Matrix2)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are not Matrix2 or incompatible sizes
   * 
   * @example
   * const m1 = new Matrix2();
   * const m2 = new Matrix2();
   * const m3 = new Matrix2();
   * m3.multiplyMatrices(m1, m2);  // m3 = m1 * m2
   */
  multiplyMatrices(a: Matrix, b: Matrix): this {
    // Validate: a.columns === b.rows (compatibility)
    if (a.columns !== b.rows) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix2',
        method: 'multiplyMatrices',
        detail: `Matrix multiplication incompatible: ${a.rows}x${a.columns} * ${b.rows}x${b.columns}`,
      });
    }
    
    // Validate: result size matches this matrix (must be 2x2)
    if (this.rows !== a.rows || this.columns !== b.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix2',
        method: 'multiplyMatrices',
        detail:
          `Result matrix size mismatch: expected ${a.rows}x${b.columns}, ` +
          `got ${this.rows}x${this.columns}`,
      });
    }
    
    // If both inputs are 2x2, use optimized implementation
    if (a.rows === 2 && a.columns === 2 && b.rows === 2 && b.columns === 2) {
      // TypeScript narrowing: we know these are 2x2 matrices, safe to access _elements
      const ae = (a as any)._elements as Float32Array;
      const be = (b as any)._elements as Float32Array;
      const te = this._elements;

      const a11 = ae[0]!, a12 = ae[2]!;
      const a21 = ae[1]!, a22 = ae[3]!;

      const b11 = be[0]!, b12 = be[2]!;
      const b21 = be[1]!, b22 = be[3]!;

      te[0] = a11 * b11 + a12 * b21;
      te[2] = a11 * b12 + a12 * b22;

      te[1] = a21 * b11 + a22 * b21;
      te[3] = a21 * b12 + a22 * b22;

      return this;
    }
    
    // Fall back to generic implementation for non-2x2 inputs
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
   * const m = new Matrix2();
   * const det = m.determinant();  // Returns 1 for identity
   */
  override determinant(): number {
    const te = this._elements;

    const n11 = te[0]!, n12 = te[2]!;
    const n21 = te[1]!, n22 = te[3]!;

    return n11 * n22 - n12 * n21;
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
   * const m = new Matrix2();
   * m.invert();
   */
  override invert(): this {
    const inverse = Matrix2.getInverse(this);
    return this.copy(inverse);
  }

  /**
   * Static method: Calculates the inverse of a matrix and returns a new matrix
   * Similar to GLSL: mat2 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix2)
   * @returns New inverted matrix
   * @throws Error if matrix is not invertible (determinant is 0)
   * 
   * @example
   * const m1 = new Matrix2();
   * const m2 = Matrix2.getInverse(m1);  // m1 unchanged
   */
  static getInverse(m: Matrix2): Matrix2 {
    if (!(m instanceof Matrix2)) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix2',
        method: 'getInverse',
        detail: 'Matrix2.getInverse requires Matrix2 instance',
      });
    }
    const te = m._elements;
    const n11 = te[0]!, n12 = te[2]!;
    const n21 = te[1]!, n22 = te[3]!;

    const det = n11 * n22 - n12 * n21;

    if (det === 0) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'Matrix2',
        method: 'getInverse',
        detail: 'Matrix2.getInverse(): Matrix is not invertible (determinant is 0)',
      });
    }

    const detInv = 1 / det;

    const result = new Matrix2();
    const re = result._elements;

    re[0] = n22 * detInv;
    re[1] = -n21 * detInv;
    re[2] = -n12 * detInv;
    re[3] = n11 * detInv;

    return result;
  }

  /**
   * Static method: Calculates the inverse of a matrix (alias for getInverse)
   * Similar to GLSL: mat2 b = inverse(a);
   * 
   * @param m - The matrix to invert (must be Matrix2)
   * @returns New inverted matrix
   */
  static inverse(m: Matrix2): Matrix2 {
    return Matrix2.getInverse(m);
  }

  /**
   * Transforms a Vector2 by this matrix
   * 
   * @param v - The vector to transform
   * @returns New transformed vector
   * 
   * @example
   * const m = new Matrix2();
   * const v = new Vector2(1, 2);
   * const transformed = m.transformVector(v);
   */
  transformVector(v: Vector2): Vector2 {
    const te = this._elements;
    const x = v.x, y = v.y;
    
    return new Vector2(
      te[0]! * x + te[2]! * y,
      te[1]! * x + te[3]! * y
    );
  }

  /**
   * Sets this matrix to a rotation matrix (MUTATING)
   * 
   * @param theta - Rotation angle in radians
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix2();
   * m.makeRotation(Math.PI / 2);  // 90 degrees
   */
  makeRotation(theta: number): this {
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
   * const m = new Matrix2();
   * m.makeScale(2, 2);  // Uniform scale by 2
   */
  makeScale(x: number, y: number): this {
    this.makeIdentity();
    this.set(0, 0, x);
    this.set(1, 1, y);
    return this;
  }
}
