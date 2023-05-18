import { ACommonResponseDto } from '@/shared/abstracts/common-response.base';

export class SuccessDto extends ACommonResponseDto {
  success: boolean;
}
