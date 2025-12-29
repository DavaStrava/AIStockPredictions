/**
 * Property Test: Type Import Consistency
 * 
 * Feature: codebase-cleanup, Property 4: Type Import Consistency
 * Validates: Requirements 3.2, 3.3, 3.4
 * 
 * This test verifies that all files using PredictionResult import it from
 * the centralized @/types/predictions location, ensuring single source of truth.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Recursively find all TypeScript/TSX files in a directory
 */
function findTsFiles(dir: string, files: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    // Skip node_modules, .next, and test files
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '__tests__') {
      continue;
    }
    
    if (entry.isDirectory()) {
      findTsFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip test files and the type definition file itself
      if (!entry.name.includes('.test.') && !entry.name.includes('.spec.')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Check if a file uses PredictionResult type
 */
function usesPredictionResult(content: string): boolean {
  // Match PredictionResult as a type annotation or in type declarations
  return /\bPredictionResult\b/.test(content);
}

/**
 * Check if a file imports PredictionResult from the correct location
 */
function hasCorrectImport(content: string): boolean {
  // Check for import from @/types/predictions or @/types (which re-exports)
  const correctImportPatterns = [
    /import\s+.*\bPredictionResult\b.*from\s+['"]@\/types\/predictions['"]/,
    /import\s+.*\bPredictionResult\b.*from\s+['"]@\/types['"]/,
    /import\s+type\s+.*\bPredictionResult\b.*from\s+['"]@\/types\/predictions['"]/,
    /import\s+type\s+.*\bPredictionResult\b.*from\s+['"]@\/types['"]/,
  ];
  
  return correctImportPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if a file defines PredictionResult locally (which is not allowed)
 */
function hasLocalDefinition(content: string): boolean {
  // Match interface or type definition of PredictionResult
  return /(?:interface|type)\s+PredictionResult\s*[={]/.test(content);
}

describe('Property 4: Type Import Consistency', () => {
  /**
   * Property: For any file that uses PredictionResult, it must import from centralized types
   * 
   * This property test generates random selections of source files and verifies
   * that any file using PredictionResult imports it from the correct location.
   */
  it('should import PredictionResult from @/types/predictions in all files', () => {
    const srcDir = path.resolve(__dirname, '../../..');
    const allFiles = findTsFiles(srcDir);
    
    // Filter to files that use PredictionResult
    const filesUsingPredictionResult = allFiles.filter(file => {
      const content = fs.readFileSync(file, 'utf-8');
      return usesPredictionResult(content);
    });
    
    // Property: For all files using PredictionResult, they must have correct import
    fc.assert(
      fc.property(
        fc.constantFrom(...filesUsingPredictionResult),
        (filePath: string) => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(srcDir, filePath);
          
          // Skip the type definition file itself
          if (relativePath.includes('types/predictions.ts')) {
            return true;
          }
          
          // File should not have local definition
          const hasLocal = hasLocalDefinition(content);
          if (hasLocal) {
            throw new Error(`File ${relativePath} has local PredictionResult definition`);
          }
          
          // File should have correct import
          const hasImport = hasCorrectImport(content);
          if (!hasImport) {
            throw new Error(`File ${relativePath} uses PredictionResult but doesn't import from @/types/predictions`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: No file should define PredictionResult locally (except the type file)
   */
  it('should not have local PredictionResult definitions outside types folder', () => {
    const srcDir = path.resolve(__dirname, '../../..');
    const allFiles = findTsFiles(srcDir);
    
    fc.assert(
      fc.property(
        fc.constantFrom(...allFiles),
        (filePath: string) => {
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(srcDir, filePath);
          
          // Skip the type definition file itself
          if (relativePath.includes('types/predictions.ts')) {
            return true;
          }
          
          // No local definitions allowed
          const hasLocal = hasLocalDefinition(content);
          if (hasLocal) {
            throw new Error(`File ${relativePath} has local PredictionResult definition - should import from @/types/predictions`);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
