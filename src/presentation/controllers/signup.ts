import { HttpResponse, HttpRequest } from '../protocols/http';
import { MissingParamError, InvalidParamError } from '../errors/';
import { EmailIsValidator } from '../protocols/email-validator';
import { badRequest, serverError } from '../helpers/http-helper';
import { Controller } from '../protocols/controller';

export class SignUpController implements Controller {
  private readonly emailValidator: EmailIsValidator;

  constructor(emailValidator: EmailIsValidator) {
    this.emailValidator = emailValidator;
  }

  handle(httpRequest: HttpRequest): HttpResponse {
    try {
      const requiredFields = [
        'name',
        'email',
        'password',
        'passwordConfirmation',
      ];
      for (const field of requiredFields) {
        if (!httpRequest.body[field]) {
          return badRequest(new MissingParamError(field));
        }
      }

      const isValid = this.emailValidator.isValid(httpRequest.body.email);
      if (!isValid) {
        return badRequest(new InvalidParamError('email'));
      }
      return {
        statusCode: 200,
        body: 'Success',
      };
    } catch (error) {
      return serverError();
    }
  }
}
