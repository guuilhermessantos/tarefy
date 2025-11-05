'use client';

export function AnimatedBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-[#0F0F10] via-[#1A1A1B] to-[#0F0F10]" />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div 
          className="absolute left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[#7B61FF] opacity-20 blur-[100px]"
          style={{
            animation: 'pulse-slow 4s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute right-[15%] top-[40%] h-[400px] w-[400px] rounded-full bg-[#8B5CF6] opacity-15 blur-[120px]"
          style={{
            animation: 'float-slow 10s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute left-[50%] bottom-[20%] h-[600px] w-[600px] rounded-full bg-[#7B61FF] opacity-10 blur-[150px]"
          style={{
            animation: 'pulse-slower 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Animated grid pattern */}
      <div 
        className="fixed inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(123, 97, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(123, 97, 255, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
        }}
      />

      {/* Floating geometric shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute left-[20%] top-[30%] h-32 w-32 rotate-45 border border-[#7B61FF]/20"
          style={{
            animation: 'float 6s ease-in-out infinite',
          }}
        />
        <div 
          className="absolute right-[25%] top-[60%] h-24 w-24 rotate-12 border border-[#8B5CF6]/20"
          style={{
            animation: 'float 8s ease-in-out infinite',
            animationDelay: '1s',
          }}
        />
        <div 
          className="absolute left-[60%] bottom-[30%] h-16 w-16 rotate-45 border border-[#7B61FF]/15"
          style={{
            animation: 'float-slow 10s ease-in-out infinite',
          }}
        />
      </div>
    </>
  );
}

