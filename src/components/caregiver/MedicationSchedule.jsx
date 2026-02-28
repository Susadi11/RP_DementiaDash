import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Pill, Check, X } from 'lucide-react';
import Card from '../common/Card';
import { getMedicationSchedule } from '../../services/api';

/**
 * Medication Schedule Component
 * Displays weekly medication calendar with adherence tracking
 */
const MedicationSchedule = ({ patientId }) => {
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days] = useState(7);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchMedicationSchedule();
  }, [patientId, days]);

  const fetchMedicationSchedule = async () => {
    try {
      setLoading(true);
      const data = await getMedicationSchedule(patientId, days);
      if (data.success) {
        setSchedule(data);
      }
    } catch (err) {
      console.error('Failed to fetch medication schedule:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get adherence color
  const getAdherenceColor = (adherence) => {
    if (adherence >= 90) return 'text-green-600';
    if (adherence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-600">Error loading medication schedule: {error}</p>
        </div>
      </Card>
    );
  }

  if (!schedule || !schedule.medications || schedule.medications.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <Pill className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No medication schedule found</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Pill className="w-6 h-6 mr-2" />
          Medication Schedule
        </h2>
        <span className="text-sm text-gray-600">{schedule.period_days} days</span>
      </div>

      {schedule.medications.map((medication, index) => (
        <Card key={index} className="overflow-hidden">
          {/* Medication header */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{medication.name}</h3>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getAdherenceColor(medication.adherence)}`}>
                  {medication.adherence}%
                </div>
                <div className="text-xs text-gray-600">adherence</div>
              </div>
            </div>
            <p className="text-sm text-gray-700">{medication.dosage}</p>
            <p className="text-xs text-gray-600 mt-1">
              Times: {medication.times.join(', ')}
            </p>
          </div>

          {/* Weekly calendar grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div key={day} className="text-center">
                  {/* Day header */}
                  <div className="text-xs font-semibold text-gray-700 mb-2 pb-1 border-b">
                    {day}
                  </div>
                  
                  {/* Dose indicators */}
                  <div className="space-y-1 mt-2">
                    {medication.schedule[day]?.map((dose, doseIndex) => (
                      <div 
                        key={doseIndex} 
                        className="flex flex-col items-center p-1 rounded transition-colors hover:bg-gray-50"
                      >
                        <div className="text-xs text-gray-600 mb-1">
                          {dose.time}
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          dose.taken 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          {dose.taken ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    )) || (
                      <div className="text-gray-400 text-xs py-2">—</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary stats */}
            <div className="mt-4 pt-4 border-t flex justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium">{medication.completed}</span> of{' '}
                <span className="font-medium">{medication.total}</span> doses taken
              </div>
              <div className={`font-semibold ${getAdherenceColor(medication.adherence)}`}>
                {medication.total - medication.completed} missed
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

MedicationSchedule.propTypes = {
  patientId: PropTypes.string.isRequired
};

export default MedicationSchedule;
