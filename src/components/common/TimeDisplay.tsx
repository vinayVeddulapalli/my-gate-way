'use client';

import React, { useState, useEffect } from 'react';
import { formatRelativeTime, formatDateTime, calculateDuration } from '@/lib/utils';

interface TimeProps {
  date: string;
  className?: string;
}

export const TimeAgo: React.FC<TimeProps> = ({ date, className = '' }) => {
  const [formatted, setFormatted] = useState('Recently');

  useEffect(() => {
    setFormatted(formatRelativeTime(date));
    const timer = setInterval(() => {
      setFormatted(formatRelativeTime(date));
    }, 60000);
    return () => clearInterval(timer);
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
};

export const DateTimeDisplay: React.FC<TimeProps> = ({ date, className = '' }) => {
  const [formatted, setFormatted] = useState('—');

  useEffect(() => {
    setFormatted(formatDateTime(date));
  }, [date]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
};

export const DurationDisplay: React.FC<{ start: string; end?: string; className?: string }> = ({
  start,
  end,
  className = ''
}) => {
  const [formatted, setFormatted] = useState('—');

  useEffect(() => {
    setFormatted(calculateDuration(start, end));
    const timer = setInterval(() => {
      setFormatted(calculateDuration(start, end));
    }, 60000);
    return () => clearInterval(timer);
  }, [start, end]);

  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
};
