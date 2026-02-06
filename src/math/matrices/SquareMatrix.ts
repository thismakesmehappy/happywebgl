import { Matrix } from './Matrix.js';
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';

/**
 * SquareMatrix - Abstract base class for square matrices (NxN)
 * 
 * Extends Matrix to provide square-matrix-only operations:
 * - Mutating transpose (only works for square matrices)
 * - Determinant calculation (only defined for square matrices)
 * - Matrix inversion (only works for square matrices)
 * 
 * Square matrices have the property that rows === columns, which enables
 * operations like mutating transpose and determinant calculation.
 * 
 * Subclasses like Matrix2, Matrix3, Matrix4 extend this class and can
 * override determinant() and invert() for optimized implementations.
 */
export abstract class SquareMatrix extends Matrix {
  /**
   * Gets the dimension of this square matrix (convenience getter)
   * Since rows === columns for square matrices, this returns either.
   * 
   * @returns The dimension (number of rows/columns)
   * @throws Error if matrix is not square (defensive check)
   * 
   * @example
   * const m = new Matrix4();
   * m.dimension;  // Returns 4
   */
  get dimension(): number {
    if (this.rows !== this.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'SquareMatrix',
        method: 'dimension',
        detail: `Matrix is not square (${this.rows}x${this.columns})`,
      });
    }
    return this.rows;
  }

  /**
   * Transposes this matrix (MUTATING)
   * Swaps rows and columns
   * 
   * Only works for square matrices. For non-square matrices, use the
   * static Matrix.transpose() method which returns a new matrix.
   * 
   * @returns This matrix (for chaining)
   * @throws Error if matrix is not square
   * 
   * @example
   * const m = new Matrix4();
   * m.transpose();  // m is now transposed
   */
  transpose(): this {
    if (this.rows !== this.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'SquareMatrix',
        method: 'transpose()',
        detail: `Matrix must be square (${this.rows}x${this.columns})`,
      });
    }
    
    // Swap elements: element[i][j] <-> element[j][i]
    // Only swap upper triangle to avoid double-swapping
    const size = this.rows;
    for (let i = 0; i < size; i++) {
      for (let j = i + 1; j < size; j++) {
        const tmp = this.get(i, j);
        this.set(i, j, this.get(j, i));
        this.set(j, i, tmp);
      }
    }
    
    return this;
  }

  /**
   * Calculates the determinant of this matrix
   * 
   * Generic recursive implementation using cofactor expansion (Leibniz formula).
   * This is an O(n!) implementation. Subclasses should override for optimized
   * O(n³) implementations for known sizes (e.g., Matrix4 uses optimized formula).
   * 
   * @returns The determinant value
   * @throws Error if matrix is not square
   * 
   * @example
   * const m = new Matrix4();
   * const det = m.determinant();  // Returns 1 for identity
   */
  determinant(): number {
    if (this.rows !== this.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'SquareMatrix',
        method: 'determinant()',
        detail: `Matrix must be square (${this.rows}x${this.columns})`,
      });
    }
    return this._determinantRecursive(this._elements, this.rows);
  }

  /**
   * Recursive determinant calculation using cofactor expansion
   * 
   * @param elements - Matrix elements in column-major order
   * @param size - Size of the matrix (rows/columns)
   * @returns The determinant value
   */
  protected _determinantRecursive(elements: Float32Array, size: number): number {
    // Base case: 0x0 matrix (empty matrix, determinant is 1 by convention)
    if (size === 0) {
      return 1;
    }
    
    // Base case: 1x1 matrix
    if (size === 1) {
      return elements[0]!;
    }
    
    // Base case: 2x2 matrix (direct formula for efficiency)
    if (size === 2) {
      // For 2x2: det = a*d - b*c
      // Column-major: [a, c, b, d] = [col0row0, col0row1, col1row0, col1row1]
      return elements[0]! * elements[3]! - elements[1]! * elements[2]!;
    }
    
    // Recursive case: expand along first row
    // det = sum over j of (a[0][j] * (-1)^j * minor[0][j])
    let det = 0;
    for (let j = 0; j < size; j++) {
      const sign = j % 2 === 0 ? 1 : -1;
      const cofactor = sign * this._getMinorDeterminant(elements, size, 0, j);
      // In column-major order, element at row 0, column j is at index j * size + 0 = j * size
      det += elements[j * size]! * cofactor;
    }
    
    return det;
  }

  /**
   * Calculates the determinant of the minor matrix (matrix with row and column removed)
   * 
   * @param elements - Original matrix elements
   * @param size - Size of the original matrix
   * @param excludeRow - Row to exclude
   * @param excludeCol - Column to exclude
   * @returns The determinant of the minor matrix
   */
  protected _getMinorDeterminant(
    elements: Float32Array,
    size: number,
    excludeRow: number,
    excludeCol: number
  ): number {
    // Create minor matrix (size-1 x size-1)
    const minorSize = size - 1;
    const minorElements = new Float32Array(minorSize * minorSize);
    
    // Build minor matrix in column-major order
    let minorCol = 0;
    for (let j = 0; j < size; j++) {
      if (j === excludeCol) continue;
      let minorRow = 0;
      for (let i = 0; i < size; i++) {
        if (i === excludeRow) continue;
        // Store in column-major: minorCol * minorSize + minorRow
        minorElements[minorCol * minorSize + minorRow] = elements[j * size + i]!;
        minorRow++;
      }
      minorCol++;
    }
    
    // Recursively calculate determinant of minor
    return this._determinantRecursive(minorElements, minorSize);
  }

  /**
   * Inverts this matrix (MUTATING)
   * 
   * Generic implementation using adjugate matrix method.
   * This is an O(n!) implementation. Subclasses should override for optimized
   * implementations for known sizes (e.g., Matrix4 uses optimized formula).
   * 
   * @returns This matrix (for chaining)
   * @throws Error if matrix is not invertible (determinant is 0)
   * @throws Error if matrix is not square
   * 
   * @example
   * const m = new Matrix4();
   * m.invert();  // m is now inverted
   */
  invert(): this {
    if (this.rows !== this.columns) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'SquareMatrix',
        method: 'invert()',
        detail: `Matrix must be square (${this.rows}x${this.columns})`,
      });
    }
    
    const det = this.determinant();
    if (Math.abs(det) < 1e-10) {
      throw new AppError(ErrorCode.MATH_NON_INVERTIBLE, {
        resource: 'SquareMatrix',
        method: 'invert()',
        detail: `Matrix is not invertible (determinant is ${det})`,
      });
    }
    
    const adjugate = this._getAdjugate();
    const invDet = 1 / det;
    
    // Multiply adjugate by 1/determinant
    for (let i = 0; i < this.size; i++) {
      this._elements[i] = adjugate[i]! * invDet;
    }
    
    return this;
  }

  /**
   * Calculates the adjugate matrix (transpose of cofactor matrix)
   * 
   * @returns Float32Array containing adjugate matrix elements in column-major order
   */
  protected _getAdjugate(): Float32Array {
    const cofactorMatrix = this._getCofactorMatrix();
    const size = this.rows;
    const adjugate = new Float32Array(this.size);
    
    // Adjugate is transpose of cofactor matrix
    // Cofactor matrix: C[i][j] stored at j * size + i (column-major)
    // Adjugate: adj[i][j] = C[j][i], stored at i * size + j (column-major)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Cofactor C[j][i] is stored at i * size + j (column-major: col i, row j)
        // Adjugate adj[i][j] = C[j][i], stored at j * size + i (column-major: col j, row i)
        adjugate[j * size + i] = cofactorMatrix[i * size + j]!;
      }
    }
    
    return adjugate;
  }

  /**
   * Calculates the cofactor matrix
   * 
   * @returns Float32Array containing cofactor matrix elements in column-major order
   */
  protected _getCofactorMatrix(): Float32Array {
    const size = this.rows;
    const cofactors = new Float32Array(this.size);
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const sign = (i + j) % 2 === 0 ? 1 : -1;
        const minorDet = this._getMinorDeterminant(this._elements, size, i, j);
        cofactors[j * size + i] = sign * minorDet;  // Column-major storage
      }
    }
    
    return cofactors;
  }
}
