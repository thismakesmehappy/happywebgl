/**
 * Matrix - Abstract base class for NxM matrices
 * 
 * This is the base class for matrix implementations like Matrix4.
 * It provides common matrix operations that work for any dimension.
 * 
 * Matrices in graphics are used for:
 * - Transformations (translation, rotation, scale)
 * - View matrices (camera transformations)
 * - Projection matrices (perspective/orthographic)
 * - Model-View-Projection (MVP) composition
 * 
 * Storage Format:
 * - Column-major order (matches WebGL/OpenGL)
 * - Elements stored as Float32Array for WebGL compatibility
 * 
 * Method Patterns:
 * - Instance methods (e.g., m1.multiply(m2)): Mutate the calling matrix
 * - Static methods (e.g., Matrix.multiply(m1, m2)): Return a new matrix, don't mutate inputs
 * 
 * Type Safety:
 * - All operations require matrices of the same size
 * - Attempting operations between different-sized matrices will throw an error
 */
import { AppError } from '../../errors/AppError.js';
import { ErrorCode } from '../../errors/ErrorCodes.js';
import { validate } from '../../utils/validate.js';

export abstract class Matrix {
  /**
   * Proxy-based column accessors for m[column][row] syntax
   * These are created in the constructor via Proxy
   */
  [column: number]: any;

  /**
   * Matrix elements stored in column-major order as Float32Array
   * Protected so subclasses can access it
   * 
   * Float32Array provides:
   * - Direct compatibility with WebGL buffer uploads
   * - Better performance than regular arrays
   * - Memory efficiency (32-bit floats)
   */
  protected _elements: Float32Array;

  /**
   * Creates a new Matrix
   * 
   * @param elements - The matrix elements in column-major order (variadic numbers)
   * @throws Error if elements.length !== rows * columns
   */
  constructor(...elements: number[]) {
    // Convert to Float32Array for WebGL compatibility (internal implementation detail)
    // Validate size after super() call - getters are available after construction
    this._elements = new Float32Array(elements);
    // Note: Validation happens after assignment because rows/columns getters
    // are abstract and may not be accessible before super() completes
    // We validate in a protected method that can be called after construction
  }

