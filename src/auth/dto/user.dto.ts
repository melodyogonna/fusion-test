export class CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export class LoginDto {
  email: string;
  password: string;
}
