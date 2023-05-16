import { ACommonResponseDto } from '@/shared/abstract/common-response.base';

export class SuccessDto extends ACommonResponseDto {
  success: boolean;
}
