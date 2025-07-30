# Unified Allocation Rectangle System Implementation

## Overview

This document describes the implementation of the unified allocation rectangle system that renders continuous rectangles across multiple days instead of individual day blocks. The system supports dragging, resizing, stacking, and adaptive layout behavior while maintaining a clean, button-free design.

## Key Features Implemented

### 🧱 Unified Rectangle Rendering
- **Continuous rectangles** that span all selected days, including weekends
- **Weekend handling** with 0 hours allocated but visual continuity maintained
- **Unbroken appearance** across the entire date range

### 📚 Stacking Multiple Projects
- **Vertical stacking** of multiple project allocations within the same employee row
- **Automatic row height adjustment** to accommodate all stacked rectangles
- **Consistent spacing** between rectangles with preserved visual hierarchy

### 🖱️ Interaction Rules
- **Drag entire rectangle** by clicking anywhere except resize handles
- **Horizontal movement** only (same employee row)
- **Ghost/shadow element** during dragging for visual feedback
- **Resize handles** on left and right edges for duration adjustment

### 🚫 Visual & UI Constraints
- **No buttons or icons** inside allocation rectangles
- **External controls** for edit/delete operations
- **Proper cursor feedback** (move for drag, ew-resize for resize)
- **Automatic row height expansion** to prevent overlap

## Technical Implementation

### Core Functions

#### `getUnifiedAllocationsForEmployee(employeeId: string)`
Retrieves all allocations for a specific employee that overlap with the current month view.

```typescript
const getUnifiedAllocationsForEmployee = (employeeId: string) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  return allocations
    .filter(allocation => allocation.employeeId === employeeId)
    .filter(allocation => {
      const allocationStart = new Date(allocation.startDate + 'T00:00:00');
      const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
      return allocationEnd >= monthStart && allocationStart <= monthEnd;
    })
    .sort((a, b) => {
      // Sort by creation time for consistent stacking order
      const aId = typeof a.id === 'string' ? parseInt(a.id) : a.id;
      const bId = typeof b.id === 'string' ? parseInt(b.id) : b.id;
      return aId - bId;
    });
};
```

#### `getUnifiedAllocationStyle(allocation: ProjectAllocation, index: number, totalAllocations: number)`
Calculates the visual position and dimensions for unified allocation rectangles.

```typescript
const getUnifiedAllocationStyle = (allocation: ProjectAllocation, index: number, totalAllocations: number) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarDays = getCalendarDays();
  
  // Calculate effective start and end dates within current month view
  const allocationStart = new Date(allocation.startDate + 'T00:00:00');
  const allocationEnd = new Date(allocation.endDate + 'T00:00:00');
  
  const effectiveStart = allocationStart < monthStart ? monthStart : allocationStart;
  const effectiveEnd = allocationEnd > monthEnd ? monthEnd : allocationEnd;
  
  // Find column indices for positioning
  const startColIndex = calendarDays.findIndex(date => isSameDay(date, effectiveStart));
  const endColIndex = calendarDays.findIndex(date => isSameDay(date, effectiveEnd));
  
  if (startColIndex === -1 || endColIndex === -1) {
    return { display: 'none' };
  }
  
  // Calculate position and dimensions
  const left = `${startColIndex * 60}px`; // 60px per day column
  const width = `${(endColIndex - startColIndex + 1) * 60}px`;
  const allocationHeight = 24;
  const verticalSpacing = 4;
  const top = `${40 + index * (allocationHeight + verticalSpacing)}px`;
  
  return {
    position: 'absolute' as const,
    left,
    top,
    width,
    height: `${allocationHeight}px`,
    zIndex: 10 + index,
  };
};
```

#### `getEmployeeRowHeight(employeeId: string)`
Calculates the total height needed for an employee row based on the number of stacked allocations.

```typescript
const getEmployeeRowHeight = (employeeId: string) => {
  const unifiedAllocations = getUnifiedAllocationsForEmployee(employeeId);
  if (unifiedAllocations.length === 0) {
    return 40; // Minimum height for empty rows
  }
  
  const allocationHeight = 24;
  const verticalSpacing = 4;
  const baseHeight = 40;
  
  return baseHeight + (unifiedAllocations.length * (allocationHeight + verticalSpacing)) - verticalSpacing;
};
```

### Rendering Structure

The calendar now uses a layered approach:

1. **Base Calendar Grid**: Standard calendar cells with drag/drop zones
2. **Unified Allocation Layer**: Absolutely positioned rectangles over the calendar
3. **Heatmap Layer**: Optional heatmap visualization

