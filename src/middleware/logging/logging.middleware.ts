import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(req: any, res: any, next: () => void) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(
      `Incoming Request: ${method} ${originalUrl} - ${userAgent} - ${ip}`,
    );

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - startTime;

      this.logger.log(
        `Outgoing Response: ${statusCode} - ${contentLength} bytes - ${duration} ms`,
      );

      if (statusCode >= 400) {
        this.logger.error(
          `Error Response: ${statusCode} - ${contentLength} bytes - ${duration} ms`,
        );
      }
    });

    // log para erros de resposta
    res.on('error', (error) => {
      this.logger.error(
        `Response Error: ${error.message} - ${error.stack}`,
      );
    });

    // log para timeouts
    res.on('timeout', () => {
      this.logger.error(`Response Timeout: ${method} ${originalUrl} - ${ip}`);
    });

    next();
  }
}
