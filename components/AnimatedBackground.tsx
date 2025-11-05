'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F0F10] via-[#1A1A1B] to-[#0F0F10]" />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className="bg-orb-1 absolute left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#7B61FF] opacity-20 blur-[100px]" />
        <div className="bg-orb-2 absolute right-[15%] top-[40%] h-[400px] w-[400px] rounded-full bg-[#8B5CF6] opacity-15 blur-[120px]" />
        <div className="bg-orb-3 absolute left-[50%] bottom-[20%] h-[600px] w-[600px] rounded-full bg-[#7B61FF] opacity-10 blur-[150px]" />
      </div>

      {/* Animated grid pattern */}
      <div className="bg-grid absolute inset-0 opacity-[0.03]" />

      {/* Floating geometric shapes */}
      <div className="absolute inset-0">
        <div className="float-shape-1 absolute left-[20%] top-[30%] h-32 w-32 rotate-45 border border-[#7B61FF]/20" />
        <div className="float-shape-2 absolute right-[25%] top-[60%] h-24 w-24 rotate-12 border border-[#8B5CF6]/20" />
        <div className="float-shape-3 absolute left-[60%] bottom-[30%] h-16 w-16 rotate-45 border border-[#7B61FF]/15" />
      </div>
    </div>
  );
}

