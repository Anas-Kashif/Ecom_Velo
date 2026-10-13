import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import Cart from '@/components/sections/Cart';

export const metadata = {
  title: 'Shopping Cart | VELO PRECISION',
  description: 'Review and manage your shopping cart.',
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <Cart />
      </main>
      <Footer />
    </>
  );
}
