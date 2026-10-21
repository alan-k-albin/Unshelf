'use client';

export default function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-2xl border-2 border-[#EDE6D6] p-3.5 animate-pulse">
      <div className="w-full h-40 bg-[#F3EFE4] rounded-xl mb-3"></div>
      <div className="h-4 bg-[#EDE6D6] rounded-md mb-2 w-3/4"></div>
      <div className="h-3 bg-[#F3EFE4] rounded-md mb-2 w-1/2"></div>
      <div className="h-3 bg-[#F3EFE4] rounded-md mb-2.5 w-2/3"></div>
      <div className="h-5 bg-[#EDE6D6] rounded-md w-1/3"></div>
    </div>
  );
}
