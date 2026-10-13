'use client';

import { useState } from 'react';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openFaqId, setOpenFaqId] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: 'location_on',
      title: 'Address',
      content: '123 Precision Drive, Tech City, TC 12345',
    },
    {
      icon: 'phone',
      title: 'Phone',
      content: '+1 (555) 123-4567',
    },
    {
      icon: 'email',
      title: 'Email',
      content: 'support@velocprecision.com',
    },
    {
      icon: 'schedule',
      title: 'Hours',
      content: 'Mon-Fri: 9AM-6PM, Sat-Sun: 10AM-4PM',
    },
  ];

  return (
    <>
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white pt-12 md:pt-20 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="max-w-2xl">
              <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter mb-4 md:mb-6">
                GET IN TOUCH
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-300">
                Have a question about our components or services? We are here to help. Contact our engineering team today.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Information */}
        <section className="pt-12 md:pt-24 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16 md:mb-24">
              {contactInfo.map((info, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-50 mx-auto flex items-center justify-center rounded-lg mb-4 md:mb-6">
                    <span className="material-symbols-outlined text-2xl md:text-3xl text-red-600">
                      {info.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-sm md:text-lg font-bold text-slate-900 mb-2 md:mb-3 uppercase tracking-widest">
                    {info.title}
                  </h3>
                  <p className="text-secondary font-body text-xs md:text-sm">
                    {info.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Contact Form */}
            <div className="max-w-3xl mx-auto">
              <h2 className="font-headline text-2xl md:text-4xl font-bold tracking-tighter text-slate-900 mb-6 md:mb-8 text-center">
                SEND US A MESSAGE
              </h2>

              {submitted && (
                <div className="mb-6 md:mb-8 p-4 md:p-6 bg-green-50 border-2 border-green-600 text-green-700 font-headline text-sm md:text-base text-center">
                  ✓ Thank you! Your message has been sent successfully. We will get back to you soon.
                </div>
              )}

              {error && (
                <div className="mb-6 md:mb-8 p-4 md:p-6 bg-red-50 border-2 border-red-600 text-red-700 font-headline text-sm md:text-base text-center">
                  ✕ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label htmlFor="name" className="block text-xs md:text-sm font-headline font-bold text-slate-900 mb-1.5 md:mb-2 uppercase tracking-widest">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 font-body text-sm md:text-base text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs md:text-sm font-headline font-bold text-slate-900 mb-1.5 md:mb-2 uppercase tracking-widest">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 font-body text-sm md:text-base text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label htmlFor="phone" className="block text-xs md:text-sm font-headline font-bold text-slate-900 mb-1.5 md:mb-2 uppercase tracking-widest">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 font-body text-sm md:text-base text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-xs md:text-sm font-headline font-bold text-slate-900 mb-1.5 md:mb-2 uppercase tracking-widest">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 font-body text-sm md:text-base text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all bg-white"
                      required
                    >
                      <option value="">Select a subject...</option>
                      <option value="technical-support">Technical Support</option>
                      <option value="warranty">Warranty Inquiry</option>
                      <option value="installation">Installation Help</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="general">General Question</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs md:text-sm font-headline font-bold text-slate-900 mb-1.5 md:mb-2 uppercase tracking-widest">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    className="w-full px-3 md:px-4 py-2 md:py-3 border-2 border-slate-300 font-body text-sm md:text-base text-slate-900 focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-100 transition-all resize-none"
                    placeholder="Tell us more about your inquiry..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 text-white font-headline font-bold uppercase tracking-widest px-6 md:px-8 py-3 md:py-4 hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base"
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </form>

              <p className="text-center text-secondary text-xs uppercase tracking-widest mt-6 md:mt-8 font-headline">
                * Required fields
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-slate-50 pt-12 md:pt-24 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="mb-8 md:mb-12 lg:mb-16">
              <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-3 md:mb-4 text-center">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <p className="text-center text-secondary font-body text-xs md:text-sm lg:text-base max-w-2xl mx-auto">
                Find answers to common questions about our services, products, and support.
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-2 md:space-y-3 lg:space-y-4">
              {[
                {
                  q: 'What is the typical response time for support requests?',
                  a: 'We aim to respond to all inquiries within 24 hours during business hours. For urgent technical support, please call us directly at +1 (555) 123-4567.',
                },
                {
                  q: 'Do you offer installation services?',
                  a: 'Yes! We provide comprehensive installation and assembly services for all VELO PRECISION components. Contact our team to schedule an appointment.',
                },
                {
                  q: 'What is your warranty coverage?',
                  a: 'All VELO PRECISION components come with 1-year comprehensive warranty coverage, including manufacturing defects and performance issues.',
                },
                {
                  q: 'How can I track my order?',
                  a: 'Once your order ships, you will receive a tracking number via email. You can use this to monitor your delivery in real-time.',
                },
              ].map((faq, idx) => (
                <div
                  key={idx}
                  className={`border-2 transition-all duration-300 ease-out overflow-hidden ${
                    openFaqId === idx
                      ? 'border-red-600 bg-white shadow-lg'
                      : 'border-slate-200 bg-white hover:border-red-400 hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaqId(openFaqId === idx ? null : idx)}
                    className={`w-full px-3 sm:px-4 md:px-8 py-3 md:py-6 flex items-start justify-between gap-2 md:gap-4 transition-all duration-300 ${
                      openFaqId === idx ? 'bg-red-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <h3 className="font-headline text-xs md:text-base lg:text-lg font-bold text-slate-900 uppercase tracking-widest text-left leading-snug">
                      {faq.q}
                    </h3>
                    <span
                      className={`material-symbols-outlined flex-shrink-0 transition-all duration-500 ease-out text-red-600 text-sm md:text-base ${
                        openFaqId === idx ? 'rotate-180 scale-110' : 'scale-100 text-slate-400'
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Answer Section with Smooth Animation */}
                  <div
                    className={`overflow-hidden transition-all duration-500 ease-out ${
                      openFaqId === idx ? 'max-h-96 md:max-h-64' : 'max-h-0'
                    }`}
                  >
                    <div className="px-3 sm:px-4 md:px-8 py-3 md:py-6 bg-gradient-to-b from-red-50 to-white border-t-2 border-red-200">
                      <p
                        className={`text-secondary font-body leading-relaxed text-xs md:text-sm lg:text-base transition-all duration-500 ease-out transform ${
                          openFaqId === idx
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 -translate-y-2'
                        }`}
                      >
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional Help CTA */}
            <div className="mt-8 md:mt-12 lg:mt-16 text-center">
              <p className="text-secondary font-body text-xs md:text-sm lg:text-base mb-4 md:mb-6">
                Did not find the answer you are looking for?
              </p>
              <a
                href="#contact-form"
                className="inline-block bg-red-600 text-white font-headline font-bold uppercase tracking-widest px-4 md:px-8 py-2 md:py-3 text-xs md:text-sm hover:bg-red-700 transition-all duration-300 transform hover:scale-105 active:scale-95"
              >
                Contact Our Team
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
