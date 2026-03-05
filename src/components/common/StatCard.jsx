import { motion } from 'framer-motion';
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, gradient = false, className = '' }) => {
  // Dynamic color mapping for more visual variety
  const getTheme = (title) => {
    const t = title.toLowerCase();
    if (t.includes('patient')) return { bg: 'bg-blue-500/10', icon: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200' };
    if (t.includes('avg') || t.includes('score')) return { bg: 'bg-purple-500/10', icon: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200' };
    if (t.includes('test') || t.includes('total')) return { bg: 'bg-indigo-500/10', icon: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200' };
    if (t.includes('completed')) return { bg: 'bg-emerald-500/10', icon: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200' };
    if (t.includes('progress')) return { bg: 'bg-amber-500/10', icon: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200' };
    return { bg: 'bg-primary/10', icon: 'bg-primary', text: 'text-primary', border: 'border-primary/20' };
  };

  const theme = getTheme(title);

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Card
        className={`relative overflow-hidden group ${theme.bg} ${theme.border} border ${className}`}
        shadow="shadow-glass-md"
        rounded="rounded-3xl"
        padding="p-0"
      >
        {/* Subtle background glow effect */}
        <div className={`absolute -right-8 -top-8 w-24 h-24 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${theme.icon}`} />

        <div className="p-6 flex items-center gap-5">
          <div className={`${theme.icon} p-4 rounded-2xl shadow-lg shadow-indigo-200/50 group-hover:scale-110 transition-transform duration-300`}>
            {Icon && <Icon className="w-6 h-6 text-white" />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-secondary/80 text-xs font-bold uppercase tracking-wider mb-0.5">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
              {trend && (
                <div className={`flex items-center text-[10px] font-bold ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <span className="flex items-center px-1.5 py-0.5 rounded-full bg-white/50 backdrop-blur-sm border border-white/80 shadow-sm">
                    {trendValue}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
