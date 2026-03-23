import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const isHttpException = this.isHttpException(exception);
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const payload = this.buildPayload(exception, statusCode);

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        JSON.stringify({
          event: 'http_exception',
          method: request.method,
          path: request.originalUrl,
          statusCode,
          message: payload.message,
        }),
      );
    } else {
      this.logger.warn(
        JSON.stringify({
          event: 'http_exception',
          method: request.method,
          path: request.originalUrl,
          statusCode,
          message: payload.message,
        }),
      );
    }

    response.status(statusCode).json(payload);
  }

  private isHttpException(
    exception: unknown,
  ): exception is Pick<HttpException, 'getStatus' | 'getResponse' | 'message' | 'name'> {
    return (
      !!exception &&
      typeof exception === 'object' &&
      'getStatus' in exception &&
      typeof exception.getStatus === 'function' &&
      'getResponse' in exception &&
      typeof exception.getResponse === 'function'
    );
  }

  private buildPayload(exception: unknown, statusCode: number) {
    if (!this.isHttpException(exception)) {
      return {
        statusCode,
        error: 'Internal Server Error',
        message: 'Internal server error',
      };
    }

    const rawResponse = exception.getResponse();

    if (typeof rawResponse === 'string') {
      return {
        statusCode,
        error: exception.name,
        message: rawResponse,
      };
    }

    if (
      rawResponse &&
      typeof rawResponse === 'object' &&
      'statusCode' in rawResponse &&
      'message' in rawResponse
    ) {
      const typedResponse = rawResponse as {
        statusCode: number;
        error?: string;
        message: string | string[];
      };

      return {
        statusCode: typedResponse.statusCode,
        error: typedResponse.error ?? exception.name,
        message: typedResponse.message,
      };
    }

    return {
      statusCode,
      error: exception.name,
      message: exception.message,
    };
  }
}
