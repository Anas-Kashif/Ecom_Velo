import Header from '@/components/common/Header';
import ProductCatalog from '@/components/sections/ProductCatalog';
import Footer from '@/components/common/Footer';

export const metadata = {
  title: 'Products | VELO PRECISION',
  description: 'Browse our complete catalog of high-performance bicycle components.',
};

export default function ProductsPage() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <ProductCatalog />
      </main>
      <Footer />
    </>
  );
}
