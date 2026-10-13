import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { Application } from 'express';
import { logger } from './logger';

/**
 * HTTPS/SSL Configuration for Production
 * Supports both self-signed certificates and Let's Encrypt certificates
 */

interface HttpsOptions {
  enabled: boolean;
  certPath?: string;
  keyPath?: string;
  port: number;
  redirectHttp?: boolean;
  httpPort?: number;
}

export class HttpsConfig {
  /**
   * Create HTTPS server with certificate
   */
  static createSecureServer(
    app: Application,
    options: HttpsOptions,
  ): https.Server | http.Server {
    // Check if HTTPS is enabled
    if (!options.enabled) {
      logger.info('HTTPS disabled, using HTTP');
      return http.createServer(app);
    }

    // Validate certificate and key paths
    if (!options.certPath || !options.keyPath) {
      logger.error('HTTPS enabled but certificate paths were not provided');
      throw new Error(
        'SSL certificate paths required. Set SSL_CERT_PATH and SSL_KEY_PATH environment variables.',
      );
    }

    // Check if certificate files exist
    if (!fs.existsSync(options.certPath) || !fs.existsSync(options.keyPath)) {
      logger.error('SSL certificate files not found', undefined, {
        certPath: options.certPath,
        keyPath: options.keyPath,
      });
      throw new Error('SSL certificate files not found');
    }

    // Read certificate and key
    const cert = fs.readFileSync(options.certPath, 'utf8');
    const key = fs.readFileSync(options.keyPath, 'utf8');

    // Create HTTPS server
    const httpsServer = https.createServer({ cert, key }, app);

    // Optionally redirect HTTP to HTTPS
    if (options.redirectHttp && options.httpPort) {
      const httpApp = require('express')();
      httpApp.all('*', (req: any, res: any) => {
        res.redirect(`https://${req.header('host')}${req.url}`);
      });
      http.createServer(httpApp).listen(options.httpPort, () => {
        logger.info('HTTP to HTTPS redirect enabled', {
          httpPort: options.httpPort,
          httpsPort: options.port,
        });
      });
    }

    logger.info('HTTPS enabled');
    return httpsServer;
  }

  /**
   * Get HTTPS options from environment variables
   */
  static fromEnvironment(): HttpsOptions {
    const enabled = process.env.HTTPS_ENABLED === 'true';
    const certPath = process.env.SSL_CERT_PATH;
    const keyPath = process.env.SSL_KEY_PATH;
    const port = parseInt(process.env.HTTPS_PORT || '443', 10);
    const httpPort = parseInt(process.env.HTTP_PORT || '80', 10);
    const redirectHttp = process.env.HTTPS_REDIRECT_HTTP !== 'false';

    return {
      enabled,
      certPath,
      keyPath,
      port,
      httpPort,
      redirectHttp,
    };
  }

  /**
   * Generate self-signed certificate (for development only)
   */
  static generateSelfSignedCert(outputDir: string = './certs'): void {
    const { execSync } = require('child_process');

    // Create certs directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const certPath = path.join(outputDir, 'cert.pem');
    const keyPath = path.join(outputDir, 'key.pem');

    // Skip if files already exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      logger.info('Self-signed certificates already exist');
      return;
    }

    try {
      logger.info('Generating self-signed certificate');
      execSync(
        `openssl req -x509 -newkey rsa:4096 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`,
        { stdio: 'inherit' },
      );
      logger.info('Self-signed certificate generated', { certPath, keyPath });
    } catch (error) {
      logger.error('Failed to generate self-signed certificate', error);
      throw error;
    }
  }

  /**
   * Security headers middleware
   */
  static securityHeaders() {
    return (req: any, res: any, next: any) => {
      // Strict Transport Security
      res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      // Prevent MIME type sniffing
      res.set('X-Content-Type-Options', 'nosniff');

      // Prevent clickjacking
      res.set('X-Frame-Options', 'DENY');

      // Enable XSS protection
      res.set('X-XSS-Protection', '1; mode=block');

      // Content Security Policy
      res.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
      );

      // Referrer Policy
      res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Permissions Policy
      res.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=(), payment=(), usb=()',
      );

      next();
    };
  }
}

export default HttpsConfig;
