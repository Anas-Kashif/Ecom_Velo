export default function NewsletterSection() {
  return (
    <section className="py-24 max-w-screen-2xl mx-auto px-8 overflow-hidden">
      <div className="bg-slate-900 p-16 md:p-24 relative flex flex-col md:flex-row justify-between items-center gap-12">
        <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none">
          <img 
            className="w-full h-full object-cover grayscale invert" 
            alt="Blueprint style drawing of bicycle gears and mechanical components" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuC-5pTKgjCRipFGE6lpJmTMZWJXwNV-Ewmo1hXb6J4_NCN5gvfmRm7CllONESHAifJLBBqSuTZy_YdRwgBsAvYmvAERWgRQFtK1UjiW6LhBF6Wlwhtb-D4OFMfQnjjH3lKlXjRmV38JF5QiKpCtSV7KRVO-hGk95Z512kwRfyjjN0ow7mafW3Tj8V1ub_OgOnyvvlKoFRe1y83RoN6AaVBnOtx-MZWLpGeXj8DPUDmqAfP5vV0tcnJTAw48di-E3U4g8E652mSQIJ0" 
          />
        </div>
        <div className="relative z-10 max-w-xl">
          <h2 className="font-headline text-4xl font-bold text-white mb-4 tracking-tighter">
            JOIN THE ATELIER
          </h2>
          <p className="text-slate-400 font-body text-lg leading-relaxed">
            Receive technical teardowns, engineering updates, and early access to limited edition precision drops.
          </p>
        </div>
        <div className="relative z-10 w-full max-w-md">
          <form className="flex flex-col gap-4">
            <div className="relative">
              <input 
                className="w-full bg-slate-800 border-none text-white px-6 py-4 focus:ring-2 focus:ring-primary-container font-body transition-all" 
                placeholder="Engineering Email Address" 
                type="email" 
              />
            </div>
            <button className="technical-gradient text-white font-headline font-bold uppercase tracking-widest py-4 px-8 hover:brightness-110 transition-all">
              Initialize Subscription
            </button>
          </form>
          <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-[0.2em]">
            Zero Spam. Only Performance. Secure transmission guaranteed.
          </p>
        </div>
      </div>
    </section>
  );
}
