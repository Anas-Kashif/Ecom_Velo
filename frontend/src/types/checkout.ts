export interface CheckoutStep1Data {
  email: string;
  confirmEmail: string;
}

export interface CheckoutStep2Data {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  shippingMethod: 'standard' | 'express' | 'overnight';
}

export interface CheckoutStep3Data {
  paymentMethod: 'card' | 'cash_on_delivery';
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
  billingAddressSame: boolean;
  billingAddress?: string;
  billingCity?: string;
  billingState?: string;
  billingZipCode?: string;
  billingCountry?: string;
}

export interface CheckoutFormData extends CheckoutStep1Data, CheckoutStep2Data, CheckoutStep3Data {}

export interface ShippingOption {
  id: 'standard' | 'express' | 'overnight';
  label: string;
  price: number;
  estimatedDays: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
