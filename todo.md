# TODO

## Feature Development

### 1. Rule Status Management ✅
- [x] Enable/disable rule toggle
- [x] Status change action buttons
- [x] Status change with Switch component
- [x] Auto-refresh after status change

### 2. Enhanced Rule Editing ✅
- [x] Support complex rule condition configuration
  - [x] **Filter Categories** (extensible architecture)
    - [x] Rider: rider ID, level, rating, active orders, completion rate, work hours
    - [x] Merchant: merchant ID, type, rating, delivery range, VIP status
    - [x] Order: order ID, amount, distance, weight, item count, product type, urgency, time window, customer level
    - [x] Time: hour of day, day of week, holiday, peak hour, time range
    - [x] Geo: district, business zone, special location, weather
  - [x] **Extensible Design**: Dynamic filter field registration system
  - [x] Condition operators: eq, ne, gt, gte, lt, lte, between, in, contains, etc.
- [x] Nested condition groups (AND/OR)
- [x] Visual condition builder with grouping
- [x] Quick edit and advanced edit modes

### 3. Rule Copy Function ✅
- [x] Rule copy button
- [x] Auto-append "Copy" suffix when duplicating
- [x] Clone all versions and conditions
- [x] Auto-redirect to edit page after copy

### 4. Rule Export Function ✅
- [x] Single rule export JSON
- [x] Batch rule export
- [x] Export to CSV format
- [x] File download with timestamp

## Future Enhancements

### Potential Improvements
- [ ] Drag-and-drop to reorder conditions
- [ ] Real-time rule effect preview
- [ ] Condition templates save/load
- [ ] Export to Excel format
- [ ] Import rules from file
- [ ] Rule version comparison
- [ ] Visual rule flow diagram
