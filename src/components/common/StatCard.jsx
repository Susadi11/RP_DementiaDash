import { motion, useSpring, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import Card from './Card';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, className = '', index = 0 }) => {
  const countRef = useRef(null);
  const numericValue = parseFloat(value) || 0;
  const isDecimal = value?.toString().includes('.');

  useEffect(() => {
    const controls = animate(0, numericValue, {
      duration: 2,
      delay: index * 0.1,
      ease: "easeOut",
      onUpdate: (latest) => {
        if (countRef.current) {
          countRef.current.textContent = isDecimal ? latest.toFixed(1) : Math.round(latest);
        }
      },
    });
    return () => controls.stop();
  }, [numericValue, index, isDecimal]);

  const getTheme = (title) => {
    const t = title.toLowerCase();
    if (t.includes('patient')) return { bg: 'bg-blue-500/10', icon: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-200', glow: 'rgba(37, 99, 235, 0.2)' };
    if (t.includes('avg') || t.includes('score')) return { bg: 'bg-purple-500/10', icon: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-200', glow: 'rgba(147, 51, 234, 0.2)' };
    if (t.includes('test') || t.includes('total')) return { bg: 'bg-indigo-500/10', icon: 'bg-indigo-600', text: 'text-indigo-600', border: 'border-indigo-200', glow: 'rgba(79, 70, 229, 0.2)' };
    if (t.includes('completed')) return { bg: 'bg-emerald-500/10', icon: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-200', glow: 'rgba(5, 150, 105, 0.2)' };
    if (t.includes('progress')) return { bg: 'bg-amber-500/10', icon: 'bg-amber-600', text: 'text-amber-600', border: 'border-amber-200', glow: 'rgba(217, 119, 6, 0.2)' };
    return { bg: 'bg-primary/10', icon: 'bg-primary', text: 'text-primary', border: 'border-primary/20', glow: 'rgba(79, 70, 229, 0.2)' };
  };

  const theme = getTheme(title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100
      }}
      whileHover={{
        y: -10,
        scale: 1.02,
        boxShadow: `0 20px 25px -5px ${theme.glow}, 0 10px 10px -5px ${theme.glow}`
      }}
      className="h-full"
    >
      <Card
        className={`relative h-full overflow-hidden group ${theme.bg} ${theme.border} border ${className} backdrop-blur-xl`}
        shadow="none"
        rounded="rounded-[2rem]"
        padding="p-0"
      >
        {/* Animated Background Aura */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={`absolute -right-12 -top-12 w-48 h-48 rounded-full blur-[80px] ${theme.icon} opacity-10`}
        />

        <div className="p-7 flex flex-col items-start justify-between h-full gap-6">
          <div className="flex justify-between items-start w-full">
            <motion.div
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              className={`${theme.icon} p-4 rounded-2xl shadow-xl shadow-black/5 group-hover:shadow-2xl transition-all duration-500`}
            >
              {Icon && <Icon className="w-6 h-6 text-white" />}
            </motion.div>

            {trend && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-md border border-white/50 shadow-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}
              >
                {trendValue}
              </motion.div>
            )}
          </div>

          <div className="relative z-10 w-full">
            <p className="text-secondary/60 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <span ref={countRef} className="text-4xl font-black text-gray-900 tracking-tighter italic">
                {isDecimal ? '0.0' : '0'}
              </span>
              {isDecimal && <span className="text-gray-400 text-sm font-medium">score</span>}
            </div>

            {/* Visual Indicator Line */}
            <div className="w-12 h-1 bg-gray-200/50 rounded-full mt-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.5, delay: index * 0.1 + 0.5 }}
                className={`h-full ${theme.icon}`}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default StatCard;
