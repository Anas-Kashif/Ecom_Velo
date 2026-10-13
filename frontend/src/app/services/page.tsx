import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Link from 'next/link';

export const metadata = {
  title: 'Services | VELO PRECISION',
  description: 'Professional bicycle component services and technical support.',
};

export default function ServicesPage() {
  const services = [
    {
      icon: 'build',
      title: 'Component Assembly',
      description: 'Expert assembly and installation of premium bicycle components with precision engineering standards.',
    },
    {
      icon: 'settings',
      title: 'Technical Support',
      description: 'Comprehensive technical guidance and troubleshooting for all our products and components.',
    },
    {
      icon: 'handshake',
      title: 'Warranty Service',
      description: 'Full warranty coverage and support for all VELO PRECISION products. 1-year comprehensive coverage included.',
    },
    {
      icon: 'local_shipping',
      title: 'Fast Shipping',
      description: 'Quick and reliable shipping worldwide. Free shipping on orders over $100 with tracking included.',
    },
    {
      icon: 'school',
      title: 'Educational Resources',
      description: 'Access to assembly guides, maintenance tutorials, and technical documentation for all components.',
    },
    {
      icon: 'headset_mic',
      title: 'Customer Support',
      description: '24/7 customer support via multiple channels. Our experts are ready to assist with any questions.',
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
                ENGINEERING <br className="hidden md:block" />EXCELLENCE
              </h1>
              <p className="text-sm md:text-lg lg:text-xl text-gray-300 mb-6 md:mb-8">
                Beyond components. We provide comprehensive services to ensure your cycling experience is optimized for performance and reliability.
              </p>
              <Link
                href="/contact"
                className="inline-block bg-red-600 text-white font-headline font-bold uppercase tracking-widest px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base hover:bg-red-700 transition-colors"
              >
                Get Support →
              </Link>
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="pt-12 md:pt-24 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-3 md:mb-4">
              OUR SERVICES
            </h2>
            <p className="text-sm md:text-base lg:text-lg text-secondary mb-12 md:mb-16 max-w-2xl">
              Comprehensive support to maximize the performance of your VELO PRECISION components.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="p-4 md:p-8 border-2 border-slate-200 hover:border-red-600 transition-colors group"
                >
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 group-hover:bg-red-50 transition-colors rounded-lg flex items-center justify-center mb-4 md:mb-6">
                    <span className="material-symbols-outlined text-2xl md:text-3xl text-slate-900 group-hover:text-red-600 transition-colors">
                      {service.icon}
                    </span>
                  </div>
                  <h3 className="font-headline text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-4 uppercase tracking-widest">
                    {service.title}
                  </h3>
                  <p className="text-secondary font-body text-xs md:text-sm lg:text-base leading-relaxed">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Service Process */}
        <section className="bg-slate-50 pt-12 md:pt-24 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8">
            <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-slate-900 mb-12 md:mb-16">
              HOW WE WORK
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
              {[
                { number: '01', title: 'Contact', desc: 'Reach out with your needs or questions' },
                { number: '02', title: 'Assess', desc: 'Our experts evaluate your requirements' },
                { number: '03', title: 'Implement', desc: 'Professional service delivery and support' },
                { number: '04', title: 'Support', desc: 'Ongoing assistance and documentation' },
              ].map((step, idx) => (
                <div key={idx} className="text-center">
                  <div className="font-headline text-4xl md:text-5xl lg:text-6xl font-bold text-red-600 mb-3 md:mb-4">
                    {step.number}
                  </div>
                  <h3 className="font-headline text-base md:text-xl font-bold text-slate-900 mb-2 md:mb-3 uppercase tracking-widest">
                    {step.title}
                  </h3>
                  <p className="text-secondary font-body text-xs md:text-sm lg:text-base">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-slate-900 text-white pt-12 md:pt-24 pb-16 md:pb-24">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 text-center">
            <h2 className="font-headline text-2xl md:text-4xl lg:text-5xl font-bold tracking-tighter mb-6 md:mb-8">
              READY TO ELEVATE<br className="hidden md:block" /> YOUR PERFORMANCE?
            </h2>
            <p className="text-sm md:text-lg lg:text-xl text-gray-300 mb-8 md:mb-12 max-w-2xl mx-auto">
              Contact our engineering team today to discuss how VELO PRECISION services can optimize your setup.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
              <Link
                href="/contact"
                className="bg-red-600 text-white font-headline font-bold uppercase tracking-widest px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base hover:bg-red-700 transition-colors"
              >
                Contact Us
              </Link>
              <Link
                href="/products"
                className="border-2 border-white text-white font-headline font-bold uppercase tracking-widest px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base hover:bg-white hover:text-slate-900 transition-colors"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
