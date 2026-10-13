import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.local' });

// Increase test timeout for database operations
declare const jest: any;
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
