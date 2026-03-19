import { IsIn } from 'class-validator';
import { BANKID_FLOWS, type BankIdFlow } from '../types/bankid.types';

export class StartAuthRequestDto {
  @IsIn(BANKID_FLOWS)
  flow!: BankIdFlow;
}
