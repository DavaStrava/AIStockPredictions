/**
 * Property Test: JSDoc Preservation for Public APIs
 * 
 * Feature: codebase-cleanup, Property 5: JSDoc Preservation for Public APIs
 * Validates: Requirements 4.3
 * 
 * This test verifies that all exported functions, classes, and interfaces
 * in the cleaned-up database connection module have essential JSDoc documentation.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents an exported symbol found in a TypeScript file
 */
interface ExportedSymbol {
  name: string;
  type: 'function' | 'class' | 'interface' | 'const';
  hasJsDoc: boolean;
  lineNumber: number;
}

/**
 * Parse a TypeScript file and extract exported symbols with their JSDoc status
 */
function parseExportedSymbols(content: string): ExportedSymbol[] {
  const symbols: ExportedSymbol[] = [];
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Check for exported function declarations
    const exportFunctionMatch = line.match(/^export\s+(?:async\s+)?function\s+(\w+)/);
    if (exportFunctionMatch) {
      const hasJsDoc = checkForJsDoc(lines, i);
      symbols.push({
        name: exportFunctionMatch[1],
        type: 'function',
        hasJsDoc,
        lineNumber,
      });
      continue;
    }
    
    // Check for exported class declarations
    const exportClassMatch = line.match(/^export\s+(?:default\s+)?class\s+(\w+)/);
    if (exportClassMatch) {
      const hasJsDoc = checkForJsDoc(lines, i);
      symbols.push({
        name: exportClassMatch[1],
        type: 'class',
        hasJsDoc,
        lineNumber,
      });
      continue;
    }
    
    // Check for exported interface declarations
    const exportInterfaceMatch = line.match(/^export\s+interface\s+(\w+)/);
    if (exportInterfaceMatch) {
      const hasJsDoc = checkForJsDoc(lines, i);
      symbols.push({
        name: exportInterfaceMatch[1],
        type: 'interface',
        hasJsDoc,
        lineNumber,
      });
      continue;
    }
    
    // Check for named exports at end of file (e.g., export { DatabaseConnection })
    const namedExportMatch = line.match(/^export\s+\{\s*(\w+)\s*\}/);
    if (namedExportMatch) {
      // Find the original declaration and check its JSDoc
      const symbolName = namedExportMatch[1];
      const classDeclaration = content.match(new RegExp(`class\\s+${symbolName}\\s*[{<]`));
      if (classDeclaration) {
        const classLineIndex = content.substring(0, classDeclaration.index).split('\n').length - 1;
        const hasJsDoc = checkForJsDoc(lines, classLineIndex);
        symbols.push({
          name: symbolName,
          type: 'class',
          hasJsDoc,
          lineNumber: classLineIndex + 1,
        });
      }
    }
  }
  
  return symbols;
}

/**
 * Check if there's a JSDoc comment before the given line index
 */
function checkForJsDoc(lines: string[], lineIndex: number): boolean {
  // Look backwards from the current line to find JSDoc
  let i = lineIndex - 1;
  
  // Skip empty lines
  while (i >= 0 && lines[i].trim() === '') {
    i--;
  }
  
  // Check if we found a JSDoc closing tag
  if (i >= 0 && lines[i].trim().endsWith('*/')) {
    // Look for the opening tag
    while (i >= 0) {
      if (lines[i].includes('/**')) {
        return true;
      }
      i--;
    }
  }
  
  return false;
}

/**
 * Get the list of files to check for JSDoc preservation
 */
function getFilesToCheck(): string[] {
  return [
    path.resolve(__dirname, '../connection.ts'),
  ];
}

describe('Property 5: JSDoc Preservation for Public APIs', () => {
  /**
   * Property: For any exported function in cleaned-up modules, it must have JSDoc documentation
   */
  it('should have JSDoc comments for all exported functions', () => {
    const files = getFilesToCheck();
    
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const symbols = parseExportedSymbols(content);
      const exportedFunctions = symbols.filter(s => s.type === 'function');
      
      if (exportedFunctions.length === 0) {
        return; // No exported functions to check
      }
      
      fc.assert(
        fc.property(
          fc.constantFrom(...exportedFunctions),
          (symbol: ExportedSymbol) => {
            if (!symbol.hasJsDoc) {
              throw new Error(
                `Exported function '${symbol.name}' at line ${symbol.lineNumber} in ${path.basename(filePath)} is missing JSDoc documentation`
              );
            }
            return true;
          }
        ),
        { numRuns: Math.min(100, exportedFunctions.length * 10) }
      );
    }
  });

  /**
   * Property: For any exported class in cleaned-up modules, it must have JSDoc documentation
   */
  it('should have JSDoc comments for all exported classes', () => {
    const files = getFilesToCheck();
    
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const symbols = parseExportedSymbols(content);
      const exportedClasses = symbols.filter(s => s.type === 'class');
      
      if (exportedClasses.length === 0) {
        return; // No exported classes to check
      }
      
      fc.assert(
        fc.property(
          fc.constantFrom(...exportedClasses),
          (symbol: ExportedSymbol) => {
            if (!symbol.hasJsDoc) {
              throw new Error(
                `Exported class '${symbol.name}' at line ${symbol.lineNumber} in ${path.basename(filePath)} is missing JSDoc documentation`
              );
            }
            return true;
          }
        ),
        { numRuns: Math.min(100, exportedClasses.length * 10) }
      );
    }
  });

  /**
   * Verify that the connection.ts file has the expected exported symbols with JSDoc
   */
  it('should have JSDoc for all public API exports in connection.ts', () => {
    const connectionPath = path.resolve(__dirname, '../connection.ts');
    const content = fs.readFileSync(connectionPath, 'utf-8');
    const symbols = parseExportedSymbols(content);
    
    // Expected public API exports
    const expectedExports = [
      'getDatabase',
      'initializeDatabaseFromSecret',
      'initializeDatabaseLocal',
      'DatabaseConnection',
    ];
    
    for (const exportName of expectedExports) {
      const symbol = symbols.find(s => s.name === exportName);
      expect(symbol, `Expected export '${exportName}' not found`).toBeDefined();
      expect(symbol?.hasJsDoc, `Export '${exportName}' should have JSDoc documentation`).toBe(true);
    }
  });

  /**
   * Property: JSDoc comments should contain essential documentation elements
   */
  it('should have meaningful JSDoc content (not empty comments)', () => {
    const files = getFilesToCheck();
    
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Find all JSDoc comments
      const jsDocPattern = /\/\*\*[\s\S]*?\*\//g;
      const jsDocComments = content.match(jsDocPattern) || [];
      
      if (jsDocComments.length === 0) {
        throw new Error(`No JSDoc comments found in ${path.basename(filePath)}`);
      }
      
      fc.assert(
        fc.property(
          fc.constantFrom(...jsDocComments),
          (jsDoc: string) => {
            // Remove comment markers and whitespace
            const cleanedContent = jsDoc
              .replace(/\/\*\*|\*\/|\*/g, '')
              .trim();
            
            // JSDoc should have meaningful content (at least 10 characters)
            if (cleanedContent.length < 10) {
              throw new Error(`JSDoc comment is too short or empty: ${jsDoc.substring(0, 50)}...`);
            }
            
            return true;
          }
        ),
        { numRuns: Math.min(100, jsDocComments.length * 10) }
      );
    }
  });
});
