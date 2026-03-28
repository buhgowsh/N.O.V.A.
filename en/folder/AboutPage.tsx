import Navbar from "@/components/ui/Navbar";
import ParticleComponent from "@/components/ui/Particles";

export default function AboutPage() {
  return (
    <div className="flex flex-col bg-white text-blue-900 min-h-screen w-full relative">
      {/* Particle Background */}
      <div className="absolute inset-0 z-10 blur-xs">
        <ParticleComponent />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow min-h-screen w-full px-6 md:px-20 py-16 flex flex-col gap-12 items-center justify-center z-10 ">
        <section className="max-w-4xl text-center space-y-4 fade-in">
          <p className="text-xl text-extrabold text-gray-900 text-shadow-xs "><h2 className="text-[4rem] font-semibold font-theme text-center text-blue-700 text-shadow-s mb-8">About</h2>
            <strong>N.O.V.A</strong> stands for <em>"Neural Optimization with Visual Analysis"</em>.
            <p>AI stemmed from a deep understanding of the unique challenges faced by individuals who suffer from attention deficit, particularly in maintaining consistent focus and managing cognitive overload in a world designed for neurotypical minds. Many of us on the team have either personally experienced or closely witnessed the struggles that come with conditions like ADHD, autism, and anxiety, where traditional productivity tools often fall short. 
          </p>
          </p>
        </section>

        <section className="max-w-4xl space-y-4 text-left fade-in"> 
          <h2 className="text-[4rem] font-semibold font-theme text-center text-blue-700 text-shadow-sm ">Inspiration</h2>
          <p className="text-xl text-extrabold text-gray-900 text-shadow-xs ">
            
We envisioned NOVA we designed it with empathy and intention in mind. Drawing on psychological factors, user-centered design, and emerging technologies, NOVA was built to not only track facial expressions and attention patterns but to interpret them meaningfully, offering adaptive tools and gentle guidance. Our goal was to create a space where users feel they gain self-awareness and are empowered to build better habits that truly work for them, not against them.
          </p>
        </section>
      </main>
    </div>
  );
}
