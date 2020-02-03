import Joi from "@hapi/joi";

export const LoginValidationSchema = Joi.object().keys({
    phoneNumber: Joi.number().required(),
    password: Joi.string().required(),
});

export const SignupValidationSchema = Joi.object().keys({
    firstName: Joi.string().alphanum().required(),
    lastName: Joi.string().alphanum().required(),
    phoneNumber: Joi.number().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    roleId: Joi.string().uuid().optional(),
});

export const RefreshTokensValidationSchema = Joi.object().keys({
    refreshToken: Joi.string()
        .uuid()
        .required(),
});