import Header from '@/components/common/Header';
import HeroSection from '@/components/sections/HeroSection';
import CategoryGrid from '@/components/sections/CategoryGrid';
import FeaturedProducts from '@/components/sections/FeaturedProducts';
import NewsletterSection from '@/components/sections/NewsletterSection';
import Footer from '@/components/common/Footer';

export default function Home() {
  return (
    <>
      <Header />
      <main className="pt-20">
        <HeroSection />
        <CategoryGrid />
        <FeaturedProducts />
        <NewsletterSection />
      </main>
      <Footer />
    </>
  );
}
