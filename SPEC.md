# QuizBattle - Multiplayer Real-Time Quiz Game

## 1. Concept & Vision

QuizBattle is an electrifying real-time multiplayer quiz competition platform where players can challenge friends, climb leaderboards, and prove their knowledge in fast-paced battles. The experience feels like a game show mixed with an esports arena - intense, competitive, and visually exciting with dramatic countdowns, animated score reveals, and celebratory victory moments.

The app targets casual gamers aged 16-45 who enjoy trivia and competitive social experiences. Key differentiator: real-time synchronous gameplay where all players answer simultaneously with visual feedback showing who's winning.

## 2. Design Language

### Aesthetic Direction
**"Neon Arcade meets Modern Minimalism"** - Dark backgrounds with vibrant neon accents create an immersive gaming atmosphere while maintaining clean readability. Think arcade game aesthetics refined for modern UI sensibilities.

### Color Palette
- **Primary**: `#6366F1` (Indigo) - Main actions, active states
- **Secondary**: `#EC4899` (Pink) - Highlights, accents
- **Success**: `#10B981` (Emerald) - Correct answers, wins
- **Danger**: `#EF4444` (Red) - Wrong answers, time warnings
- **Background**: `#0F172A` (Slate 900) - Deep navy black
- **Surface**: `#1E293B` (Slate 800) - Card backgrounds
- **Surface Light**: `#334155` (Slate 700) - Elevated elements
- **Text Primary**: `#F8FAFC` (Slate 50) - Headlines
- **Text Secondary**: `#94A3B8` (Slate 400) - Body text
- **Gold**: `#F59E0B` - Leaderboard #1, achievements
- **Silver**: `#9CA3AF` - Leaderboard #2
- **Bronze**: `#D97706` - Leaderboard #3

### Typography
- **Headlines**: Inter, 700 weight, tracking tight
- **Body**: Inter, 400-500 weight
- **Monospace (scores/timers)**: JetBrains Mono

### Spatial System
- Base unit: 4px
- Component padding: 12px, 16px, 24px
- Card border-radius: 16px
- Button border-radius: 12px
- Input border-radius: 8px

### Motion Philosophy
- **Entrance**: Fade up with 300ms ease-out, staggered 50ms
- **Transitions**: 200ms ease-in-out for state changes
- **Celebrations**: Spring physics with overshoot for victories
- **Countdown**: Scale pulse animation with urgency colors
- **Answer selection**: Quick 150ms highlight with ripple effect
- **Score updates**: Number animation with glow effect

### Visual Assets
- **Icons**: Lucide React icons
- **Illustrations**: CSS gradients and geometric shapes for empty states
- **Particles**: Confetti for victories, sparks for correct answers
- **Avatars**: Gradient-based generated avatars with initials

## 3. Layout & Structure

### App Shell
```
┌─────────────────────────────────────┐
│ Header (Logo, Nav, User Menu)       │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │
│    (Route-dependent views)          │
│                                     │
├─────────────────────────────────────┤
│ Bottom Nav (Mobile) / Side Nav      │
└─────────────────────────────────────┘
```

### Page Structure

#### Landing/Home
- Hero section with "Start Quiz" CTA
- Quick stats (games played, accuracy, ranking)
- Recent activity feed
- Social proof section

#### Lobby (Multiplayer)
- Active rooms list with player counts
- Create room button (prominent)
- Join room input
- Friend activity sidebar

#### Battle Room
- Question display (centered, large)
- 4 answer options (2x2 grid on mobile, row on desktop)
- Timer bar (animated countdown)
- Live player avatars with scores (side panel)
- Question progress indicator

#### Leaderboard
- Top 10 global rankings
- Filter by time period (daily/weekly/all-time)
- User's own rank highlighted
- Category-specific leaderboards

#### Friends
- Friend list with online status
- Invite friends section
- Friend battles history

### Responsive Strategy
- **Desktop (>1024px)**: Full sidebar nav, multi-column layouts
- **Tablet (768-1024px)**: Collapsible sidebar, adjusted grids
- **Mobile (<768px)**: Bottom navigation, single column, larger touch targets

