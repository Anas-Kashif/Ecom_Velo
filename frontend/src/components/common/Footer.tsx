import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-50 border-t-0">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 lg:gap-12 px-4 sm:px-6 md:px-8 py-12 md:py-16 max-w-screen-2xl mx-auto">
        <div className="col-span-2 md:col-span-1">
          <div className="font-headline text-base md:text-lg font-bold text-slate-900 mb-4 md:mb-6 uppercase tracking-tighter">
            VELO PRECISION
          </div>
          <p className="text-xs md:text-sm text-slate-500 leading-relaxed font-body max-w-50">
            Curating high-performance digital showrooms and high-precision components since 2012. Engineering excellence is not an option; it is our standard.
          </p>
        </div>
        <div>
          <h4 className="font-headline text-xs md:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 md:mb-6">
            Shop
          </h4>
          <ul className="space-y-2 md:space-y-3 font-body text-xs md:text-sm">
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/products">All Products</Link></li>
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/products">Braking Systems</Link></li>
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/products">Cockpit Units</Link></li>
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/products">Wheel Dynamics</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-headline text-xs md:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 md:mb-6">
            Support
          </h4>
          <ul className="space-y-2 md:space-y-3 font-body text-xs md:text-sm">
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/services">Services</Link></li>
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/contact">Contact Us</Link></li>
            <li><a className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="#">Warranty Policy</a></li>
            <li><a className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="#">Assembly Guides</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-headline text-xs md:text-sm font-bold text-slate-900 uppercase tracking-widest mb-4 md:mb-6">
            Company
          </h4>
          <ul className="space-y-2 md:space-y-3 font-body text-xs md:text-sm">
            <li><Link className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="/contact">Contact Engineering</Link></li>
            <li><a className="text-slate-500 hover:text-red-600 underline decoration-2 underline-offset-4 transition-all" href="#">Privacy Policy</a></li>
            <li className="flex gap-3 md:gap-4 mt-4 md:mt-6">
              <a className="text-slate-900 hover:text-red-600 transition-colors" href="#"><span className="material-symbols-outlined text-sm md:text-base">terminal</span></a>
              <a className="text-slate-900 hover:text-red-600 transition-colors" href="#"><span className="material-symbols-outlined text-sm md:text-base">settings_input_component</span></a>
              <a className="text-slate-900 hover:text-red-600 transition-colors" href="#"><span className="material-symbols-outlined text-sm md:text-base">bolt</span></a>
            </li>
          </ul>
        </div>
      </div>
      <div className="px-4 sm:px-6 md:px-8 py-6 md:py-8 max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between items-center border-t border-slate-200 gap-3 md:gap-4">
        <p className="text-[8px] md:text-[10px] text-slate-400 font-headline uppercase tracking-widest text-center md:text-left">
          © 2024 VELO PRECISION. ENGINEERING EXCELLENCE.
        </p>
        <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-8 text-[8px] md:text-[10px] font-headline font-bold text-slate-400 uppercase tracking-widest">
          <span>ISO 9001 CERTIFIED</span>
          <span>GLOBAL LOGISTICS</span>
        </div>
      </div>
    </footer>
  );
}
