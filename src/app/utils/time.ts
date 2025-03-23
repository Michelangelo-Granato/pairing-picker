// Convert 12h time to 24h time
export const convertTo24Hour = (time: string, format: '12h' | '24h'): string => {
  if (format === '24h' || !time) return time;
  
  const [timeStr, modifier] = time.split(' ');
  const [hoursStr, minutes] = timeStr.split(':');
  let hours = hoursStr;
  
  if (hours === '12') {
    hours = modifier === 'PM' ? '12' : '00';
  } else {
    hours = modifier === 'PM' ? String(parseInt(hours, 10) + 12) : hours.padStart(2, '0');
  }
  
  return `${hours}:${minutes}`;
};

// Convert 24h time to 12h time
export const convertTo12Hour = (time: string): string => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  
  if (hour === 0) {
    return `12:${minutes} AM`;
  } else if (hour < 12) {
    return `${hour}:${minutes} AM`;
  } else if (hour === 12) {
    return `12:${minutes} PM`;
  } else {
    return `${hour - 12}:${minutes} PM`;
  }
};

// Format time based on selected format
export const formatTimeForDisplay = (time: string, format: '12h' | '24h'): string => {
  if (!time) return '';
  return format === '24h' ? time : convertTo12Hour(time);
}; 