import { SetMetadata } from '@nestjs/common';

export const REQUIRE_EMAIL_VERIFICATION_KEY = 'requireEmailVerification';
export const EmailVerified = (require: boolean = true) =>
  SetMetadata(REQUIRE_EMAIL_VERIFICATION_KEY, require);
