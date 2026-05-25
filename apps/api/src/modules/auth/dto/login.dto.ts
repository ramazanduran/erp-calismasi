import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@erp.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Şifre en az 6 karakter olmalıdır' })
  password: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  organizationSlug?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: '2FA kodu 6 karakter olmalıdır' })
  twoFactorCode?: string;
}
