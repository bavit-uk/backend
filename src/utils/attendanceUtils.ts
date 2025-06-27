export const calculateWorkingHours = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return (endTotal - startTotal) / 60; // Return in hours
  };
  
  export const isWithinWorkingHours = (time: Date, shift: any): boolean => {
    const checkTime = time.getHours() * 60 + time.getMinutes();
    
    const [startHours, startMinutes] = shift.startTime.split(':').map(Number);
    const [endHours, endMinutes] = shift.endTime.split(':').map(Number);
    
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    
    return checkTime >= startTotal && checkTime <= endTotal;
  };