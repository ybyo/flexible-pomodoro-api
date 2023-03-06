import * as Joi from 'joi';

export const validationSchema = Joi.object({
  EMAIL_SERVICE: Joi.string(),
  EMAIL_AUTH_USER: Joi.string(),
  EMAIL_AUTH_PASSWORD: Joi.string(),
  FRONT_URL: Joi.string().required(),
  FRONT_PORT: Joi.number().required(),
  API_PORT: Joi.number().required(),
});
