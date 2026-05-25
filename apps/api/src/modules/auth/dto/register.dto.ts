import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Geçerli bir e-posta adresi giriniz' })
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8, { message: 'Şifre en az 8 karakter olmalıdır' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Şifre en az bir büyük harf, bir küçük harf ve bir rakam içermelidir',
  })
  password: string;

  @ApiProperty({ example: 'Ahmet' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Yılmaz' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ required: false, example: 'Acme Şirketi' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  organizationName?: string;

  @ApiProperty({ required: false, example: 'acme' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug sadece küçük harf, rakam ve tire içerebilir' })
  organizationSlug?: string;
}
