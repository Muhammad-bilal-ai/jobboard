import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestUser {
  id: string;
  email: string;
  role: string;
}

export const GetUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: RequestUser }>();
    const user = request.user;
    return data ? user[data] : user;
  },
);
