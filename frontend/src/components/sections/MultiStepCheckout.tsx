'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import {
  CheckoutFormData,
  CheckoutStep1Data,
  CheckoutStep2Data,
  CheckoutStep3Data,
  ValidationError,
  ShippingOption,
} from '@/types/checkout';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  maskCardNumber,
  sanitizeInput,
} from '@/lib/checkoutValidation';

const SHIPPING_OPTIONS: ShippingOption[] = [
  { id: 'standard', label: 'Standard Shipping', price: 15.00, estimatedDays: '5-7 days' },
  { id: 'express', label: 'Express Shipping', price: 30.00, estimatedDays: '2-3 days' },
  { id: 'overnight', label: 'Overnight Shipping', price: 50.00, estimatedDays: 'Next business day' },
];

export default function MultiStepCheckout() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepErrors, setStepErrors] = useState<ValidationError[]>([]);

  const [formData, setFormData] = useState<CheckoutFormData>({
    email: '',
    confirmEmail: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    shippingMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: '',
    billingAddressSame: true,
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: '',
  });

  // Calculate pricing
  const subtotal = total;
  const shippingCost = formData.shippingMethod
    ? SHIPPING_OPTIONS.find(opt => opt.id === formData.shippingMethod)?.price || 15.00
    : 15.00;
  const shippingFree = subtotal > 100 && formData.shippingMethod === 'standard' ? true : false;
  const finalShippingCost = shippingFree ? 0 : shippingCost;
  const tax = subtotal * 0.08;
  const orderTotal = subtotal + finalShippingCost + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : sanitizeInput(value);

    setFormData(prev => ({
      ...prev,
      [name]: inputValue,
    }));

    if (stepErrors.length > 0) {
      setStepErrors(stepErrors.filter(err => err.field !== name));
    }
  };

  const handleNextStep = () => {
    let errors: ValidationError[] = [];

    if (currentStep === 1) {
      errors = validateStep1(formData as CheckoutStep1Data);
    } else if (currentStep === 2) {
      errors = validateStep2(formData as CheckoutStep2Data);
    } else if (currentStep === 3) {
      errors = validateStep3(formData as CheckoutStep3Data);
    }

    if (errors.length > 0) {
      setStepErrors(errors);
      setError(`Please fix ${errors.length} error(s) before proceeding.`);
      return;
    }

    setStepErrors([]);
    setError('');

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
      setStepErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateStep3(formData as CheckoutStep3Data);
    if (errors.length > 0) {
      setStepErrors(errors);
      setError(`Please fix ${errors.length} error(s) before submitting.`);
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData: any = {
        email: formData.email,
        customerName: `${formData.firstName} ${formData.lastName}`,
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        shippingMethod: formData.shippingMethod,
        shippingCost: finalShippingCost,
        tax: tax,
        total: orderTotal,
        paymentMethod: formData.paymentMethod,
      };

      if (formData.paymentMethod === 'card') {
        orderData.paymentStatus = 'pending';
        orderData.lastFourDigits = (formData.cardNumber || '').split(' ').join('').slice(-4);
      } else if (formData.paymentMethod === 'cash_on_delivery') {
        orderData.paymentStatus = 'pending_on_delivery';
        orderData.lastFourDigits = null;
      }

      // Create order
      const orderResponse = await fetch('/api/orders/checkout/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to create order');
      }

      const order = await orderResponse.json();
      clearCart();
      router.push(`/order-confirmation/${order.id}`);
    } catch (err) {
      setError((err as Error).message || 'Failed to process order. Please try again.');
      console.error('Order error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0 && currentStep === 1) {
    return (
      <section className="pt-4 md:pt-6 pb-16 md:pb-24">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-8 md:mb-12">
            CHECKOUT
          </h1>
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 md:p-8 text-center">
            <p className="text-lg md:text-xl text-slate-900 mb-3 md:mb-4">Your cart is empty</p>
            <a
              href="/products"
              className="inline-block px-6 md:px-8 py-2.5 md:py-3 bg-red-600 text-white font-headline font-bold text-sm md:text-base hover:bg-red-700 transition-colors"
            >
              Continue Shopping
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="pt-4 md:pt-6 pb-16 md:pb-24">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="font-headline text-2xl sm:text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 mb-8 md:mb-12">
          CHECKOUT
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-12">
          <div className="lg:col-span-2">
            {/* Step Indicators */}
            <div className="mb-8 md:mb-12">
              <div className="flex items-center justify-between gap-2 md:gap-4">
                {[1, 2, 3].map(step => (
                  <div key={step} className="flex-1 flex items-center gap-2 md:gap-3">
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm md:text-base transition-all ${
                        step < currentStep
                          ? 'bg-green-600 text-white'
                          : step === currentStep
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {step < currentStep ? '✓' : step}
                    </div>
                    {step < 3 && (
                      <div
                        className={`flex-1 h-1 md:h-1.5 rounded-full transition-all ${
                          step < currentStep ? 'bg-green-600' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-3 gap-2 md:gap-4">
                <p className={`text-xs md:text-sm font-headline font-bold ${currentStep === 1 ? 'text-red-600' : 'text-slate-600'}`}>
                  Email
                </p>
                <p className={`text-xs md:text-sm font-headline font-bold ${currentStep === 2 ? 'text-red-600' : 'text-slate-600'}`}>
                  Shipping
                </p>
                <p className={`text-xs md:text-sm font-headline font-bold ${currentStep === 3 ? 'text-red-600' : 'text-slate-600'}`}>
                  Payment
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 md:p-4 bg-red-100 border-2 border-red-600 rounded">
                <p className="text-red-800 font-semibold text-sm md:text-base">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              {/* Step 1: Email */}
              {currentStep === 1 && (
                <div>
                  <h2 className="font-headline text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                    Enter Your Email
                  </h2>
                  <div className="space-y-4 md:space-y-5">
                    <div>
                      <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                          stepErrors.some(err => err.field === 'email')
                            ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                            : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                        }`}
                      />
                      {stepErrors.find(err => err.field === 'email') && (
                        <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                          {stepErrors.find(err => err.field === 'email')?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                        Confirm Email Address
                      </label>
                      <input
                        type="email"
                        name="confirmEmail"
                        placeholder="confirm@email.com"
                        value={formData.confirmEmail}
                        onChange={handleChange}
                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                          stepErrors.some(err => err.field === 'confirmEmail')
                            ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                            : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                        }`}
                      />
                      {stepErrors.find(err => err.field === 'confirmEmail') && (
                        <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                          {stepErrors.find(err => err.field === 'confirmEmail')?.message}
                        </p>
                      )}
                    </div>

                    <div className="bg-blue-50 border-l-4 border-blue-600 p-3 md:p-4">
                      <p className="text-xs md:text-sm text-blue-900">
                        ℹ️ We'll send your order confirmation to this email address.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Shipping */}
              {currentStep === 2 && (
                <div>
                  <h2 className="font-headline text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                    Shipping Information
                  </h2>

                  <div className="mb-6 md:mb-8">
                    <h3 className="font-headline text-base md:text-lg font-bold text-slate-900 mb-4">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                            stepErrors.some(err => err.field === 'firstName')
                              ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                              : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                          }`}
                        />
                        {stepErrors.find(err => err.field === 'firstName') && (
                          <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                            {stepErrors.find(err => err.field === 'firstName')?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                            stepErrors.some(err => err.field === 'lastName')
                              ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                              : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                          }`}
                        />
                        {stepErrors.find(err => err.field === 'lastName') && (
                          <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                            {stepErrors.find(err => err.field === 'lastName')?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-6 md:mb-8">
                    <h3 className="font-headline text-base md:text-lg font-bold text-slate-900 mb-4">
                      Shipping Address
                    </h3>

                    <div className="mb-3 md:mb-4">
                      <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                        Street Address
                      </label>
                      <input
                        type="text"
                        name="address"
                        placeholder="123 Main St"
                        value={formData.address}
                        onChange={handleChange}
                        className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                          stepErrors.some(err => err.field === 'address')
                            ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                            : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                        }`}
                      />
                      {stepErrors.find(err => err.field === 'address') && (
                        <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                          {stepErrors.find(err => err.field === 'address')?.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <div>
                        <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          placeholder="New York"
                          value={formData.city}
                          onChange={handleChange}
                          className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                            stepErrors.some(err => err.field === 'city')
                              ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                              : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                          }`}
                        />
                        {stepErrors.find(err => err.field === 'city') && (
                          <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                            {stepErrors.find(err => err.field === 'city')?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                          State
                        </label>
                        <input
                          type="text"
                          name="state"
                          placeholder="NY"
                          value={formData.state}
                          onChange={handleChange}
                          className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                            stepErrors.some(err => err.field === 'state')
                              ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                              : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                          }`}
                        />
                        {stepErrors.find(err => err.field === 'state') && (
                          <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                            {stepErrors.find(err => err.field === 'state')?.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          placeholder="10001"
                          value={formData.zipCode}
                          onChange={handleChange}
                          className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                            stepErrors.some(err => err.field === 'zipCode')
                              ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                              : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                          }`}
                        />
                        {stepErrors.find(err => err.field === 'zipCode') && (
                          <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                            {stepErrors.find(err => err.field === 'zipCode')?.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 md:mt-4">
                      <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                        Country
                      </label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="w-full px-3 md:px-4 py-2.5 md:py-3 border-2 border-slate-900 font-body text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Mexico">Mexico</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-headline text-base md:text-lg font-bold text-slate-900 mb-4">
                      Shipping Method
                    </h3>
                    <div className="space-y-2 md:space-y-3">
                      {SHIPPING_OPTIONS.map(option => (
                        <label key={option.id} className="flex items-start gap-3 md:gap-4 p-3 md:p-4 border-2 rounded cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: formData.shippingMethod === option.id ? '#ef2626' : '#e2e8f0'}}>
                          <input
                            type="radio"
                            name="shippingMethod"
                            value={option.id}
                            checked={formData.shippingMethod === option.id}
                            onChange={handleChange}
                            className="mt-1 md:mt-1.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-headline font-bold text-sm md:text-base text-slate-900">
                              {option.label}
                            </p>
                            <p className="text-xs md:text-sm text-secondary mt-1">
                              {option.estimatedDays}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-headline font-bold text-sm md:text-base text-slate-900">
                              {option.price === 0 ? (
                                <span className="text-green-600">FREE</span>
                              ) : (
                                `$${option.price.toFixed(2)}`
                              )}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <div>
                  <h2 className="font-headline text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                    Payment Method
                  </h2>

                  {/* Payment Method Selection */}
                  <div className="mb-6 md:mb-8">
                    <div className="space-y-3 md:space-y-4">
                      {/* Card Option */}
                      <label className="flex items-start gap-3 md:gap-4 p-4 md:p-5 border-2 rounded cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: formData.paymentMethod === 'card' ? '#ef2626' : '#e2e8f0'}}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={handleChange}
                          className="mt-1 md:mt-1.5"
                        />
                        <div className="flex-1">
                          <p className="font-headline font-bold text-sm md:text-base text-slate-900">
                            💳 Credit/Debit Card (Stripe)
                          </p>
                          <p className="text-xs md:text-sm text-secondary mt-1">
                            Pay securely through Stripe. Your data is encrypted.
                          </p>
                        </div>
                      </label>

                      {/* COD Option */}
                      <label className="flex items-start gap-3 md:gap-4 p-4 md:p-5 border-2 rounded cursor-pointer hover:bg-slate-50 transition-colors" style={{borderColor: formData.paymentMethod === 'cash_on_delivery' ? '#ef2626' : '#e2e8f0'}}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={formData.paymentMethod === 'cash_on_delivery'}
                          onChange={handleChange}
                          className="mt-1 md:mt-1.5"
                        />
                        <div className="flex-1">
                          <p className="font-headline font-bold text-sm md:text-base text-slate-900">
                            🚚 Cash on Delivery
                          </p>
                          <p className="text-xs md:text-sm text-secondary mt-1">
                            Pay when your order arrives.
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Card Payment Form */}
                  {formData.paymentMethod === 'card' && (
                    <div>
                      <div className="mb-6 md:mb-8 bg-yellow-50 border-l-4 border-yellow-600 p-3 md:p-4">
                        <p className="text-xs md:text-sm text-yellow-900 font-semibold">
                          🔒 Your payment is processed securely through Stripe. Card details are encrypted.
                        </p>
                      </div>

                      <div className="space-y-4 md:space-y-5">
                        <div>
                          <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            name="cardholderName"
                            placeholder="John Doe"
                            value={formData.cardholderName}
                            onChange={handleChange}
                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                              stepErrors.some(err => err.field === 'cardholderName')
                                ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                                : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                            }`}
                          />
                          {stepErrors.find(err => err.field === 'cardholderName') && (
                            <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                              {stepErrors.find(err => err.field === 'cardholderName')?.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardNumber}
                            onChange={(e) => {
                              const value = e.target.value.replace(/\s/g, '');
                              const formatted = value.replace(/(\d{4})/g, '$1 ').trim();
                              setFormData(prev => ({ ...prev, cardNumber: formatted }));
                            }}
                            maxLength={19}
                            className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all font-mono ${
                              stepErrors.some(err => err.field === 'cardNumber')
                                ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                                : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                            }`}
                          />
                          {stepErrors.find(err => err.field === 'cardNumber') && (
                            <p className="text-red-600 text-xs md:text-sm mt-1 font-semibold">
                              {stepErrors.find(err => err.field === 'cardNumber')?.message}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                          <div>
                            <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                              Expiry Month
                            </label>
                            <select
                              name="expiryMonth"
                              value={formData.expiryMonth}
                              onChange={handleChange}
                              className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                                stepErrors.some(err => err.field === 'expiryMonth')
                                  ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                                  : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                              }`}
                            >
                              <option value="">MM</option>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                <option key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                            {stepErrors.find(err => err.field === 'expiryMonth') && (
                              <p className="text-red-600 text-xs mt-1 font-semibold">
                                {stepErrors.find(err => err.field === 'expiryMonth')?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                              Expiry Year
                            </label>
                            <select
                              name="expiryYear"
                              value={formData.expiryYear}
                              onChange={handleChange}
                              className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all ${
                                stepErrors.some(err => err.field === 'expiryYear')
                                  ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                                  : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                              }`}
                            >
                              <option value="">YY</option>
                              {Array.from({ length: 20 }, (_, i) => {
                                const year = new Date().getFullYear() + i;
                                return (
                                  <option key={year} value={year.toString()}>
                                    {year.toString().slice(-2)}
                                  </option>
                                );
                              })}
                            </select>
                            {stepErrors.find(err => err.field === 'expiryYear') && (
                              <p className="text-red-600 text-xs mt-1 font-semibold">
                                {stepErrors.find(err => err.field === 'expiryYear')?.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-sm font-headline font-bold text-slate-900 mb-2">
                              CVV
                            </label>
                            <input
                              type="text"
                              name="cvv"
                              placeholder="123"
                              value={formData.cvv}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                setFormData(prev => ({ ...prev, cvv: value }));
                              }}
                              maxLength={4}
                              className={`w-full px-3 md:px-4 py-2.5 md:py-3 border-2 font-body text-sm focus:outline-none transition-all font-mono ${
                                stepErrors.some(err => err.field === 'cvv')
                                  ? 'border-red-600 focus:ring-2 focus:ring-red-400'
                                  : 'border-slate-900 focus:ring-2 focus:ring-red-600'
                              }`}
                            />
                            {stepErrors.find(err => err.field === 'cvv') && (
                              <p className="text-red-600 text-xs mt-1 font-semibold">
                                {stepErrors.find(err => err.field === 'cvv')?.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-slate-200">
                        <label className="flex items-center gap-2 md:gap-3 mb-4">
                          <input
                            type="checkbox"
                            name="billingAddressSame"
                            checked={formData.billingAddressSame}
                            onChange={handleChange}
                            className="w-4 h-4 md:w-5 md:h-5"
                          />
                          <span className="font-headline font-bold text-sm md:text-base text-slate-900">
                            Billing address same as shipping
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* COD Confirmation */}
                  {formData.paymentMethod === 'cash_on_delivery' && (
                    <div className="bg-green-50 border-2 border-green-600 rounded-lg p-6 md:p-8">
                      <div className="flex items-start gap-4">
                        <div className="text-4xl shrink-0">🚚</div>
                        <div>
                          <h3 className="font-headline text-lg md:text-xl font-bold text-green-900 mb-3">
                            Cash on Delivery Selected
                          </h3>
                          <ul className="text-sm md:text-base text-green-900 space-y-2">
                            <li>✓ No payment required now</li>
                            <li>✓ Pay the delivery person upon arrival</li>
                            <li>✓ Order confirmation sent to {formData.email || 'your email'}</li>
                            <li>✓ Processing takes 1-2 additional business days</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3 md:gap-4 pt-6 md:pt-8">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 border-2 border-slate-900 text-slate-900 font-headline font-bold text-sm md:text-base hover:bg-slate-100 transition-colors"
                  >
                    Back
                  </button>
                )}

                {currentStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-red-600 text-white font-headline font-bold text-sm md:text-base hover:bg-red-700 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-green-600 text-white font-headline font-bold text-sm md:text-base hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Complete Order'}
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-lg lg:sticky lg:top-24">
              <h2 className="font-headline text-lg md:text-2xl font-bold text-slate-900 mb-4 md:mb-6">
                ORDER SUMMARY
              </h2>

              <div className="mb-6 md:mb-8 pb-6 md:pb-8 border-b-2 border-slate-200 space-y-3 md:space-y-4 max-h-60 md:max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-headline font-bold text-xs md:text-sm text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-secondary mt-0.5 md:mt-1">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-headline font-bold text-slate-900 text-xs md:text-sm shrink-0">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 md:space-y-3 mb-4 md:mb-6 text-xs md:text-sm">
                <div className="flex justify-between items-center">
                  <p className="text-secondary">Subtotal</p>
                  <p className="font-headline font-bold text-slate-900">
                    ${subtotal.toFixed(2)}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-secondary">Shipping</p>
                  <p className="font-headline font-bold text-slate-900">
                    {finalShippingCost === 0 ? (
                      <span className="text-green-600">FREE</span>
                    ) : (
                      `$${finalShippingCost.toFixed(2)}`
                    )}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-secondary">Tax (8%)</p>
                  <p className="font-headline font-bold text-slate-900">
                    ${tax.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="pt-4 md:pt-6 border-t-2 border-slate-900 flex justify-between items-center gap-2">
                <p className="font-headline font-bold text-slate-900 text-sm md:text-lg">
                  TOTAL
                </p>
                <p className="font-headline font-bold text-red-600 text-lg md:text-3xl">
                  ${orderTotal.toFixed(2)}
                </p>
              </div>

              <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-slate-200 space-y-2 md:space-y-3 text-xs text-secondary">
                <p>🔒 Secure SSL encryption</p>
                <p>✓ 30-day return policy</p>
                <p>✓ 1-year warranty</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
