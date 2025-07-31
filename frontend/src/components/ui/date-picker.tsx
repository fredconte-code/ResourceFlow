import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateForCalendar } from "@/lib/date-utils";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showClearButton?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  showClearButton = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | undefined>(date);

  const handleConfirm = () => {
    onDateChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(date);
    setIsOpen(false);
  };

  const handleClear = () => {
    onDateChange(undefined);
    setTempDate(undefined);
    setIsOpen(false);
  };

  // Update temp date when prop changes
  React.useEffect(() => {
    setTempDate(date);
  }, [date]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-full justify-start text-left font-normal", className)}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? formatDateForCalendar(date) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={tempDate}
            onSelect={setTempDate}
            initialFocus
          />
          <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
            {showClearButton && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClear}
                className="text-red-600 hover:text-red-700"
              >
                Clear
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleConfirm}>
              OK
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}; 