## 4. Features & Interactions

### Authentication
- Email/password signup and login
- Google OAuth option
- Password reset flow
- Session persistence with auto-refresh

### Multiplayer Lobby
- **Create Room**:
  - Select category (General, Science, History, Sports, Entertainment, Tech)
  - Set number of questions (5, 10, 15, 20)
  - Set time per question (10s, 15s, 20s, 30s)
  - Generate unique room code
  - Share invite link
- **Join Room**:
  - Enter room code
  - View waiting room with host
  - Start when host initiates

### Live Battle Interface
- **Question Phase**:
  - Question fades in (300ms)
  - Timer starts immediately
  - Players see answer buttons light up as others answer
  - Last 5 seconds: timer turns red, pulses
- **Answer Reveal**:
  - Correct answer highlighted green
  - Player's answer marked (green/red)
  - Score update with animation
  - Brief 3s summary before next question
- **Game End**:
  - Final scores with rankings
  - Winner celebration animation
  - Share results button
  - Rematch option

### Question Bank
- Categories with difficulty indicators
- Random question generation
- Duplicate prevention per game
- Admin panel for adding questions (future)

### Leaderboard
- Real-time updates during games
- Global rankings
- Friends rankings
- Category-specific rankings
- Streak bonuses for consecutive correct answers

### Friend System
- Send/receive friend requests
- Online status with last seen
- Challenge friends directly
- View friend's battle history

### Invite Links
- Generate shareable room link
- Copy to clipboard with feedback
- Deep link handling for mobile

### Mobile App Wrapper
- Responsive PWA-ready design
- Touch-optimized controls
- Haptic feedback on answers
- Push notification support (future)

## 5. Component Inventory

### Button
- **States**: default, hover (scale 1.02, brightness), active (scale 0.98), disabled (opacity 50%), loading (spinner)
- **Variants**: Primary (gradient bg), Secondary (outline), Ghost (transparent), Danger (red)

### Input Field
- **States**: default, focus (ring glow), error (red border + message), disabled
- **Variants**: Text, Email, Password (toggle visibility)

### Card
- **States**: default, hover (subtle lift + glow), selected (border highlight)
- Glass morphism effect on surfaces

### Avatar
- **States**: Online (green dot), Offline (gray), In-game (animated ring)
- Generated gradient backgrounds with initials

### Timer Bar
- **States**: Normal (indigo), Warning (<10s, amber), Critical (<5s, red + pulse)
- Gradient fill with progress

### Answer Option
- **States**: Default, Hover, Selected (highlighted), Correct (green + check), Wrong (red + X), Disabled (dimmed)
- Shuffle indicator icon

### Leaderboard Row
- **States**: Default, User's row (highlighted bg), Top 3 (gold/silver/bronze badge)
- Rank number, avatar, name, score, change indicator

### Modal
- Backdrop blur (8px)
- Slide up animation
- Close on escape/backdrop click

### Toast Notifications
- **Variants**: Success (green), Error (red), Info (blue), Warning (amber)
- Auto-dismiss after 4s
- Stack from bottom-right

### Empty States
- Centered illustration (CSS gradients)
- Friendly copy
- Action button when applicable

## 6. Technical Approach

### Frontend Stack
- **React 18** with Vite
- **React Router v6** for routing
- **React Query** for server state
- **Supabase JS** client for auth and realtime
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

### Backend Architecture
- **Supabase** for all backend needs:
  - PostgreSQL database
  - Realtime subscriptions for live gameplay
  - Auth with JWT
  - Row Level Security for data protection

### Database Schema

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Question Bank
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game Rooms
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_id UUID REFERENCES profiles(id),
  category TEXT NOT NULL,
  question_count INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 15,
  status TEXT CHECK (status IN ('waiting', 'playing', 'finished')) DEFAULT 'waiting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Room Players
CREATE TABLE room_players (
  room_id UUID REFERENCES rooms(id),
  player_id UUID REFERENCES profiles(id),
  score INTEGER DEFAULT 0,
  answers_correct INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (room_id, player_id)
);

