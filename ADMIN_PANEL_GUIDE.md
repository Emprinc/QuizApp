# QuizBattle Admin Panel Guide

## Overview

The admin panel is a comprehensive management interface for QuizBattle administrators. It provides tools to manage questions, users, rooms, and view detailed analytics about the platform.

## Accessing the Admin Panel

1. Login with your administrator account
2. Navigate to `/admin` or use the admin link (if available)
3. Only users with `is_admin = true` in the profiles table can access the panel

## Features

### 1. Dashboard
The main overview page showing key metrics:
- **Total Games**: Number of games played on the platform
- **Finished Games**: Completed games count
- **Total Users**: Registered user accounts
- **Game Activity**: Break down of playing, waiting, and finished games
- **Answer Accuracy**: Global accuracy rate and statistics
- **User Statistics**: Average games per user and average scores

### 2. Question Manager
Complete CRUD operations for quiz questions:

#### Creating Questions
1. Click "New Question" button
2. Select category and difficulty level
3. Enter the question text
4. Add 4 multiple choice options
5. Select the correct answer (radio button)
6. Optionally add an explanation
7. Click "Create Question"

#### Editing Questions
1. Find the question in the list
2. Click the Edit (pencil) icon
3. Modify the fields
4. Click "Update Question"

#### Deleting Questions
1. Find the question in the list
2. Click the Delete (trash) icon
3. Confirm the deletion

#### Filtering Questions
- **Search**: Find questions by text content
- **Category**: Filter by category (general, science, history, sports, entertainment, tech)
- **Difficulty**: Filter by difficulty level (easy, medium, hard)

#### Categories Available
- General
- Science
- History
- Sports
- Entertainment
- Tech

### 3. User Manager
Manage user accounts and permissions:

#### Viewing Users
- See all registered users with stats
- View username, email, games played, and total score
- Search users by username or email

#### User Actions
- **Toggle Admin**: Click the Shield button to grant/revoke admin privileges
- Users with admin privileges can access the admin panel

#### User Statistics
- Games played by each user
- Total score accumulated
- Email address on file

### 4. Room Manager
Manage active and inactive game rooms:

#### Room Information
Each room card shows:
- **Room Code**: 6-character unique identifier
- **Category**: The quiz category being played
- **Status**: Playing, Waiting, or Finished
- **Players**: Number of players in the room
- **Time per Question**: Time allocated per question
- **Host**: Username of the room creator

#### Room Actions
- **Close Room**: End a room early (sets status to finished)
- **Delete Room**: Permanently remove a room from the database

#### Room Statistics
- Break down by status (active, waiting, finished)
- Player counts
- Room creation information

### 5. Analytics
Detailed analytics and insights about the platform:

#### Key Metrics
- **Accuracy Rate**: Global percentage of correct answers
- **Total Games**: All games played
- **Active Users**: Total registered players

#### Charts and Visualizations
1. **Questions by Category**: Bar chart showing distribution of questions
2. **Questions by Difficulty**: Pie chart showing easy/medium/hard distribution
3. **Game Status**: Pie chart showing playing/waiting/finished breakdown
4. **User Engagement**: Statistics on average games per user and scores

#### Top Performing Questions
Table of questions with highest accuracy rates and answer counts

## Database Requirements

### Required Changes
The admin system requires the following database additions:

1. **is_admin Column**: Added to profiles table
   ```sql
   ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   ```

2. **RLS Policies**: Admin-specific Row Level Security policies
   - Admins can create/update/delete questions
   - Admins can view all profiles
   - Admins can update any profile
   - Admins can delete/update rooms

3. **Indexes**: Performance indexes for admin operations
   - idx_profiles_admin: For faster admin lookups
   - idx_questions_created_at: For question ordering

See `scripts/add-admin-column.sql` for the complete migration.

## Security Considerations

### Role-Based Access Control (RBAC)
- Admin access is controlled via the `is_admin` field in profiles table
- Only admins can access `/admin` routes
- ProtectedAdminRoute component enforces this check

### Row Level Security (RLS)
- All admin operations are protected by Supabase RLS policies
- Policies ensure only admins can perform restricted operations
- Client-side checks are backed by server-side validation

### Audit Trail
- All admin actions modify data in real-time
- Changes are reflected immediately in the UI
- Supabase maintains automatic timestamps on data modifications

## Best Practices

### Question Management
1. Regularly review questions for accuracy and clarity
2. Maintain balanced difficulty distribution
3. Ensure all options are plausible distractors
4. Add explanations for educational value
5. Group related questions by category

### User Management
1. Carefully grant admin privileges
2. Monitor user statistics for suspicious patterns
3. Keep admin accounts secure
4. Regularly review active users

### Room Management
1. Monitor active games for smooth operation
2. Close problematic rooms to prevent issues
3. Archive finished games data periodically
4. Keep room count manageable for performance

### Analytics Review
1. Check accuracy trends regularly
2. Identify difficult questions
3. Monitor user engagement metrics
4. Use insights to improve question quality

## Components Structure

```
src/components/admin/
├── AdminLayout.jsx          # Main layout with sidebar
├── AdminDashboard.jsx       # Dashboard overview
├── QuestionManager.jsx      # Question CRUD
├── UserManager.jsx          # User management
├── RoomManager.jsx          # Room management
└── Analytics.jsx            # Analytics and charts

src/pages/
└── Admin.jsx                # Admin page wrapper

src/hooks/
└── useAdminCheck.js         # Admin verification hook

src/lib/
└── adminUtils.js            # Admin utility functions
```

## Utility Functions

The `adminUtils.js` file provides:

### Question Utils
- `createQuestion()`: Create new question
- `updateQuestion()`: Modify existing question
- `deleteQuestion()`: Remove question
- `getAllQuestions()`: Fetch questions with filters
- `bulkImportQuestions()`: Import multiple questions

### User Utils
- `searchUsers()`: Find users by name/email
- `getAllUsers()`: Fetch paginated user list
- `getUserStats()`: Get detailed user statistics
- `updateUserAdmin()`: Toggle admin status
- `banUser()` / `unbanUser()`: User banning

### Room Utils
- `getAllRooms()`: Fetch room list
- `deleteRoom()`: Remove room
- `closeRoom()`: End room session

### Analytics Utils
- `getGameStats()`: Game metrics
- `getCategoryStats()`: Question distribution
- `getDifficultyStats()`: Difficulty breakdown
- `getTopQuestions()`: Best performing questions
- `getUserStats()`: User engagement metrics

## Troubleshooting

### Admin Access Denied
1. Check that user's `is_admin` field is `true` in profiles table
2. Verify user is logged in
3. Try refreshing the page
4. Check browser console for errors

### Data Not Loading
1. Check network tab for failed requests
2. Verify Supabase credentials are configured
3. Check Supabase project status
4. Review RLS policies for admin user

### Charts Not Rendering
1. Verify Recharts library is installed
2. Check browser console for JavaScript errors
3. Ensure analytics data query is successful
4. Try refreshing the page

## Future Enhancements

Potential improvements for the admin panel:
- Activity logging and audit trails
- Bulk question import/export (CSV)
- Advanced user analytics and retention metrics
- Question performance analysis by time period
- Automated backup and recovery tools
- Admin notifications and alerts
- Role-based sub-admins with specific permissions
- Question revision history

## Support

For issues with the admin panel:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Check Supabase logs for database errors
4. Verify admin user permissions in database
