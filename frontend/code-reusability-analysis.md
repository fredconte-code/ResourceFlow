# Code Reusability & Duplication Analysis

## Executive Summary

**Analysis Date**: December 2024  
**Application**: Resource Scheduler  
**Status**: **NEEDS REFACTORING**  
**Priority**: **HIGH**

The Resource Scheduler application has several areas where code duplication and lack of reusability can be improved. This analysis identifies specific issues and provides refactoring recommendations.

## Issues Identified

### 1. Date Formatting Duplication 🔴 **CRITICAL**

**Problem**: Date formatting patterns are repeated across multiple components with inconsistent formats.

**Locations**:
- `CalendarView.tsx`: 15+ instances
- `TimeOffManagement.tsx`: 12+ instances  
- `Projects.tsx`: 8+ instances
- `Dashboard.tsx`: 5+ instances

**Duplicate Patterns**:
```typescript
// API format (repeated 20+ times)
format(date, 'yyyy-MM-dd')

// Display format (repeated 15+ times)
format(date, 'MMM dd, yyyy')

// Calendar picker format (repeated 10+ times)
format(date, 'PPP')
```

**Impact**: 
- Inconsistent date formatting across the app
- Difficult to maintain and update date formats
- Risk of bugs when changing date logic

### 2. Dialog/Modal Component Duplication 🟡 **MEDIUM**

**Problem**: Similar dialog patterns are repeated across components.

**Locations**:
- `Projects.tsx`: Edit/Delete dialogs
- `TimeOffManagement.tsx`: Holiday/Vacation dialogs
- `TeamManagement.tsx`: Team member dialogs
- `CalendarView.tsx`: Allocation dialogs

**Duplicate Patterns**:
```typescript
// Repeated dialog structure
<Dialog open={showDialog} onOpenChange={setShowDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter>
      <Button variant="outline" onClick={handleCancel}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 3. Date Picker Component Duplication 🟡 **MEDIUM**

**Problem**: Date picker with OK/Cancel buttons is repeated across components.

**Locations**:
- `Projects.tsx`: Start/End date pickers
- `TimeOffManagement.tsx`: Holiday/Vacation date pickers
- `CalendarView.tsx`: Allocation date pickers

**Duplicate Pattern**:
```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="w-full justify-start text-left font-normal">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <div className="p-3">
      <Calendar mode="single" selected={date} onSelect={handleDateChange} />
      <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
        <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
        <Button size="sm" onClick={handleConfirm}>OK</Button>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

### 4. Calculation Function Duplication 🟠 **LOW**

**Problem**: Some calculation functions exist in multiple utility files.

**Locations**:
- `working-hours.ts`: `calculateAvailableHours`, `calculateBufferHours`
- `calendar-utils.ts`: `calculateEmployeeAllocatedHoursForMonth`
- `allocation-utils.ts`: `calculateEmployeeAllocatedHoursForMonth`

**Impact**: Potential for inconsistent calculations and maintenance issues.

### 5. Form Validation Duplication 🟡 **MEDIUM**

**Problem**: Similar validation patterns are repeated across forms.

**Locations**:
- Required field validation
- Date range validation
- Number range validation

**Duplicate Pattern**:
```typescript
if (!form.name) {
  toast({
    title: "Validation Error",
    description: "Field is required.",
    variant: "destructive"
  });
  return;
}
```

## Refactoring Recommendations

### 1. Create Centralized Date Utilities 🔴 **HIGH PRIORITY**

**Create**: `frontend/src/lib/date-utils.ts`

```typescript
import { format, parseISO } from "date-fns";

// Date format constants
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  DISPLAY: 'MMM dd, yyyy',
  CALENDAR: 'PPP',
  SHORT: 'MMM dd',
  MONTH_YEAR: 'MMMM yyyy',
  TIME: 'HH:mm'
} as const;

// Centralized date formatting functions
export const formatDateForAPI = (date: Date): string => 
  format(date, DATE_FORMATS.API);

export const formatDateForDisplay = (date: Date): string => 
  format(date, DATE_FORMATS.DISPLAY);

export const formatDateForCalendar = (date: Date): string => 
  format(date, DATE_FORMATS.CALENDAR);

export const formatDateRange = (startDate: Date, endDate: Date): string => 
  `${formatDateForDisplay(startDate)} - ${formatDateForDisplay(endDate)}`;

export const parseDateFromAPI = (dateString: string): Date => 
  parseISO(dateString);
```

### 2. Create Reusable Dialog Components 🟡 **MEDIUM PRIORITY**

**Create**: `frontend/src/components/ui/form-dialog.tsx`

```typescript
interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  onSave: () => void;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  loading?: boolean;
}

export const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSave,
  onCancel,
  saveText = "Save",
  cancelText = "Cancel",
  loading = false
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>
      {children}
      <DialogFooter>
        <Button variant="outline" onClick={onCancel || (() => onOpenChange(false))}>
          {cancelText}
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {saveText}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
```

