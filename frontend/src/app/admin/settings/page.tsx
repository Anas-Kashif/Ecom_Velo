'use client';

import { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    siteName: '',
    siteEmail: '',
    adminEmail: '',
    phoneNumber: '',
    taxRate: '',
    shippingCost: '',
    currencyCode: 'USD',
    maintenanceMode: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setSaved(true);
    setIsLoading(false);
    
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-gray-600">Configure your store settings and preferences</p>
      </div>

      {/* Save Success Message */}
      {saved && (
        <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-700">
          <div className="h-5 w-5 rounded-full bg-green-600 flex items-center justify-center">
            <span className="text-white text-sm">✓</span>
          </div>
          <p className="font-medium">Settings saved successfully!</p>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">General Settings</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="siteName" className="block text-sm font-medium text-gray-700">
                Site Name
              </label>
              <input
                id="siteName"
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="siteEmail" className="block text-sm font-medium text-gray-700">
                  Site Email
                </label>
                <input
                  id="siteEmail"
                  type="email"
                  name="siteEmail"
                  value={formData.siteEmail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
                  Admin Email
                </label>
                <input
                  id="adminEmail"
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        </div>

        {/* Store Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Store Settings</h2>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currencyCode"
                  name="currencyCode"
                  value={formData.currencyCode}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD (C$)</option>
                </select>
              </div>

              <div>
                <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700">
                  Tax Rate (%)
                </label>
                <input
                  id="taxRate"
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  step="0.01"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="shippingCost" className="block text-sm font-medium text-gray-700">
                Default Shipping Cost
              </label>
              <div className="mt-2 flex items-center">
                <span className="mr-3 text-gray-600">$</span>
                <input
                  id="shippingCost"
                  type="number"
                  name="shippingCost"
                  value={formData.shippingCost}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">System Settings</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                id="maintenanceMode"
                type="checkbox"
                name="maintenanceMode"
                checked={formData.maintenanceMode}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <div className="flex-1">
                <label htmlFor="maintenanceMode" className="block text-sm font-medium text-gray-700">
                  Maintenance Mode
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  When enabled, the store will show a maintenance message to visitors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration Notice */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">API Integration</h3>
              <p className="mt-1 text-sm text-blue-700">
                To connect this admin panel to your backend API, update the API endpoints in 
                your environment variables and the service layer.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-5 w-5" />
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
