import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { HealthResponseDto } from '../dto/health.response.dto';
import { StartAuthRequestDto } from '../dto/start-auth.request.dto';
import { StartAuthResponseDto } from '../dto/start-auth.response.dto';
import { StatusResponseDto } from '../dto/status.response.dto';
import { BankIdService } from '../services/bankid.service';

@Controller('api/bankid')
export class BankIdController {
  constructor(private readonly bankIdService: BankIdService) {}

  @Get('health')
  getHealth(): HealthResponseDto {
    return this.bankIdService.getFoundationStatus();
  }

  @Post('auth')
  startAuth(
    @Body() body: StartAuthRequestDto,
    @Req() request: Request,
  ): Promise<StartAuthResponseDto> {
    return this.bankIdService.startAuth(body, this.resolveEndUserIp(request));
  }

  @Get('orders/:orderId')
  getOrderStatus(@Param('orderId') orderId: string): Promise<StatusResponseDto> {
    return this.bankIdService.getOrderStatus(orderId);
  }

  private resolveEndUserIp(request: Request) {
    const socketAddress = request.socket.remoteAddress ?? request.ip ?? '';

    if (socketAddress === '::1') {
      return '127.0.0.1';
    }

    if (socketAddress.startsWith('::ffff:')) {
      return socketAddress.replace('::ffff:', '');
    }

    return socketAddress || '127.0.0.1';
  }
}
