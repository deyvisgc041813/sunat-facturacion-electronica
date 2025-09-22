import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsSunatDateTime(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isSunatDateTime',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // ✅ Solo acepta formato:
          // YYYY-MM-DDTHH:mm:ss±HH:mm
          const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

          return regex.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe tener el formato: YYYY-MM-DDTHH:mm:ss±HH:mm (ejemplo: 2025-09-11T14:26:13-05:00)`;
        },
      },
    });
  };
}
