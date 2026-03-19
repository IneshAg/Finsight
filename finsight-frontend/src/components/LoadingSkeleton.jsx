export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Top row cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1f2937] h-32 rounded-xl border border-gray-800"></div>
        ))}
      </div>
      
      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-[#1f2937] h-80 rounded-xl border border-gray-800"></div>
        <div className="lg:col-span-4 bg-[#1f2937] h-80 rounded-xl border border-gray-800"></div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1f2937] h-96 rounded-xl border border-gray-800"></div>
        <div className="bg-[#1f2937] h-96 rounded-xl border border-gray-800"></div>
      </div>
    </div>
  );
}
