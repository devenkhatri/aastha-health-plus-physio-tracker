# Performance Improvements — Gym Users

> Reviewed: 2026-04-03

---

## Summary Table

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 1 | Critical | Full data fetch, no per-sheet queries | All Gym pages |
| 2 | Critical | `useEffect` transforms without `useMemo` | `GymMembers.tsx:38` |
| 3 | Critical | O(n²) aggregations re-run every render | `GymReportMonthwise.tsx`, `GymReportExpiringList.tsx` |
| 4 | High | No virtualization for member lists | `GymMemberList.tsx` |
| 5 | High | Search has no debounce | `GymMembers.tsx:33` |
| 6 | High | `window.location.href` causes full reload | `GymMemberList.tsx:44` |
| 7 | High | No `useCallback` on handlers in lists | `GymMemberList.tsx:28` |
| 8 | Medium | Moment.js parsed inside sort loop | `GymMembers.tsx:32` |
| 9 | Medium | `console.log` in production code | `ManageGymMembers.tsx` |
| 10 | Medium | 5s `staleTime` causes refetch storms | `src/utils/index.tsx:100` |

---

## Issues & Solutions

### #1 (Critical) — Full Data Fetch on Every Page Load

**Files:** `GymMembers.tsx:14`, `ViewGymMember.tsx`, `GymReports.tsx`, all Gym pages

**Problem:** All pages call `useDataFromGoogleSheet()` with a single shared query key `"fulldata"`, fetching the entire Google Sheets database on every load. Every component independently triggers this fetch with no sheet-specific caching.

**Solution:** Split queries by sheet so only the needed data is fetched:
```typescript
// Instead of one "fulldata" query shared by all pages:
useQuery("gymMembers", () => fetchSheet("GymMembers"))
useQuery("sessions", () => fetchSheet("Sessions"))
```

---

### #2 (Critical) — Expensive Transforms in `useEffect` Without Memoization

**File:** `GymMembers.tsx:38-52`

**Problem:** `_.filter()`, `_.orderBy()`, and `_.groupBy()` run inside a `useEffect` with `data` as a dependency. Since `data` is a new object reference on every re-fetch, this triggers the effect constantly — causing cascading re-renders.

**Solution:** Replace with `useMemo`:
```typescript
const groupedGymMembers = useMemo(() => {
  const sorted = _.orderBy(gymMembersData[0]?.data, ...)
  const filtered = _.filter(sorted, item => item["Name"].toLowerCase().includes(query))
  return _.groupBy(filtered, item => item["Name"].charAt(0).toUpperCase())
}, [gymMembersData, query, groupByValue])
```

---

### #3 (Critical) — O(n²) Aggregations in Report Components

**Files:** `GymReportMonthwise.tsx:27-42`, `GymReportExpiringList.tsx:10-16`

**Problem:** Multiple chained `_.orderBy()` → `_.groupBy()` → `_.sumBy()` operations run on raw data on every render with no caching. This is O(n²) or worse.

**Solution:** Wrap all aggregations in `useMemo` so they only recompute when source data changes.

---

### #4 (High) — No Virtualization or Pagination for Member Lists

**File:** `GymMemberList.tsx`, `GymMembers.tsx`

**Problem:** All members are rendered into the DOM simultaneously with no virtual scrolling. At 100+ members the list causes frame drops and memory bloat.

**Solution:** Use `IonVirtualScroll` (already in Ionic) or a library like `react-window`:
```tsx
<IonVirtualScroll items={allGymMembers} renderItem={(member) => <GymMemberItem ... />} />
```

---

### #5 (High) — Search Fires on Every Keystroke Without Debouncing

**File:** `GymMembers.tsx:33`

**Problem:** `_.filter()` runs on every single character typed in the search box — no debounce — causing a full array scan per keystroke.

**Solution:** Debounce the search input:
```typescript
const [query, setQuery] = useState("")
const debouncedQuery = useDebounce(query, 300) // only filter after 300ms pause
```

---

### #6 (High) — `window.location.href` Instead of React Router Navigation

**File:** `GymMemberList.tsx:44`

**Problem:**
```typescript
onClick={() => { window.location.href = `/managegymmember/${member["🔒 Row ID"]}` }}
```
This causes a full browser page reload, destroying React Query cache, losing component state, and causing a jarring UX.

**Solution:** Use `useHistory` (React Router):
```typescript
const history = useHistory()
onClick={() => history.push(`/managegymmember/${member["🔒 Row ID"]}`)}
```

---

### #7 (High) — No `useCallback` on Event Handlers in Lists

**File:** `GymMemberList.tsx:28`, `GymReportExpiringList.tsx`

**Problem:** Functions like `sendWhatsappMessage()` are recreated on every render for every list item, causing all child components to re-render unnecessarily.

**Solution:** Wrap with `useCallback` and pass stable references down to list items.

---

### #8 (Medium) — Moment.js Date Parsing Inside Sort Loop

**Files:** `GymMembers.tsx:32`, `GymReportExpiringList.tsx:12-16`

**Problem:**
```typescript
_.orderBy(data[0].data, (item) => moment(item["Ending Date"], "DD-MMM-YYYY"))
```
`moment()` parses a date string on every comparison during sort — expensive for large arrays.

**Solution:** Pre-parse dates once before sorting:
```typescript
const withDates = data.map(item => ({ ...item, _endDate: moment(item["Ending Date"], "DD-MMM-YYYY") }))
const sorted = _.orderBy(withDates, "_endDate")
```

---

### #9 (Medium) — `console.log` Statements in Production

**Files:** `ManageGymMembers.tsx:106, 135, 141`, `Sessions.tsx:26`

**Problem:** Console logging in production leaks member data to the browser console and has minor runtime cost.

**Solution:** Remove all `console.log` calls or gate them:
```typescript
if (process.env.NODE_ENV === "development") console.log(...)
```

---

### #10 (Medium) — Global `staleTime: 5000` Causes Refetch Storms

**File:** `src/utils/index.tsx:100`

**Problem:** All queries go stale after 5 seconds simultaneously, causing every mounted component to re-fetch at the same moment when the user navigates back to a page.

**Solution:** Increase `staleTime` to something appropriate for the data:
```typescript
{ staleTime: 5 * 60 * 1000 } // 5 minutes
```

---

## Recommended Implementation Order

### Immediate (biggest user-facing impact)
1. #6 — Replace `window.location.href` with React Router `useHistory`
2. #2 — Add `useMemo` to GymMembers transforms
3. #5 — Debounce search input

### Short-term
4. #3 — Memoize report aggregations
5. #1 — Split per-sheet React Query hooks
6. #8 — Pre-parse Moment.js dates before sorting
7. #9 — Remove `console.log` statements

### Medium-term
8. #4 — Add virtual scrolling to member lists
9. #7 — Add `useCallback` to list event handlers
10. #10 — Tune `staleTime` per query
