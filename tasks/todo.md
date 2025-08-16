# Data Persistence Auditor - Production Build Testing

## Problem Analysis
- Need to verify IndexedDB data persistence works perfectly in production build across browser sessions
- Must test at http://localhost:4173 (production build - CRITICAL requirement)
- Test dual storage system: IndexedDB (main data) + localStorage (app state)
- Prove users won't lose shopping data when using the deployed app
- Verify data survives complete browser closure and restart

## Architecture Understanding
- **IndexedDB**: Core data storage (stores, lists, items, templates, receipts, settings)
- **localStorage**: App state persistence (current store, basic settings)
- **Service**: localDataService.ts handles all IndexedDB operations
- **Store**: useAppStore.ts manages state with Zustand persistence

## Todo Items

### Phase 1: Production Server Setup & Initial Data Assessment
- [ ] Start production server: `npm run preview` (port 4173)
- [ ] Verify server is running at http://localhost:4173
- [ ] Navigate to production build in browser
- [ ] Open DevTools → Application tab
- [ ] Check existing IndexedDB data from previous testing:
  - [ ] ShoppingGuideDB database exists
  - [ ] Tables: stores, lists, templates, receipts, settings
  - [ ] Document current data state
- [ ] Check localStorage for shopping-app-storage
- [ ] Take screenshot: `initial-data-state.png`

### Phase 2: Add New Test Data Through App Interface
- [ ] Add 2 more items to existing shopping list:
  - [ ] Item 1: "Apples" (category: produce)
  - [ ] Item 2: "Orange Juice" (category: beverages)
- [ ] Create second store if possible:
  - [ ] Store name: "Secondary Test Store"
  - [ ] Store type: "grocery"
- [ ] Create second shopping list:
  - [ ] List name: "Secondary Test List"  
  - [ ] Add 3 items: "Pasta", "Sauce", "Cheese"
- [ ] Test item state changes:
  - [ ] Check off 1 item as complete
  - [ ] Verify progress percentage updates
- [ ] Take screenshot: `new-data-added.png`

### Phase 3: Data Verification Before Browser Restart
- [ ] Verify IndexedDB contains all new data:
  - [ ] Check stores table for both stores
  - [ ] Check lists table for both lists
  - [ ] Check all items are present with correct status
  - [ ] Verify progress calculations are correct
- [ ] Verify localStorage state:
  - [ ] Current store selection
  - [ ] User preferences
- [ ] Document exact data counts:
  - [ ] Number of stores: __
  - [ ] Number of lists: __
  - [ ] Number of items total: __
  - [ ] Number of checked items: __

### Phase 4: Critical Browser Session Test
- [ ] **CRITICAL**: Close browser context completely
  - [ ] Close all browser tabs
  - [ ] Exit browser application entirely
  - [ ] Wait 30 seconds
- [ ] **CRITICAL**: Create NEW browser context
  - [ ] Start fresh browser instance
  - [ ] No previous session recovery
- [ ] Navigate back to http://localhost:4173
- [ ] Allow app to fully load

### Phase 5: Data Persistence Verification
- [ ] Verify ALL stores persist:
  - [ ] Original test store exists
  - [ ] Secondary test store exists
  - [ ] All store properties maintained
- [ ] Verify ALL shopping lists persist:
  - [ ] Original test list exists with all items
  - [ ] Secondary test list exists with all items
  - [ ] Item checked status maintained
  - [ ] Progress percentages correct
- [ ] Verify IndexedDB integrity:
  - [ ] Open DevTools → Application → IndexedDB
  - [ ] Check ShoppingGuideDB still exists
  - [ ] Verify all tables have correct data
  - [ ] No data corruption or loss
- [ ] Verify localStorage restoration:
  - [ ] App state restored correctly
  - [ ] User preferences maintained
- [ ] Take screenshot: `data-after-restart.png`

### Phase 6: Export Functionality Testing
- [ ] Test data export feature (if available):
  - [ ] Look for export/backup functionality
  - [ ] Test JSON export of all data
  - [ ] Verify export contains all created data
  - [ ] Save export file as: `data-export-verification.json`

### Phase 7: Advanced Persistence Testing
- [ ] Test data persistence through multiple operations:
  - [ ] Add one more item to each list
  - [ ] Update an existing item
  - [ ] Delete one item from a list
  - [ ] Complete one entire list
- [ ] Perform second browser restart test:
  - [ ] Close browser completely again
  - [ ] Restart and verify all changes persist
- [ ] Test storage quota information:
  - [ ] Check storage usage in DevTools
  - [ ] Verify app handles storage appropriately

### Phase 8: Edge Case Testing
- [ ] Test with large data set:
  - [ ] Create multiple additional items (10+ items)
  - [ ] Verify performance remains good
  - [ ] Check data still persists after restart
- [ ] Test data migration scenarios:
  - [ ] Verify data survives if app is updated
  - [ ] Check version compatibility handling

### Phase 9: Documentation and Evidence Creation
- [ ] Create comprehensive evidence file: `production-persistence-verified.md`
- [ ] Include all screenshots with descriptions
- [ ] Document data persistence test results:
  - [ ] Before/after data comparisons
  - [ ] Storage mechanism verification
  - [ ] Performance observations
  - [ ] Any issues encountered
- [ ] Verify success criteria met:
  - [ ] All stores persist across browser sessions
  - [ ] All shopping lists persist with complete state
  - [ ] Item check status maintained
  - [ ] No data loss during browser restart
  - [ ] IndexedDB accessible and functional

### Phase 10: Security & Privacy Review
- [ ] Verify no sensitive data exposed in browser storage
- [ ] Check that data is stored locally only
- [ ] Confirm no data transmission to external servers
- [ ] Verify appropriate data isolation between users

## Technical Notes
- **Database**: ShoppingGuideDB with 5 object stores
- **Storage Estimate**: Navigator.storage.estimate() for quota monitoring
- **Dual Persistence**: IndexedDB + localStorage working together
- **Version**: Database version 1 with proper schema migration
- **Performance**: Large dataset handling and responsive UI

## Test URL
```
http://localhost:4173 (Production Preview Server)
```

## Success Criteria
✅ **CRITICAL REQUIREMENTS**:
1. All stores persist across browser sessions
2. All shopping lists persist with complete state  
3. Item check status maintained exactly
4. Progress percentages calculated correctly
5. No data loss during browser restart
6. IndexedDB remains accessible and functional
7. localStorage state properly restored
8. Export functionality works (if available)

## Review Section

### Data Persistence Verification Results

*Will be completed during testing process*

**Status**: 🔄 **TESTING IN PROGRESS**

Data persistence testing will verify that users won't lose their shopping data when using the deployed app across browser sessions.