-- Game Sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES rooms(id),
  question_id UUID REFERENCES questions(id),
  round_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Player Answers (for history/replays)
CREATE TABLE player_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id),
  player_id UUID REFERENCES profiles(id),
  answer INTEGER NOT NULL,
  is_correct BOOLEAN,
  time_taken_ms INTEGER,
  score_earned INTEGER DEFAULT 0
);

-- Friendships
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES profiles(id),
  receiver_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, receiver_id)
);
```

### API Endpoints (Supabase Functions + Direct)

**Auth**
- POST /auth/signup - Register new user
- POST /auth/login - Sign in
- POST /auth/logout - Sign out

**Rooms**
- POST /rooms - Create new room
- GET /rooms/:code - Get room by code
- POST /rooms/:id/join - Join room
- POST /rooms/:id/leave - Leave room
- PATCH /rooms/:id/start - Start game (host only)

**Gameplay (Realtime)**
- Subscribe to room channel for live updates
- Broadcast answer selection
- Broadcast score updates
- Broadcast game end

**Leaderboard**
- Query profiles ordered by total_score
- Filter by category (via questions table join)

**Friends**
- POST /friends - Send friend request
- PATCH /friends/:id - Accept/reject request
- GET /friends - List accepted friends

### Realtime Architecture

```javascript
// Room channel structure
supabase.channel(`room:${roomId}`)
  .on('broadcast', { event: 'player_joined' }, handlePlayerJoined)
  .on('broadcast', { event: 'player_left' }, handlePlayerLeft)
  .on('broadcast', { event: 'game_start' }, handleGameStart)
  .on('broadcast', { event: 'question' }, handleNewQuestion)
  .on('broadcast', { event: 'answer' }, handleAnswerResult)
  .on('broadcast', { event: 'round_end' }, handleRoundEnd)
  .on('broadcast', { event: 'game_end' }, handleGameEnd)
  .subscribe()
```

### Security (RLS Policies)
- Users can only read/write their own profile
- Room players can only read room data they're in
- Questions are read-only for all authenticated users
- Friendships managed by sender/receiver only

## 7. File Structure

```
quiz-battle/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.js
│   │   └── constants.js
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Avatar.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── Toast.jsx
│   │   ├── layout/
│   │   │   ├── Header.jsx
│   │   │   ├── BottomNav.jsx
│   │   │   └── PageContainer.jsx
│   │   ├── game/
│   │   │   ├── QuestionCard.jsx
│   │   │   ├── AnswerOption.jsx
│   │   │   ├── Timer.jsx
│   │   │   ├── ScoreBoard.jsx
│   │   │   └── PlayerList.jsx
│   │   ├── lobby/
│   │   │   ├── RoomCard.jsx
│   │   │   ├── CreateRoomForm.jsx
│   │   │   ├── JoinRoomForm.jsx
│   │   │   └── WaitingRoom.jsx
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.jsx
│   │   │   └── LeaderboardRow.jsx
│   │   └── friends/
│   │       ├── FriendList.jsx
│   │       └── FriendRequest.jsx
│   ├── pages/
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Lobby.jsx
│   │   ├── Battle.jsx
│   │   ├── Leaderboard.jsx
│   │   ├── Friends.jsx
│   │   └── Profile.jsx
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useRoom.js
│   │   ├── useGame.js
│   │   └── useRealtime.js
│   └── context/
│       ├── AuthContext.jsx
│       └── GameContext.jsx
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── SPEC.md
```

## 8. Game Flow

```
[Auth] → [Lobby] → [Create/Join Room] → [Waiting Room] → [Game Start]
                                                      ↓
                                              [Question Loop]
                                                      ↓
                                          [Round End Animation]
                                                      ↓
                                        (repeat until questions done)
                                                      ↓
                                          [Final Results]
                                                      ↓
                                            [Share/Rematch]
```

### Question Flow (per round)
1. Broadcast "question" event with question data
2. Start 15s countdown (configurable)
3. Players submit answers via broadcast
4. Timer expires OR all players answered
5. Broadcast correct answer with all player results
6. Show 3s summary with score changes
7. Next question or game end