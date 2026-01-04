import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen font-mono antialiased pb-12 selection:bg-accent selection:text-white">
      <div className="grain" />
      
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <header className="mb-12">
          <p className="text-accent-2 font-bold tracking-[0.2em] uppercase text-xs mb-4">Benefit Strategy Tool</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-ink mb-6 leading-tight">
            Find the age your claim choice pays off.
          </h1>
          <div className="max-w-3xl space-y-4 text-lg text-muted leading-relaxed font-sans">
            <p className="font-medium text-ink">For those born in 1960 and later</p>
            <p>
              Calculations below are meant as a quick view tool to give an apples to apples comparison of investing all your benefits into a compounding investment vehicle. Please consult with a Financial Advisor before taking any action.
            </p>
            <p>
              Enter your age 62 benefit, set assumptions, and compare two strategies to see when one overtakes the other — with COLA and interest compounding.
            </p>
          </div>
        </header>

        {children}

        <section className="mt-16 text-sm text-muted border-t border-dashed border-border pt-8 space-y-4 max-w-3xl mx-auto text-justify">
          <p><strong className="text-ink">Not Financial Advice:</strong> The information on this website is for general information purposes only and is not intended as financial, investment, or legal advice. The content does not take into account your specific objectives, financial situation, or needs. Any reliance you place on such information is therefore strictly at your own risk.</p>
          <p><strong className="text-ink">Professional Consultation Recommended:</strong> Before taking any actions based upon the information provided, we encourage you to consult with an appropriate licensed professionals, such as a qualified financial advisor, lawyer, or accountant, to ensure the advice is tailored to your unique circumstances.</p>
        </section>

        <section className="mt-16 text-center pb-12">
          <p className="text-muted mb-4 font-medium">Did this page save you some money?</p>
          <a
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent-2 text-paper font-bold rounded-full hover:brightness-110 transition-all transform hover:-translate-y-0.5 shadow-lg"
            href="https://venmo.com/u/Jake-Saf"
            target="_blank"
            rel="noreferrer"
          >
            Buy me a coffee <span aria-hidden="true" className="filter grayscale brightness-200">☕</span>
          </a>
        </section>
      </main>
    </div>
  );
};
