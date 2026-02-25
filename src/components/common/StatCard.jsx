import Card from './Card';

const StatCard = ({ title, value, icon: Icon, trend, trendValue, gradient = false, className = '' }) => {
  const highlightClass = gradient
    ? 'bg-primary/10 border border-primary/20'
    : '';

  return (
    <Card className={`${highlightClass} ${className}`} shadow="shadow-md" rounded="rounded-2xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-secondary text-sm font-medium mb-2">{title}</p>
          <p className="text-4xl font-bold text-deepBlue mb-2">{value}</p>
          {trend && (
            <div className={`flex items-center text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-medium">{trendValue}</span>
              <span className="ml-1 text-secondary">vs last week</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className="bg-primary p-3 rounded-xl">
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
