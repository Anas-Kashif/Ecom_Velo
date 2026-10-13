export default function HeroSection() {
  return (
    <section className="relative h-96 sm:h-[450px] md:h-[550px] lg:h-[550px] flex items-center overflow-hidden bg-surface-container-low">
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover object-center opacity-60" 
          alt="Close-up of a high-end carbon fiber road bike frame with red accents in a clinical white studio setting with professional lighting" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6F2ER126L_0Ug-n1E4qEMM59GhGBVG-C9qd6Hs-l8vt0P2YCnQUxec1JI5qUH16DXUtSmtivvbhAU5JACWzAPKhP7aFN8tU2IodrQthD0LHp1IiuTxfxEKJiWFTUfr4_A7TfBd7LDLwNZ1W0S05xnyhM1tc5G8A9iMX7H4Yaa1CcN99Ad4aY_7t-VyK7hn1WsjsxsgOJX5Qs5AjUOEgEaxGYIYAXJuxjiTKNRX_Rxkc9OfP0zJn4C_w3mfTNKv3OH-uP_7mrXszU" 
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/40 to-transparent"></div>
      </div>
      <div className="relative z-10 max-w-screen-2xl mx-auto px-4 sm:px-6 md:px-8 w-full">
        <div className="max-w-2xl">
          <span 
            className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-red-600 text-white font-headline text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 sm:mb-6 shadow-md relative" 
            style={{clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'}}
          >
            Series 7 Carbon Release
          </span>
          <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 mb-4 sm:mb-6 leading-[1.1]">
            ENGINEERING<br /><span className="text-red-600">THE APEX</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-secondary mb-6 sm:mb-10 max-w-md leading-relaxed">
            Uncompromising performance parts for those who demand surgical precision on every climb, corner, and sprint.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a href="/products" className="technical-gradient text-white px-6 sm:px-8 py-3 sm:py-4 font-headline font-bold uppercase tracking-tight hover:shadow-xl transition-all active:scale-95 inline-block text-center text-sm sm:text-base">
              Shop Components
            </a>
            <button className="border-2 border-slate-900 text-slate-900 px-6 sm:px-8 py-3 sm:py-4 font-headline font-bold uppercase tracking-tight hover:bg-slate-900 hover:text-white transition-all text-sm sm:text-base">
              View Specs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
