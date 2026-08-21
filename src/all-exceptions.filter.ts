import { isAxiosError } from 'axios';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const hostType = host.getType();
    if (hostType === 'http') {
      // In certain situations `httpAdapter` might not be available in the
      // constructor method, thus we should resolve it here.
      const { httpAdapter } = this.httpAdapterHost;

      const ctx = host.switchToHttp();

      let httpStatus =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;

      // TODO: Create DTO to transmit the error response to the client
      let responseBody: any;

      if (exception instanceof HttpException) {
        responseBody = exception.getResponse();
      } else {
        const rawMessage =
          exception instanceof Error && !isAxiosError(exception)
            ? exception.message
            : 'Internal server error';

        const isKmsAccessDenied =
          (exception as any)?.name === 'AccessDeniedException' ||
          (exception as any)?.name === 'UnauthorizedException' ||
          rawMessage.includes('is not authorized to perform: kms:') ||
          (rawMessage.includes('kms:') &&
            rawMessage.includes('not authorized')) ||
          (rawMessage.includes('AccessDenied') && rawMessage.includes('kms'));

        // Blockchain / ERC-20 error check
        const err = exception as any;
        const revertReason: string =
          err?.reason ||
          err?.revert?.args?.[0] ||
          err?.error?.reason ||
          rawMessage ||
          '';

        const isInsufficientAllowance =
          (err?.code === 'CALL_EXCEPTION' ||
            rawMessage.startsWith('execution reverted')) &&
          revertReason.toLowerCase().includes('allowance');

        if (isKmsAccessDenied) {
          httpStatus = HttpStatus.FORBIDDEN;
          responseBody = {
            statusCode: HttpStatus.FORBIDDEN,
            message:
              'Access denied: You don’t have permission to use this encrypted key.',
            error: 'Forbidden',
          };
        } else if (isInsufficientAllowance) {
          httpStatus = HttpStatus.BAD_REQUEST;
          responseBody = {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'Token approval required.',
            message: 'Allowance is insufficient. Please approve and retry.',
          };
        } else {
          responseBody = {
            status: httpStatus,
            message: rawMessage,
          };
        }
      }

      httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
    }
  }
}
