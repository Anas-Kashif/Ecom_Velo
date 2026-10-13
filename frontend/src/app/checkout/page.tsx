import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import MultiStepCheckout from '@/components/sections/MultiStepCheckout';

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <MultiStepCheckout />
      </main>
      <Footer />
    </>
  );
}
