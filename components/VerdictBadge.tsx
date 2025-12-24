
import React from 'react';
import { Verdict } from '../types';

interface VerdictBadgeProps {
  verdict: Verdict;
}

const VerdictBadge: React.FC<VerdictBadgeProps> = ({ verdict }) => {
  const getColors = () => {
    switch (verdict) {
      case 'True': return 'bg-green-100 text-green-800 border-green-200';
      case 'Mostly True': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Mixed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Misleading': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'False': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getColors()}`}>
      {verdict}
    </span>
  );
};

export default VerdictBadge;