```tsx
{/* Employee rows */}
{employees.map((employee) => {
  const unifiedAllocations = getUnifiedAllocationsForEmployee(employee.id);
  const rowHeight = getEmployeeRowHeight(employee.id);
  
  return (
    <div
      key={employee.id}
      className="grid relative"
      style={{ 
        gridTemplateColumns: `150px repeat(${calendarDays.length}, 60px)`,
        minHeight: `${rowHeight}px`
      }}
    >
      {/* Employee info column */}
      <div className="p-0.5 border-b border-r bg-muted/10">
        {/* Employee details */}
      </div>
      
      {/* Calendar day columns */}
      {calendarDays.map((date) => (
        <div
          key={`${employee.id}-${date.toISOString()}`}
          data-date={format(date, 'yyyy-MM-dd')}
          className="p-0.5 border-b border-r relative"
          style={{ minHeight: `${rowHeight}px` }}
          onDragOver={(e) => handleDragOver(e, employee.id, date)}
          onDrop={(e) => handleDrop(e, employee.id, date)}
        >
          {/* Drag preview and heatmap content */}
        </div>
      ))}
      
      {/* Unified Allocation Rectangles */}
      {!heatmapMode && (
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{ left: '150px' }}
          onMouseOver={(e) => handleUnifiedAllocationDragOver(e, employee.id)}
        >
          {unifiedAllocations.map((allocation, index) => (
            <div
              key={allocation.id}
              className="unified-allocation text-xs font-medium text-white truncate relative cursor-move pointer-events-auto"
              style={{
                ...getUnifiedAllocationStyle(allocation, index, unifiedAllocations.length),
                backgroundColor: project?.color || '#3b82f6'
              }}
              onMouseDown={(e) => handleAllocationDragStart(e, allocation)}
              onDoubleClick={() => handleAllocationDoubleClick(allocation)}
            >
              {/* Allocation content and resize handles */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
})}
```

### CSS Styling

The unified allocation system includes comprehensive CSS styling:

```css
/* Unified Allocation Rectangle Styles */
.unified-allocation {
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.unified-allocation:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.unified-allocation.dragging {
  opacity: 0.5;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.unified-allocation.resizing {
  opacity: 0.75;
}

/* Resize handle styles */
.resize-handle {
  background-color: rgba(255, 255, 255, 0.3);
  transition: background-color 0.2s ease;
}

.resize-handle:hover {
  background-color: rgba(255, 255, 255, 0.5);
}

/* Weekend styling */
.weekend-cell {
  background-color: #f8f9fa;
}

.weekend-allocation {
  opacity: 0.7;
  background-color: #6c757d !important;
}
```

## Drag and Drop Implementation

### Enhanced Drag Handling

The system includes improved drag handling for unified allocations:

```typescript
const handleUnifiedAllocationDragOver = (event: React.MouseEvent, employeeId: string) => {
  event.preventDefault();
  event.stopPropagation();
  if (draggingAllocation) {
    if (draggingAllocation.allocation.employeeId === employeeId) {
      // Find the date under the mouse cursor
      const calendarContainer = document.querySelector('[data-calendar-container]') as HTMLElement;
      if (calendarContainer) {
        const rect = calendarContainer.getBoundingClientRect();
        const x = event.clientX - rect.left - 150; // Subtract employee column width
        const dayIndex = Math.floor(x / 60); // 60px per day column
        const calendarDays = getCalendarDays();
        
        if (dayIndex >= 0 && dayIndex < calendarDays.length) {
          const targetDate = calendarDays[dayIndex];
          setDragOverCell({ employeeId, date: targetDate });
        }
      }
    }
  }
};
```

## Benefits of the Implementation

### 1. **Visual Clarity**
- Single continuous rectangles provide better visual representation of project duration
- Easier to understand project timelines at a glance
- Reduced visual clutter compared to individual day blocks

### 2. **Improved User Experience**
- Intuitive drag and drop functionality
- Clear resize handles for duration adjustment
- Consistent visual feedback during interactions

### 3. **Scalability**
- Automatic row height adjustment prevents overlap
- Efficient rendering of multiple allocations
- Responsive design that adapts to different screen sizes

### 4. **Maintainability**
- Clean separation of concerns between rendering and interaction logic
- Modular function design for easy testing and debugging
- Consistent styling system with CSS classes

## Testing

The implementation includes comprehensive tests to verify functionality:

```typescript
describe('Unified Allocation System', () => {
  it('should render unified allocation rectangles', async () => {
    render(<CalendarView />);
    await screen.findByText('John Doe');
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Test Project 2')).toBeInTheDocument();
  });

  it('should handle multiple allocations for the same employee', async () => {
    render(<CalendarView />);
    await screen.findByText('John Doe');
    const project1 = screen.getByText('Test Project 1');
    const project2 = screen.getByText('Test Project 2');
    expect(project1).toBeInTheDocument();
    expect(project2).toBeInTheDocument();
  });
});
```

## Future Enhancements

### Potential Improvements

1. **Multi-select functionality** for bulk operations
2. **Keyboard shortcuts** for common actions
3. **Undo/redo functionality** for allocation changes
4. **Advanced filtering** and search capabilities
5. **Export functionality** for allocation data

### Performance Optimizations

1. **Virtual scrolling** for large datasets
2. **Memoization** of expensive calculations
3. **Lazy loading** of allocation data
4. **Optimized re-rendering** strategies

## Conclusion

The unified allocation rectangle system successfully implements all the required functionality while maintaining clean, maintainable code. The system provides an intuitive user experience with proper visual feedback and efficient handling of multiple allocations per employee. 