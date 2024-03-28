import { SignUpController } from './signup';
import {
  MissingParamError,
  InvalidParamError,
  ServerError,
} from '../../errors';
import {
  EmailIsValidator,
  AddAccountModel,
  AddAccount,
  AccountModel,
} from './signup-protocols';

const makeEmailValidator = (): EmailIsValidator => {
  class EmailValidatorStub implements EmailIsValidator {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isValid(email: string): boolean {
      return true;
    }
  }
  return new EmailValidatorStub();
};

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async add(account: AddAccountModel): Promise<AccountModel> {
      const fakeAccount = {
        id: 'validId',
        name: 'validName',
        email: 'validEmail@gmail.com',
        password: 'validPassword',
      };
      return new Promise((resolve) => resolve(fakeAccount));
    }
  }
  return new AddAccountStub();
};

interface SutTypes {
  sut: SignUpController;
  emailValidatorStub: EmailIsValidator;
  addAccountStub: AddAccount;
}

const makeSut = (): SutTypes => {
  const emailValidatorStub = makeEmailValidator();
  const addAccountStub = makeAddAccount();
  const sut = new SignUpController(emailValidatorStub, addAccountStub);
  return { sut, emailValidatorStub, addAccountStub };
};

describe('SingUp Controller', () => {
  test('Should return 400 if no name is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        email: 'anyEmail@gmail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('name'));
  });

  test('Should return 400 if no email is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'anyName',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('email'));
  });

  test('Should return 400 if no password is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new MissingParamError('password'));
  });

  test('Should return 400 if no passwordConfirmation is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'anyPassword',
        password: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new MissingParamError('passwordConfirmation'),
    );
  });

  test('Should return 400 if no passwordConfirmation fails', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'anyPassword',
        password: 'anyPassword',
        passwordConfirmation: 'invalid_anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(
      new MissingParamError('passwordConfirmation'),
    );
  });

  test('Should return 400 if an invalid email is provided', async () => {
    const { sut, emailValidatorStub } = makeSut();
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false);
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'invalid_email@mail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(400);
    expect(httpResponse.body).toEqual(new InvalidParamError('email'));
  });

  test('Should call EmailValidator with correct email', () => {
    const { sut, emailValidatorStub } = makeSut();
    const isValidSpy = jest.spyOn(emailValidatorStub, 'isValid');

    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'invalid_email@mail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    sut.handle(httpRequest);
    expect(isValidSpy).toHaveBeenCalledWith('invalid_email@mail.com');
  });

  test('Should return 500 if EmailValidator throws Errors', async () => {
    const { sut, emailValidatorStub } = makeSut();
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'any_email@mail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should call AddAccount  with correct values', () => {
    const { sut, addAccountStub } = makeSut();
    const adddSpy = jest.spyOn(addAccountStub, 'add');

    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'invalid_email@mail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    sut.handle(httpRequest);
    expect(adddSpy).toHaveBeenCalledWith({
      name: 'anyName',
      email: 'invalid_email@mail.com',
      password: 'anyPassword',
    });
  });

  test('Should return 500 if AddAccount throws Errors', async () => {
    const { sut, addAccountStub } = makeSut();
    jest.spyOn(addAccountStub, 'add').mockImplementationOnce(() => {
      throw new Error();
    });
    const httpRequest = {
      body: {
        name: 'anyName',
        email: 'any_email@mail.com',
        password: 'anyPassword',
        passwordConfirmation: 'anyPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(500);
    expect(httpResponse.body).toEqual(new ServerError());
  });

  test('Should return 200 if  valid data is provided', async () => {
    const { sut } = makeSut();
    const httpRequest = {
      body: {
        name: 'validName',
        email: 'validEmail@gmail.com',
        password: 'validPassword',
        passwordConfirmation: 'validPassword',
      },
    };
    const httpResponse = await sut.handle(httpRequest);
    expect(httpResponse.statusCode).toBe(200);
    expect(httpResponse.body).toEqual({
      id: 'validId',
      name: 'validName',
      email: 'validEmail@gmail.com',
      password: 'validPassword',
    });
  });
});
