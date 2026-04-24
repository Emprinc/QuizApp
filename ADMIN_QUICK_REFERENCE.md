# Admin Panel Quick Reference

## Access
- **URL**: `/admin` (after login)
- **Requirement**: `is_admin = true` in profiles table

## Dashboard Shortcuts

### Main Sections
| Section | Icon | Purpose |
|---------|------|---------|
| Dashboard | ⚙️ | View key metrics and stats |
| Questions | ❓ | Manage quiz questions |
| Users | 👥 | Manage user accounts |
| Rooms | ⚡ | Manage game rooms |
| Analytics | 📊 | View detailed analytics |

## Common Tasks

### Add a Question
1. Go to Questions
2. Click "New Question"
3. Select Category & Difficulty
4. Enter question text
5. Add 4 options
6. Select correct answer
7. Click "Create Question"

### Grant Admin Access
1. Go to Users
2. Search for the user
3. Click Shield button next to their name
4. Confirm "Admin" badge appears

### Delete a Room
1. Go to Rooms
2. Find the room card
3. Click "Delete" button
4. Confirm deletion

### View Analytics
1. Click Analytics in sidebar
2. See real-time charts and metrics
3. Use charts to identify trends

## Filters & Search

### Question Filters
- **Category**: General, Science, History, Sports, Entertainment, Tech
- **Difficulty**: Easy, Medium, Hard
- **Search**: Full text search on question content

### User Search
- Search by username or email
- Case-insensitive

### Room Sorting
- By status: Playing, Waiting, Finished
- By creation date (newest first)

## Keyboard Shortcuts
- `Tab`: Navigate between fields
- `Enter`: Submit forms
- `Escape`: Close dialogs/cancel

## Status Colors

### Question Difficulty
- 🟢 Easy (Green)
- 🟡 Medium (Yellow)
- 🔴 Hard (Red)

### Room Status
- 🔵 Waiting (Blue)
- 🟢 Playing (Green)
- ⚪ Finished (Gray)

### User Role
- 🛡️ Admin (Shield + Primary color)
- 👤 User (Default)

## Key Metrics

### Dashboard Cards
- **Total Games**: All games ever played
- **Finished Games**: Completed games only
- **Total Users**: Active accounts
- **Total Questions**: Questions in database

### Analytics Metrics
- **Accuracy Rate**: Global percentage of correct answers
- **Avg Games/User**: Average games per active player
- **Avg Score/User**: Average score per player

## Common Issues

| Issue | Solution |
|-------|----------|
| Can't access admin panel | Check `is_admin = true` in database |
| Data not loading | Refresh page, check internet connection |
| Form won't submit | Check all required fields are filled |
| Charts not showing | Try refreshing, check data exists |
| Slow performance | Close other tabs, reduce filters |

## Database Quick Commands

### Make User Admin
```sql
UPDATE public.profiles 
SET is_admin = true 
WHERE username = 'username';
```

### Remove Admin Access
```sql
UPDATE public.profiles 
SET is_admin = false 
WHERE username = 'username';
```

### Count Questions by Category
```sql
SELECT category, COUNT(*) 
FROM public.questions 
GROUP BY category;
```

### List All Admins
```sql
SELECT id, username, email 
FROM public.profiles 
WHERE is_admin = true;
```

## Sidebar Navigation

### Collapsed View
- Shows only icons
- Hover for tooltip
- Click icon to navigate

### Expanded View
- Shows full labels
- Cleaner layout
- Easier for first-time users

### Toggle
- Click menu icon (top of sidebar)
- Or click X to collapse

## Pagination
- 10 items per page
- Previous/Next buttons
- Current page indicator
- Search resets to page 1

## Form Validation

### Required Fields
- **Question text**: Must not be empty
- **Options**: All 4 must be filled
- **Category**: Must select one
- **Difficulty**: Must select one

### Validation Errors
- Red border on field
- Error message above field
- Form won't submit until fixed

## Toast Notifications

### Types
- ✅ Success: Green background
- ❌ Error: Red background
- ℹ️ Info: Blue background

### Auto-dismiss
- Appears for 4 seconds
- Click to dismiss early
- Multiple can stack

## Mobile Tips

### Responsive Design
- Sidebar collapses on mobile
- Tables scroll horizontally
- Touch-friendly buttons
- Full functionality on all sizes

### Best for Small Screens
- Mobile: Portrait orientation recommended
- Tablet: Landscape for tables
- Desktop: Optimal experience

## Performance Tips

1. **Questions**: Use filters to narrow results
2. **Users**: Search instead of scrolling all
3. **Rooms**: Page through results
4. **Analytics**: Give charts time to load

## Support

For help or issues:
1. Check ADMIN_PANEL_GUIDE.md for detailed docs
2. Review ADMIN_IMPLEMENTATION_SUMMARY.md for technical details
3. Check browser console for error messages
4. Verify Supabase project status

## Data Limits

- **Search Results**: Limited to 20 users
- **Pagination**: 10 items per page
- **Charts**: Show top 10 items
- **Questions**: Show most recent first

## Best Practices

1. ✅ Review question quality regularly
2. ✅ Monitor accuracy metrics
3. ✅ Keep user count manageable
4. ✅ Archive old rooms
5. ❌ Don't delete active game rooms
6. ❌ Don't remove all admin users
7. ❌ Don't delete important questions

## Version Info

- **Admin Panel**: v1.0.0
- **Last Updated**: 2026-04-24
- **Dependencies**: Recharts 3.8.1+
- **Compatible**: All modern browsers

## Useful Links

- QuizBattle Main App: `/`
- Admin Panel: `/admin`
- Dashboard: `/admin`
- Questions: `/admin/questions`
- Users: `/admin/users`
- Rooms: `/admin/rooms`
- Analytics: `/admin/analytics`
