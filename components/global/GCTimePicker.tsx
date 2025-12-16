import { ChangeEventHandler } from "react";

interface TimePickerProps {
  label: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLSelectElement>;
}

export default function GCTimePicker({ label, value, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '', minute: '', period: '' };
    
    // Try to parse as complete time string first
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (match) {
      return { hour: match[1], minute: match[2], period: match[3].toUpperCase() };
    }
    
    // Try to parse as partial JSON state
    try {
      const parsed = JSON.parse(timeStr);
      if (parsed && typeof parsed === 'object') {
        return { 
          hour: parsed.hour || '', 
          minute: parsed.minute || '', 
          period: parsed.period || '' 
        };
      }
    } catch (e) {
      // Not JSON, continue
    }
    
    return { hour: '', minute: '', period: '' };
  };

  const { hour, minute, period } = parseTime(value || '');

  const handleChange = (type: 'hour' | 'minute' | 'period', newValue: string) => {
    const currentTime = parseTime(value || '');
    const updatedTime = { ...currentTime, [type]: newValue };
    
    // Create time string - use partial values or complete time
    let timeString = '';
    if (updatedTime.hour && updatedTime.minute && updatedTime.period) {
      timeString = `${updatedTime.hour}:${updatedTime.minute} ${updatedTime.period}`;
    } else if (updatedTime.hour || updatedTime.minute || updatedTime.period) {
      // Store partial state as JSON for internal tracking
      timeString = JSON.stringify(updatedTime);
    }
    
    const event = { target: { value: timeString } } as any;
    onChange?.(event);
  };

  return (
    <div className="flex flex-col gap-0.5 w-full">
      <label className="text-slate-500 pl-3 capitalize">{`${label}:`}</label>
      <div className="flex gap-1">
        <select
          value={hour}
          onChange={(e) => handleChange('hour', e.target.value)}
          className="bg-zinc-100 rounded-sm border border-b-slate-400 focus:border-b-sky-500 px-2 py-2 focus:outline-none text-slate-700 flex-1"
        >
          <option value="">Hr</option>
          {hours.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <select
          value={minute}
          onChange={(e) => handleChange('minute', e.target.value)}
          className="bg-zinc-100 rounded-sm border border-b-slate-400 focus:border-b-sky-500 px-2 py-2 focus:outline-none text-slate-700 flex-1"
        >
          <option value="">Min</option>
          {minutes.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => handleChange('period', e.target.value)}
          className="bg-zinc-100 rounded-sm border border-b-slate-400 focus:border-b-sky-500 px-2 py-2 focus:outline-none text-slate-700"
        >
          <option value="">AM/PM</option>
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}