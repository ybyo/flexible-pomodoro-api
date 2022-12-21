import * as Joi from 'joi';

export const validationSchema = Joi.object({
  EMAIL_SERVICE: Joi.string().required(),
  EMAIL_AUTH_USER: Joi.string().required(),
  EMAIL_AUTH_PASSWORD: Joi.string().required(),
  BASE_URL: Joi.string().required(),
  FRONT_PORT: Joi.number().required(),
  API_PORT: Joi.number().required(),
});
