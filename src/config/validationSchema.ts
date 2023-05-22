import * as Joi from 'joi';

export const validationSchema = Joi.object({
  EMAIL_SERVICE: Joi.string().when('NODE_ENV', {
    is: Joi.equal('development'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_AUTH_USER: Joi.string().when('NODE_ENV', {
    is: Joi.equal('development'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  EMAIL_AUTH_PASSWORD: Joi.string().when('NODE_ENV', {
    is: Joi.equal('development'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SENDGRID_API: Joi.string().when('NODE_ENV', {
    is: Joi.not('development'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});
