'use client';

import { useEffect, useState } from 'react';
import { generatePlaceholder } from '@/lib/placeholders';
import { getCategories, Category } from '@/lib/api';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  'Framesets': 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtrTx83iKY18CGBawNgyHtFl0cYF3FWPWpOZH9ykz4xXcIKXe4PQcw_QfdIlWAgx2UoAcSB2L9WhycJZALsyHyH0LrfgmeAPeeQzSeiVUSCYgJFkaHeZUO18vGRkJAU1ZeBBRF0gNvNFkl2x0qysdn-XkLL7Ahdy4xEy1CD6_Ot0auOZqbkIS558JgwvkTPvzSYJ_YL7J3ga0rjnuGjFGvaweNed_BhrRQMiuwG6ZwKdRe8ceZblhWVcm2yTYN_F8XY0QugAHq0hw',
  'Drivetrain': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmxgJbj0F62yCgdVZPQYD7qxbu4CjCcC8Iyfx2c09CSQUPE4TVUXi-t3GeGgOWjyuROE9qlgtIwhmuyrFXJC57v3YZiTGHuJT4RiLjRe3pGcjG0NmqajLpl71ZmQRdZDvCLLhjS962JZI3v9BcmesSn03fRzhGFCdKdinU48F1z5L6ef1OqDf25WtBG_1lbH-1lpBJYrvqz69u56ViX9MjgE-jyNkMM8hwNzSxBw9_p-TXKQKUPfeljEHiAxnujgJUl_mMB1JStvU',
  'Cockpit': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAaBfVIIeOLSga7iDyYZygIBUL5w_xvzLeuWxdG4Ib7b2lTRdr8_2Fs56PCElp2fo62IUN-99JtWIEnJfxmbCBvs9uB-FYUxUwyTt8MtUxqRtYw8Ztru-L0P_t6g-62mwfBQxOowYXgbrOtyv08lL-gVRu3V9FZ31m5Cr2xMSNvhywng2_UXHloVR2qvjNNIWLxG7wM5y0d00XLzBMo-Ff_5VgfPTamjrTpRCw14or5nTrsC5Z64npmxsy3XOTucDoCkTOperRZPWc',
  'Essentials': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJd3x9iNOaSvSlhTjvLwWweYRqNlBXdh94ZmGB2YicvAAue6vjJcFd-ACF8aIevma6n6W3PErC2HcXTg9ze_NJdMxSEK-Q22z6eYXK31mwahriePBbEihoxJfLK3YFO1hl2hpWzo9rxGw-9AIfw9r3jSymOB5gwVLEropyPT_Z_wy_7UT_LVw6LK3UAp_44bdFao7qJyHRXE_I8WoJIPNPnNQ4hl1LOnmu_lbpSBwyJnRyJ8M6R3GhzVbIk329a8bpjvFTE8vENzA',
};

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesData = await getCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <section className="py-24 max-w-screen-2xl mx-auto px-8">
        <p className="text-center text-slate-600">Loading categories...</p>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="py-24 max-w-screen-2xl mx-auto px-8">
        <p className="text-center text-slate-600">No categories available</p>
      </section>
    );
  }

  return (
    <section className="py-24 max-w-screen-2xl mx-auto px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-150">
        {categories.map((category, index) => {
          const isFeatured = index < 2;
          const isLarge = isFeatured;
          const imageUrl = category.image || DEFAULT_CATEGORY_IMAGES[category.name] || generatePlaceholder(category.name, 600);
          
          return (
            <div 
              key={category.id}
              className={`${
                isLarge ? 'md:col-span-2' : ''
              } ${
                index === 0 ? 'md:row-span-2' : ''
              } relative group overflow-hidden bg-surface-container-low cursor-pointer`}
              onClick={() => {
                // Navigate to category products page
                window.location.href = `/products?category=${category.id}`;
              }}
            >
              <img 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                alt={category.name}
                src={imageUrl}
              />
              <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/30 transition-colors"></div>
              <div className={`absolute bottom-8 left-8 ${isLarge ? 'md:bottom-8 md:left-8' : 'bottom-6 left-6'}`}>
                <h3 className={`font-headline font-bold text-white ${isLarge ? 'text-3xl' : 'text-xl'}`}>
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-white/80 font-body text-sm uppercase tracking-widest mt-1">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
