export default function StatCard({ title, value, subtitle, icon: Icon, children }) {
  return (
    <div className="bg-[#1f2937] p-5 rounded-xl shadow border border-gray-800 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-muted text-sm font-medium">{title}</h3>
        {Icon && <div className="p-2 bg-surface rounded-lg"><Icon className="w-5 h-5 text-brand" /></div>}
      </div>
      <div>
        <div className="text-2xl font-bold text-white mb-1">{value}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
