import * as authService from './auth.service.js';
import { registerSchema, loginSchema } from './auth.validation.js';

export const register = async (req, res) => {
  try {
    // 1. Validate incoming JSON data
    const validatedData = registerSchema.parse(req.body);
    
    // 2. Call the Service layer to do the heavy lifting
    const user = await authService.registerUser(validatedData);
    
    // 3. Remove password from the response for security
    delete user.password;
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    // Return either Zod validation errors or Service errors
    res.status(400).json({ success: false, message: error.message || error.errors });
  }
};

export const login = async (req, res) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    const { user, token } = await authService.loginUser(validatedData);
    
    delete user.password;
    
    res.status(200).json({ success: true, data: { user, token } });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message || error.errors });
  }
};
