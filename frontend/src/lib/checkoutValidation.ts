import { ValidationError, CheckoutStep1Data, CheckoutStep2Data, CheckoutStep3Data } from '@/types/checkout';

// Email validation using RFC 5322 simplified pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation (basic US format)
const PHONE_REGEX = /^[\d\s\-\(\)]{10,}$/;

// ZIP code validation (US format)
const ZIPCODE_REGEX = /^\d{5}(-\d{4})?$/;

// Credit card patterns
const CARD_NUMBER_REGEX = /^[0-9]{13,19}$/;
const CVV_REGEX = /^[0-9]{3,4}$/;

export const validateStep1 = (data: CheckoutStep1Data): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Email validation
  if (!data.email || data.email.trim() === '') {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!EMAIL_REGEX.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  } else if (data.email.length > 255) {
    errors.push({ field: 'email', message: 'Email is too long' });
  }

  // Confirm email validation
  if (!data.confirmEmail || data.confirmEmail.trim() === '') {
    errors.push({ field: 'confirmEmail', message: 'Confirmation email is required' });
  } else if (data.email !== data.confirmEmail) {
    errors.push({ field: 'confirmEmail', message: 'Emails do not match' });
  }

  return errors;
};

export const validateStep2 = (data: CheckoutStep2Data): ValidationError[] => {
  const errors: ValidationError[] = [];

  // First name
  if (!data.firstName || data.firstName.trim() === '') {
    errors.push({ field: 'firstName', message: 'First name is required' });
  } else if (data.firstName.length > 50) {
    errors.push({ field: 'firstName', message: 'First name is too long' });
  }

  // Last name
  if (!data.lastName || data.lastName.trim() === '') {
    errors.push({ field: 'lastName', message: 'Last name is required' });
  } else if (data.lastName.length > 50) {
    errors.push({ field: 'lastName', message: 'Last name is too long' });
  }

  // Address
  if (!data.address || data.address.trim() === '') {
    errors.push({ field: 'address', message: 'Street address is required' });
  } else if (data.address.length > 100) {
    errors.push({ field: 'address', message: 'Address is too long' });
  }

  // City
  if (!data.city || data.city.trim() === '') {
    errors.push({ field: 'city', message: 'City is required' });
  } else if (data.city.length > 50) {
    errors.push({ field: 'city', message: 'City name is too long' });
  }

  // State
  if (!data.state || data.state.trim() === '') {
    errors.push({ field: 'state', message: 'State is required' });
  } else if (data.state.length > 50) {
    errors.push({ field: 'state', message: 'State name is too long' });
  }

  // ZIP code
  if (!data.zipCode || data.zipCode.trim() === '') {
    errors.push({ field: 'zipCode', message: 'ZIP code is required' });
  } else if (!ZIPCODE_REGEX.test(data.zipCode)) {
    errors.push({ field: 'zipCode', message: 'Invalid ZIP code format (use #####or #####-####)' });
  }

  // Country
  if (!data.country || data.country.trim() === '') {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  // Shipping method
  if (!data.shippingMethod || !['standard', 'express', 'overnight'].includes(data.shippingMethod)) {
    errors.push({ field: 'shippingMethod', message: 'Valid shipping method is required' });
  }

  return errors;
};

export const validateStep3 = (data: CheckoutStep3Data): ValidationError[] => {
  const errors: ValidationError[] = [];

  // Payment method validation
  if (!data.paymentMethod || !['card', 'cash_on_delivery'].includes(data.paymentMethod)) {
    errors.push({ field: 'paymentMethod', message: 'Please select a payment method' });
    return errors; // Return early if payment method not selected
  }

  // Only validate card fields if payment method is 'card'
  if (data.paymentMethod === 'card') {
    // Cardholder name
    if (!data.cardholderName || data.cardholderName.trim() === '') {
      errors.push({ field: 'cardholderName', message: 'Cardholder name is required' });
    } else if (data.cardholderName.length > 100) {
      errors.push({ field: 'cardholderName', message: 'Cardholder name is too long' });
    }

    // Card number - Luhn validation
    const cardNumber = (data.cardNumber || '').replace(/\s/g, '');
    if (!cardNumber || cardNumber === '') {
      errors.push({ field: 'cardNumber', message: 'Card number is required' });
    } else if (!CARD_NUMBER_REGEX.test(cardNumber)) {
      errors.push({ field: 'cardNumber', message: 'Card number must be 13-19 digits' });
    } else if (!luhnCheck(cardNumber)) {
      errors.push({ field: 'cardNumber', message: 'Invalid card number' });
    }

    // Expiry month
    if (!data.expiryMonth || data.expiryMonth === '') {
      errors.push({ field: 'expiryMonth', message: 'Expiry month is required' });
    } else {
      const month = parseInt(data.expiryMonth, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        errors.push({ field: 'expiryMonth', message: 'Invalid expiry month' });
      }
    }

    // Expiry year
    if (!data.expiryYear || data.expiryYear === '') {
      errors.push({ field: 'expiryYear', message: 'Expiry year is required' });
    } else {
      const year = parseInt(data.expiryYear, 10);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < currentYear || year > currentYear + 20) {
        errors.push({ field: 'expiryYear', message: 'Invalid expiry year' });
      }
    }

    // CVV
    if (!data.cvv || data.cvv.trim() === '') {
      errors.push({ field: 'cvv', message: 'CVV is required' });
    } else if (!CVV_REGEX.test(data.cvv)) {
      errors.push({ field: 'cvv', message: 'CVV must be 3 or 4 digits' });
    }
  }

  return errors;
};

// Luhn algorithm for credit card validation
export const luhnCheck = (cardNumber: string): boolean => {
  let sum = 0;
  let isEven = false;

  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cardNumber[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Check if card has expired
export const isCardExpired = (month: string, year: string): boolean => {
  const expiryMonth = parseInt(month, 10);
  const expiryYear = parseInt(year, 10);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (expiryYear < currentYear) {
    return true;
  }

  if (expiryYear === currentYear && expiryMonth < currentMonth) {
    return true;
  }

  return false;
};

// Mask card number for display (show only last 4 digits)
export const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, '');
  const lastFour = cleaned.slice(-4);
  return `**** **** **** ${lastFour}`;
};

// Sanitize input to prevent XSS
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>]/g, '');
};
