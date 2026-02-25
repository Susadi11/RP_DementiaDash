import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../common/Card';

const ModuleCard = ({ title, icon: Icon, children, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className="border-l-4 border-primary" shadow="shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-primary p-2.5 rounded-xl">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-deepBlue">{title}</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 hover:bg-secondaryBg rounded-lg transition-colors"
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-secondary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-secondary" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border">
          {children}
        </div>
      )}
    </Card>
  );
};

export default ModuleCard;
