import { Controller, Get } from '@nestjs/common';
import { HealthResponseDto } from '../dto/health.response.dto';
import { BankIdService } from '../services/bankid.service';

@Controller('api/bankid')
export class BankIdController {
  constructor(private readonly bankIdService: BankIdService) {}

  @Get('health')
  getHealth(): HealthResponseDto {
    return this.bankIdService.getFoundationStatus();
  }
}