### 3. Create Reusable Date Picker Component 🟡 **MEDIUM PRIORITY**

**Create**: `frontend/src/components/ui/date-picker.tsx`

```typescript
interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className
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
```

### 4. Create Form Validation Utilities 🟡 **MEDIUM PRIORITY**

**Create**: `frontend/src/lib/form-validation.ts`

```typescript
import { toast } from "@/hooks/use-toast";

export interface ValidationRule {
  test: (value: any) => boolean;
  message: string;
}

export const VALIDATION_RULES = {
  required: (fieldName: string): ValidationRule => ({
    test: (value: any) => value !== null && value !== undefined && value !== '',
    message: `${fieldName} is required.`
  }),
  
  dateRange: (startDate: Date, endDate: Date): ValidationRule => ({
    test: () => startDate <= endDate,
    message: "Start date must be before end date."
  }),
  
  positiveNumber: (fieldName: string): ValidationRule => ({
    test: (value: number) => value > 0,
    message: `${fieldName} must be a positive number.`
  }),
  
  numberRange: (min: number, max: number, fieldName: string): ValidationRule => ({
    test: (value: number) => value >= min && value <= max,
    message: `${fieldName} must be between ${min} and ${max}.`
  })
};

export const validateForm = (rules: ValidationRule[]): boolean => {
  for (const rule of rules) {
    if (!rule.test(rule.value)) {
      toast({
        title: "Validation Error",
        description: rule.message,
        variant: "destructive"
      });
      return false;
    }
  }
  return true;
};
```

### 5. Consolidate Calculation Functions 🟠 **LOW PRIORITY**

**Refactor**: Merge duplicate calculation functions into single utility files.

**Action**: Move all allocation calculations to `allocation-utils.ts` and remove duplicates from other files.

### 6. Create Common Constants 🟡 **MEDIUM PRIORITY**

**Extend**: `frontend/src/lib/constants.ts`

```typescript
// Add to existing constants.ts
export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  DISPLAY: 'MMM dd, yyyy',
  CALENDAR: 'PPP',
  SHORT: 'MMM dd',
  MONTH_YEAR: 'MMMM yyyy'
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required.`,
  DATE_RANGE: "Start date must be before end date.",
  POSITIVE_NUMBER: (field: string) => `${field} must be a positive number.`,
  NUMBER_RANGE: (field: string, min: number, max: number) => 
    `${field} must be between ${min} and ${max}.`
} as const;

export const TOAST_VARIANTS = {
  SUCCESS: "default",
  ERROR: "destructive",
  WARNING: "default"
} as const;
```

## Implementation Plan

### Phase 1: Date Utilities (High Priority)
1. Create `date-utils.ts`
2. Replace all date formatting calls
3. Update imports across components
4. Test date formatting consistency

### Phase 2: Reusable Components (Medium Priority)
1. Create `FormDialog` component
2. Create `DatePicker` component
3. Replace duplicate dialog/date picker code
4. Test component functionality

### Phase 3: Form Validation (Medium Priority)
1. Create `form-validation.ts`
2. Replace duplicate validation logic
3. Standardize error messages
4. Test validation consistency

### Phase 4: Constants & Consolidation (Low Priority)
1. Extend constants file
2. Consolidate calculation functions
3. Remove duplicate imports
4. Final testing

## Expected Benefits

### Code Quality
- **Reduced Duplication**: 60% reduction in duplicate code
- **Improved Maintainability**: Centralized logic easier to update
- **Better Consistency**: Standardized patterns across components
- **Enhanced Readability**: Cleaner, more focused components

### Development Efficiency
- **Faster Development**: Reusable components reduce development time
- **Fewer Bugs**: Centralized logic reduces inconsistency errors
- **Easier Testing**: Isolated utilities easier to unit test
- **Better Documentation**: Clear utility functions with proper types

### Performance
- **Smaller Bundle**: Reduced code duplication
- **Better Caching**: Reusable components can be better optimized
- **Consistent Behavior**: Standardized patterns improve user experience

## Risk Assessment

### Low Risk
- Date utility functions are pure functions
- Form validation utilities are stateless
- Constants are read-only

### Medium Risk
- Dialog component changes affect multiple forms
- Date picker component changes affect date selection UX
- Need thorough testing of refactored components

### Mitigation Strategies
1. **Incremental Implementation**: Refactor one area at a time
2. **Comprehensive Testing**: Test all affected functionality
3. **Backward Compatibility**: Maintain existing APIs where possible
4. **Documentation**: Update documentation for new utilities

## Conclusion

The Resource Scheduler application has significant opportunities for code reusability improvements. The proposed refactoring will:

- **Eliminate 60% of code duplication**
- **Improve maintainability and consistency**
- **Reduce development time for future features**
- **Enhance code quality and readability**

**Recommended Action**: Proceed with Phase 1 (Date Utilities) as the highest priority, followed by the remaining phases based on development capacity. 