  /**
   * Validates that the elements array size matches the matrix dimensions
   * Called after construction to ensure size correctness
   */
  protected _validateSize(methodName: string): void {
    const expectedSize = this.rows * this.columns;
    if (this._elements.length !== expectedSize) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: methodName,
        detail:
          `Matrix elements array size mismatch: expected ${expectedSize} elements ` +
          `(${this.rows}x${this.columns}) for ${this.constructor.name}, got ${this._elements.length}`,
      });
    }
  }

  /**
   * Creates a proxy-based accessor for m[column][row] syntax
   * This is set up in the constructor via Proxy
   * Works for any matrix size
   */
  protected _createColumnProxy(column: number): any {
    return new Proxy({}, {
      get: (_target, row: string | symbol) => {
        if (typeof row === 'symbol') return undefined;
        const rowIndex = parseInt(row);
        if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= this.rows) {
          return undefined;
        }
        return this._elements[column * this.rows + rowIndex];
      },
      set: (_target, row: string | symbol, value: number) => {
        if (typeof row === 'symbol') return false;
        const rowIndex = parseInt(row);
        if (isNaN(rowIndex) || rowIndex < 0 || rowIndex >= this.rows) {
          return false;
        }
        this._elements[column * this.rows + rowIndex] = value;
        return true;
      }
    });
  }

  /**
   * Sets up Proxy-based indexing. Called from subclass constructors after super().
   * @returns Proxy-wrapped instance
   */
  protected _setupProxy(): this {
    return new Proxy(this, {
      get: (target, prop: string | symbol) => {
        if (typeof prop === 'symbol') {
          return (target as any)[prop];
        }
        const column = parseInt(prop);
        if (!isNaN(column) && column >= 0 && column < this.columns) {
          return target._createColumnProxy(column);
        }
        return (target as any)[prop];
      }
    }) as this;
  }

  /**
   * Gets the number of rows in this matrix
   */
  abstract get rows(): number;

  /**
   * Gets the number of columns in this matrix
   */
  abstract get columns(): number;

  /**
   * Gets the total number of elements (rows * columns)
   */
  get size(): number {
    return this.rows * this.columns;
  }

  /**
   * Gets the flat array of matrix elements (column-major order)
   * This is the format expected by WebGL uniformMatrix*fv() functions
   * 
   * @returns Float32Array of matrix elements in column-major order
   * 
   * @example
   * const m = new Matrix4();
   * gl.uniformMatrix4fv(location, false, m.elements);  // false = not transpose
   */
  get elements(): Float32Array {
    return this._elements;
  }

  /**
   * Gets the matrix element at the specified column and row
   * 
   * @param column - Column index (0-based)
   * @param row - Row index (0-based)
   * @returns The element value
   * @throws Error if indices are out of bounds
   * 
   * @example
   * const m = new Matrix4();
   * m.get(0, 0);  // Returns 1 (top-left element of identity)
   */
  get(column: number, row: number): number {
    validate.number.inRange(
      column,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Matrix',
        method: 'get',
      },
      0,
      this.columns - 1,
      {
        requireFinite: false,
        detail: `Column index ${column} out of bounds for ${this.constructor.name} (0-${this.columns - 1})`,
      },
    );
    validate.number.inRange(
      row,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Matrix',
        method: 'get',
      },
      0,
      this.rows - 1,
      {
        requireFinite: false,
        detail: `Row index ${row} out of bounds for ${this.constructor.name} (0-${this.rows - 1})`,
      },
    );
    return this._elements[column * this.rows + row]!;
  }

  /**
   * Sets the matrix element at the specified column and row
   * 
   * @param column - Column index (0-based)
   * @param row - Row index (0-based)
   * @param value - The value to set
   * @returns This matrix (for chaining)
   * @throws Error if indices are out of bounds
   * 
   * @example
   * const m = new Matrix4();
   * m.set(0, 0, 5);  // Sets top-left element to 5
   */
  set(column: number, row: number, value: number): this {
    validate.number.inRange(
      column,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Matrix',
        method: 'set',
      },
      0,
      this.columns - 1,
      {
        requireFinite: false,
        detail: `Column index ${column} out of bounds for ${this.constructor.name} (0-${this.columns - 1})`,
      },
    );
    validate.number.inRange(
      row,
      {
        code: ErrorCode.MATH_OUT_OF_BOUNDS,
        resource: 'Matrix',
        method: 'set',
      },
      0,
      this.rows - 1,
      {
        requireFinite: false,
        detail: `Row index ${row} out of bounds for ${this.constructor.name} (0-${this.rows - 1})`,
      },
    );
    this._elements[column * this.rows + row] = value;
    return this;
  }

  /**
   * Checks if two matrices have the same dimensions
   */
  protected _areSameSize(a: Matrix, b: Matrix): boolean {
    return a.rows === b.rows && a.columns === b.columns;
  }

  /**
   * Validates that two matrices have the same dimensions
   * Throws an error if they don't match
   */
  protected _validateSameSize(a: Matrix, b: Matrix, methodName: string): void {
    if (!this._areSameSize(a, b)) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: methodName,
        detail:
          `Matrices must have the same size: ${a.constructor.name} (${a.rows}x${a.columns}) and ` +
          `${b.constructor.name} (${b.rows}x${b.columns})`,
      });
    }
  }

  /**
   * Creates a copy of this matrix
   * 
   * @returns A new matrix with the same values (same type as this)
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = m1.clone();  // m2 is a new matrix, m1 unchanged
   */
  clone(): this {
    // Convert Float32Array to array of numbers for variadic constructor
    const elementsArray = Array.from(this._elements);
    return new (this.constructor as new (...args: number[]) => this)(...elementsArray);
  }

  /**
   * Copies the values from another matrix into this matrix (MUTATING)
   * 
   * Requires matrices of the same dimensions.
   * 
   * @param m - The matrix to copy from (must be same size as this)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are different sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.copy(m2);  // m1 now equals m2
   */
  copy(m: Matrix): this {
    this._validateSameSize(this, m, 'copy');
    this._elements.set(m._elements);
    return this;
  }

   /**
   * Adds this matrix with another matrix, element-wise (MUTATING)
   * Result: this = this + m
   * 
   * @param m - The matrix to multiply by (must be compatible size)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are incompatible sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.add(m2);  // m1 = m1 + m2
   */
   add(m: Matrix): this {
    this._validateSameSize(this, m, 'add');

    for (let i = 0; i < this.rows; i++) {
        for (let j = 0; j < this.columns; j++) {
          let sum = this.get(j, i) + m.get(j, i);
          this.set(j, i, sum);
        }
      }

    return this;
  }

     /**
   * Subtracts this matrix with another matrix, element-wise (MUTATING)
   * Result: this = this - m
   * 
   * @param m - The matrix to multiply by (must be compatible size)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are incompatible sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.add(m2);  // m1 = m1 + m2
   */
     subtract(m: Matrix): this {
        this._validateSameSize(this, m, 'subtract');
    
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
              let sum = this.get(j, i) - m.get(j, i);
              this.set(j, i, sum);
            }
          }
    
        return this;
      }

  /**
   * Multiplies this matrix by another matrix (MUTATING)
   * Result: this = this * m
   * 
   * @param m - The matrix to multiply by (must be compatible size)
   * @returns This matrix (for chaining)
   * @throws Error if matrices are incompatible sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.multiply(m2);  // m1 = m1 * m2
   */
  multiply(m: Matrix): this {
    return this.multiplyMatrices(this, m);
  }

  /**
   * Multiplies two matrices and stores the result in this matrix (MUTATING)
   * Result: this = a * b
   * 
   * Generic implementation that works for any matrix dimensions.
   * 
   * @param a - First matrix
   * @param b - Second matrix
   * @returns This matrix (for chaining)
   * @throws Error if matrices are incompatible sizes
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * const m3 = new Matrix4();
   * m3.multiplyMatrices(m1, m2);  // m3 = m1 * m2
   */
  multiplyMatrices(a: Matrix, b: Matrix): this {
    // Validate: a.columns === b.rows
    if (a.columns !== b.rows) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'multiplyMatrices',
        detail: `Matrix multiplication incompatible: ${a.rows}x${a.columns} * ${b.rows}x${b.columns}`,
      });
    }
    
    // Validate: result size matches this matrix
    if (this.rows !== a.rows || this.columns !== b.columns) {
      const errorMessage = `Result matrix size mismatch: expected ${a.rows}x${b.columns}, got ${this.rows}x${this.columns}`;
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'multiplyMatrices',
        detail: errorMessage,
      });
    }
    
    // Generic triple-loop matrix multiplication
    // result[i][j] = sum over k of (a[i][k] * b[k][j])
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.columns; j++) {
        let sum = 0;
        for (let k = 0; k < a.columns; k++) {
          sum += a.get(k, i) * b.get(j, k);
        }
        this.set(j, i, sum);
      }
    }
    
    return this;
  }

  /**
   * Each subclass must declare its transpose type as a static property or getter.
   * For square matrices, this is the class itself.
   * For non-square matrices, this is the swapped-dimension class.
   * 
   * Note: TypeScript doesn't support abstract static properties, so this
   * is enforced via documentation and runtime checks.
   * 
   * Standard Pattern (use when no circular dependency):
   * Use `static readonly TransposeType` for most cases.
   * 
   * @example
   * class Matrix4 extends SquareMatrix {
   *   static readonly TransposeType = Matrix4;  // Square: 4x4 → 4x4
   * }
   * 
   * @example
   * class Matrix4x3 extends Matrix {
   *   static readonly TransposeType = Matrix3x4;  // Non-square: 4x3 → 3x4
   * }
   * 
   * Circular Dependency Pattern (use when classes reference each other):
   * If Matrix4x3 and Matrix3x4 reference each other in the same file, use a getter
   * to avoid "Cannot access before initialization" errors. The getter is evaluated
   * lazily when accessed, breaking the circular initialization dependency.
   * 
   * @example
   * class Matrix4x3 extends Matrix {
   *   static get TransposeType() {
   *     return Matrix3x4;  // Evaluated lazily, avoids initialization error
   *   }
   * }
   * 
   * class Matrix3x4 extends Matrix {
   *   static get TransposeType() {
   *     return Matrix4x3;  // Evaluated lazily, avoids initialization error
   *   }
   * }
   */
  // TransposeType must be declared by each subclass as either:
  //   - static readonly TransposeType: typeof MatrixClass;  (standard pattern)
  //   - static get TransposeType(): typeof MatrixClass { return MatrixClass; }  (circular dependency pattern)

  /**
   * Transposes a matrix and returns a new matrix (NON-MUTATING)
   * Similar to GLSL: mat4 b = transpose(a);
   * 
   * Generic implementation that works for any matrix dimensions.
   * Uses the TransposeType static property to determine the return type.
   * 
   * @param m - The matrix to transpose
   * @returns New transposed matrix with swapped dimensions
   * @throws Error if the transpose class doesn't provide fromElements() or fromArray()
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = Matrix.transpose(m1);  // m1 unchanged, m2 is transposed
   */
  static transpose<T extends Matrix>(m: T): Matrix {
    // Create transposed elements array with swapped dimensions
    const transposedElements = new Float32Array(m.size);
    
    // Transpose: element at (col, row) becomes element at (row, col)
    // In column-major storage:
    // - Original element at (j, i): stored at index j * rows + i
    // - Transposed element at (i, j): stored at index i * transposedRows + j
    //   where transposedRows = original columns
    const transposedRows = m.columns;
    for (let i = 0; i < m.rows; i++) {
      for (let j = 0; j < m.columns; j++) {
        // Element at (j, i) in original becomes (i, j) in transposed
        // In transposed matrix (column-major): stored at i * transposedRows + j
        transposedElements[i * transposedRows + j] = m.get(j, i);
      }
    }
    
    // Get the transpose type from the class's static property
    const Constructor = m.constructor as typeof Matrix & { TransposeType: new (...args: any[]) => Matrix };
    if (!Constructor.TransposeType) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'transpose',
        detail: `${m.constructor.name} must declare static readonly TransposeType property`,
      });
    }
    const TransposeClass = Constructor.TransposeType;
    
    // Create instance using fromElements() or fromArray() factory method
    // Matrix classes must provide one of these factory methods
    let result: Matrix;
    if ('fromElements' in TransposeClass && typeof (TransposeClass as any).fromElements === 'function') {
      result = (TransposeClass as any).fromElements(transposedElements);
    } else if ('fromArray' in TransposeClass && typeof (TransposeClass as any).fromArray === 'function') {
      result = (TransposeClass as any).fromArray(transposedElements);
    } else {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'transpose',
        detail:
          `${TransposeClass.name} must provide fromElements() or fromArray() factory method ` +
          `for transpose() to work`,
      });
    }
    
    // Runtime validation: verify dimensions are swapped correctly
    if (result.rows !== m.columns || result.columns !== m.rows) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'transpose',
        detail:
          `Transpose dimension mismatch: expected ${m.columns}x${m.rows}, ` +
          `got ${result.rows}x${result.columns}`,
      });
    }
    
    return result as InstanceType<typeof TransposeClass>;
  }

  /**
   * Sets this matrix to the identity matrix (MUTATING)
   * 
   * Generic implementation using optimized two-pass approach:
   * 1. Set all elements to 0 (no branching, sequential writes)
   * 2. Set diagonal to 1 (only min(rows, cols) iterations)
   * 
   * @returns This matrix (for chaining)
   * 
   * @example
   * const m = new Matrix4();
   * m.makeIdentity();  // Sets m to identity matrix
   */
  makeIdentity(): this {
     this._elements.fill(0);
    // Second pass: Set diagonal to 1 (only min(rows, cols) iterations)
    for (let i = 0; i < Math.min(this.rows, this.columns); i++) {
      this.set(i, i, 1);
    }
    return this;
  }

  /**
   * Creates a zero matrix (all elements are 0)
   * 
   * Creates an instance and calls makeIdentity() then zeros it out.
   * 
   * @returns A new zero matrix
   * 
   * @example
   * const m = Matrix4.zero();
   */
  static zero<T extends Matrix>(
    this: new (...args: any[]) => T
  ): T {
    // Create identity matrix (always valid), then zero it out
    const instance = new this();
    // Zero out all elements
    instance._elements.fill(0);
    return instance;
  }

  /**
   * Creates a matrix from a flat array (column-major order)
   * 
   * @param array - Array of elements in column-major order
   * @returns A new matrix
   * 
   * @example
   * const arr = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];  // Identity for Matrix4
   * const m = Matrix4.fromArray(arr);
   */
  static fromArray<T extends Matrix>(
    this: new (...args: any[]) => T,
    array: ArrayLike<number>
  ): T {
    // Create instance with array elements, validation will happen in constructor
    // Constructor takes variadic numbers and converts to Float32Array internally
    return new this(...Array.from(array));
  }

  /**
   * Creates a matrix from an array-like of numbers (column-major order)
   * Alias for fromArray() - provided for consistency
   * 
   * @param elements - Array-like of elements in column-major order
   * @returns A new matrix
   * 
   * @example
   * const arr = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
   * const m = Matrix4.fromElements(arr);
   */
  static fromElements<T extends Matrix>(
    this: new (...args: any[]) => T,
    elements: ArrayLike<number>
  ): T {
    // Create instance with elements, validation will happen in constructor
    // Constructor takes variadic numbers and converts to Float32Array internally
    return new this(...Array.from(elements));
  }

  /**
   * Static method: Adds two matrices and returns a new matrix
   * Similar to GLSL: mat4 c = a + b;
   * 
   * @param a - First matrix
   * @param b - Second matrix
   * @returns New matrix with the result
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * const m3 = Matrix4.add(m1, m2);  // Neither m1 nor m2 changed
   */
  static add<T extends Matrix>(
    this: new (...args: any[]) => T,
    a: T,
    b: T
  ): T {
    // Create new instance (identity by default)
    a._validateSameSize(a, b, 'add');
    const result = new this();
    for (let i = 0; i < a.rows; i++) {
        for (let j = 0; j < a.columns; j++) {
          let sum = a.get(j, i) + b.get(j, i);
          result.set(j, i, sum);
        }
      }
    return result;
  }

  static subtract<T extends Matrix>(
    this: new (...args: any[]) => T,
    a: T,
    b: T
  ): T {
    // Create new instance (identity by default)
    a._validateSameSize(a, b, 'subtract');
    const result = new this();
    for (let i = 0; i < a.rows; i++) {
        for (let j = 0; j < a.columns; j++) {
          let sum = a.get(j, i) - b.get(j, i);
          result.set(j, i, sum);
        }
      }
    return result;
  }

  /**
   * Static method: Multiplies two matrices and returns a new matrix
   * Similar to GLSL: mat4 c = a * b;
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
  static multiply<T extends Matrix>(
    this: new (...args: any[]) => T,
    a: T,
    b: T
  ): T {
    // Create new instance (identity by default)
    const result = new this();
    return result.multiplyMatrices(a, b);
  }

  /**
   * Checks if this matrix equals another matrix
   * Compares all elements for exact equality.
   * 
   * Requires matrices of the same dimensions.
   * 
   * Note: Uses strict equality (===). For floating-point comparisons with
   * tolerance, use `equalsEpsilon()` instead.
   * 
   * @param m - The matrix to compare with (must be same size)
   * @returns True if all elements are equal, false otherwise
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.equals(m2);  // Returns true (both are identity)
   */
  equals(m: Matrix): boolean {
    if (!this._areSameSize(this, m)) {
      return false;
    }
    const te = this._elements;
    const me = m._elements;
    for (let i = 0; i < this.size; i++) {
      if (te[i] !== me[i]) return false;
    }
    return true;
  }

  /**
   * Checks if this matrix equals another matrix within a tolerance
   * Useful for floating-point comparisons where exact equality may fail.
   * 
   * Requires matrices of the same dimensions.
   * 
   * @param m - The matrix to compare with (must be same size)
   * @param epsilon - Tolerance value (default: 0.00001)
   * @returns True if all elements are within epsilon, false otherwise
   * 
   * @example
   * const m1 = new Matrix4();
   * const m2 = new Matrix4();
   * m1.equalsEpsilon(m2, 0.00001);  // Returns true
   */
  equalsEpsilon(m: Matrix, epsilon: number = 0.00001): boolean {
    if (epsilon < 0) {
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: 'equalsEpsilon',
        detail: `epsilon must be non-negative, got ${epsilon}`,
      });
    }
    if (!this._areSameSize(this, m)) {
      return false;
    }
    const te = this._elements;
    const me = m._elements;
    for (let i = 0; i < this.size; i++) {
      const a = te[i]!;
      const b = me[i]!;
      // Handle NaN: NaN !== NaN, so if either is NaN, they're not equal
      if (Number.isNaN(a) || Number.isNaN(b)) {
        // If both are NaN, they're still not equal (NaN !== NaN)
        // If only one is NaN, they're not equal
        return false;
      }
      if (Math.abs(a - b) > epsilon) return false;
    }
    return true;
  }

  /**
   * Validates that all elements are finite numbers
   * Throws an error if any element is NaN or Infinity
   * @internal
   */
  protected _validateFinite(methodName: string): void {
    if (!this.isFinite()) {
      const nonFinite = Array.from(this._elements).filter(e => !Number.isFinite(e));
      throw new AppError(ErrorCode.MATH_INVALID_ARG, {
        resource: 'Matrix',
        method: methodName,
        detail: `matrix contains non-finite values (${nonFinite.join(', ')})`,
      });
    }
  }

  // ============================================================================
  // Type Checking Methods
  // ============================================================================
  // These methods check the numeric properties of matrix elements.
  // Useful for validating data before passing to WebGL integer uniforms.

  /**
   * Checks if all elements are finite numbers (not NaN or Infinity)
   *
   * @returns True if all elements are finite, false otherwise
   *
   * @example
   * new Matrix2(1, 2, 3, 4).isFinite();        // true
   * new Matrix2(1, NaN, 3, 4).isFinite();      // false
   * new Matrix2(1, Infinity, 3, 4).isFinite(); // false
   */
  isFinite(): boolean {
    return this._elements.every(e => Number.isFinite(e));
  }

  /**
   * Checks if all elements are integers
   *
   * @returns True if all elements are integers, false otherwise
   *
   * @example
   * new Matrix2(1, 2, 3, 4).isInteger();     // true
   * new Matrix2(1.5, 2, 3, 4).isInteger();   // false
   */
  isInteger(): boolean {
    return this._elements.every(e => Number.isInteger(e));
  }

  /**
   * Checks if all elements are non-negative integers (valid for unsigned int)
   *
   * @returns True if all elements are non-negative integers, false otherwise
   *
   * @example
   * new Matrix2(1, 2, 3, 4).isUnsignedInteger();   // true
   * new Matrix2(-1, 2, 3, 4).isUnsignedInteger();  // false
   * new Matrix2(1.5, 2, 3, 4).isUnsignedInteger(); // false
   */
  isUnsignedInteger(): boolean {
    return this._elements.every(e => Number.isInteger(e) && e >= 0);
  }

  // ============================================================================
  // Rounding Methods
  // ============================================================================
  // These methods convert floating-point elements to integers using different
  // rounding strategies. All methods validate that values are finite first.
  //
  // WebGL silently converts floats to integers using truncation, which can cause
  // subtle bugs. These methods make the conversion explicit and safe.

  /**
   * Truncates all elements toward zero (MUTATING)
   *
   * This is the default JavaScript/WebGL behavior for float-to-int conversion.
   * - 3.7 → 3
   * - -3.7 → -3
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.7, -2.3, 3.9, -4.1).truncate(); // (1, -2, 3, -4)
   */
  truncate(): this {
    this._validateFinite('truncate');
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i] = Math.trunc(this._elements[i]!);
    }
    return this;
  }

  /**
   * Static method: Truncates all elements and returns a new matrix
   *
   * @param m - The matrix to truncate
   * @returns New matrix with truncated values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static truncate<T extends Matrix>(m: T): T {
    return m.clone().truncate();
  }

  /**
   * Floors all elements toward negative infinity (MUTATING)
   *
   * Useful for grid/tile coordinates where you want consistent rounding down.
   * - 3.7 → 3
   * - -3.7 → -4
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.7, -2.3, 3.9, -4.1).floor(); // (1, -3, 3, -5)
   */
  floor(): this {
    this._validateFinite('floor');
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i] = Math.floor(this._elements[i]!);
    }
    return this;
  }

  /**
   * Static method: Floors all elements and returns a new matrix
   *
   * @param m - The matrix to floor
   * @returns New matrix with floored values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static floor<T extends Matrix>(m: T): T {
    return m.clone().floor();
  }

  /**
   * Ceils all elements toward positive infinity (MUTATING)
   *
   * Useful for size calculations where you want to round up.
   * - 3.1 → 4
   * - -3.7 → -3
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.1, -2.3, 3.9, -4.1).ceil(); // (2, -2, 4, -4)
   */
  ceil(): this {
    this._validateFinite('ceil');
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i] = Math.ceil(this._elements[i]!);
    }
    return this;
  }

  /**
   * Static method: Ceils all elements and returns a new matrix
   *
   * @param m - The matrix to ceil
   * @returns New matrix with ceiled values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static ceil<T extends Matrix>(m: T): T {
    return m.clone().ceil();
  }

  /**
   * Rounds all elements to nearest integer (MUTATING)
   *
   * Standard rounding: 0.5 rounds up.
   * - 3.4 → 3
   * - 3.5 → 4
   * - -3.5 → -3
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.4, 2.5, -3.5, 4.6).round(); // (1, 3, -3, 5)
   */
  round(): this {
    this._validateFinite('round');
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i] = Math.round(this._elements[i]!);
    }
    return this;
  }

  /**
   * Static method: Rounds all elements and returns a new matrix
   *
   * @param m - The matrix to round
   * @returns New matrix with rounded values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static round<T extends Matrix>(m: T): T {
    return m.clone().round();
  }

  /**
   * Expands all elements away from zero (MUTATING)
   *
   * Negative values are floored, positive values are ceiled.
   * Useful when you want to ensure you never underestimate magnitude.
   * - 3.1 → 4
   * - -3.1 → -4
   * - 0 → 0
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.1, -2.1, 0, 3.9).expand(); // (2, -3, 0, 4)
   */
  expand(): this {
    this._validateFinite('expand');
    for (let i = 0; i < this._elements.length; i++) {
      const e = this._elements[i]!;
      this._elements[i] = e >= 0 ? Math.ceil(e) : Math.floor(e);
    }
    return this;
  }

  /**
   * Static method: Expands all elements away from zero and returns a new matrix
   *
   * @param m - The matrix to expand
   * @returns New matrix with expanded values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static expand<T extends Matrix>(m: T): T {
    return m.clone().expand();
  }

  // ============================================================================
  // Clamping Methods
  // ============================================================================

  /**
   * Clamps all elements to be non-negative (MUTATING)
   *
   * Negative values become 0. Does not round - use with a rounding method.
   * - 3.5 → 3.5
   * - -3.5 → 0
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * new Matrix2(1.5, -2.5, 3.5, -4.5).clampNonNegative(); // (1.5, 0, 3.5, 0)
   */
  clampNonNegative(): this {
    this._validateFinite('clampNonNegative');
    for (let i = 0; i < this._elements.length; i++) {
      this._elements[i] = Math.max(0, this._elements[i]!);
    }
    return this;
  }

  /**
   * Static method: Clamps all elements to be non-negative and returns a new matrix
   *
   * @param m - The matrix to clamp
   * @returns New matrix with clamped values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static clampNonNegative<T extends Matrix>(m: T): T {
    return m.clone().clampNonNegative();
  }

  // ============================================================================
  // Integer Conversion Methods
  // ============================================================================
  // Convenience methods for preparing matrices for WebGL integer uniforms.

  /**
   * Converts this matrix to integers for use with int uniforms (MUTATING)
   *
   * This method validates all values are finite, then truncates to integers.
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * const m = new Matrix2(1.7, -2.3, 3.9, -4.1);
   * m.toInt(); // (1, -2, 3, -4)
   */
  toInt(): this {
    return this.truncate();
  }

  /**
   * Static method: Converts a matrix to integers and returns a new matrix
   *
   * @param m - The matrix to convert
   * @returns New matrix with integer values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static toInt<T extends Matrix>(m: T): T {
    return m.clone().toInt();
  }

  /**
   * Converts this matrix to unsigned integers for use with uint uniforms (MUTATING)
   *
   * This method validates all values are finite, clamps negatives to 0,
   * then truncates to integers.
   *
   * @returns This matrix (for chaining)
   * @throws Error if any element is NaN or Infinity
   *
   * @example
   * const m = new Matrix2(1.7, -2.3, 3.9, -4.1);
   * m.toUint(); // (1, 0, 3, 0)
   */
  toUint(): this {
    this._validateFinite('toUint');
    return this.clampNonNegative().truncate();
  }

  /**
   * Static method: Converts a matrix to unsigned integers and returns a new matrix
   *
   * @param m - The matrix to convert
   * @returns New matrix with unsigned integer values (same type as m)
   * @throws Error if any element is NaN or Infinity
   */
  static toUint<T extends Matrix>(m: T): T {
    return m.clone().toUint();
  }
}
