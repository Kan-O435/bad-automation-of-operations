# Project: Badminton Tournament Management App

## Overview
This application is a badminton tournament management system.
It allows users to create, manage, and operate tournaments, including automatic generation of match structures (league and tournament), score tracking, and result exporting.

## Tech Stack
- Frontend: Next.js (TypeScript)
- Backend: Ruby on Rails (API mode)
- Database: PostgreSQL (online) / SQLite (offline mode)
- Infra/Security: Cloudflare

---

## Core Features

### Authentication
- Users can sign up, log in, and log out
- Token-based authentication (e.g., JWT or devise_token_auth)

---

### Tournament Creation
- Users can create tournaments
- Tournament settings include:
  - Gender category (men/women/mixed)
  - Age category
  - Skill division (A/B/C etc.)
  - Format:
    - Tournament (single elimination)
    - League (round robin)
    - With/without preliminary league

---

### Billing Logic
- Users can create 1 tournament for free
- Creating 2 or more tournaments requires payment
- Pricing depends on the number of participants
- Billing is charged at the end of the month of the tournament

---

### Participant Management
- Users can register participants by team
- Teams and players are associated with tournaments

---

### Match Generation
- Automatically generate:
  - Preliminary leagues (if enabled)
  - Main tournament brackets
  - Round-robin leagues
- Structure must adapt dynamically to participant count

---

### Match Operation
- Admin can input match scores
- Scores automatically update:
  - Tournament progression
  - League standings (points, rank, etc.)

---

### Special Cases
- Handle player/team absence (mark as withdrawn)
- Visually indicate withdrawn participants (e.g., strike-through)

---

### Match Sheet Export
- For upcoming matches:
  - Generate a printable PDF
  - Includes:
    - Player names
    - Teams
    - Referee
    - Score sheet

---

### Result Management
- At tournament end:
  - Output:
    - Winner
    - Runner-up
    - Optional: 3rd and 4th place
- Save results as:
  - Image (PNG)
  - PDF

---

### Export / Sharing
- Tournament results can be exported as:
  - PDF
  - PNG
- Designed for easy sharing or embedding elsewhere

---

### Offline Mode (Optional / Paid Feature)
- Tournament can be downloaded and run locally
- Use SQLite for offline environments (e.g., gym without WiFi)
- Sync with main server when back online (future scope)

---

## Development Rules

### General
- Always prioritize type safety (TypeScript)
- Keep components small and reusable
- Use RESTful API design in Rails

---

### Frontend (Next.js)
- Use functional components with hooks
- Separate UI and business logic
- Use SWR or React Query for API fetching
- Use Tailwind CSS for styling

---

### Backend (Rails API)
- Follow REST conventions
- Use serializers (e.g., ActiveModel::Serializer or fast_jsonapi)
- Keep controllers thin, move logic to services
- Write business logic in service objects

---

### Naming Conventions
- Use clear and descriptive names
- Example:
  - `Tournament`
  - `Match`
  - `Team`
  - `Player`
  - `Bracket`
  - `League`

---

### Match Logic Rules
- Tournament:
  - Single elimination bracket
- League:
  - Round robin
  - Ranking based on:
    - Wins
    - Point difference
- Preliminary → Main tournament progression must be deterministic

---

### Code Generation Instructions (for Cursor)
- When generating code:
  - Always include types (TypeScript / Ruby types if applicable)
  - Avoid overly abstract patterns
  - Prefer simple and readable implementations
- When unsure:
  - Ask clarifying questions instead of guessing

---

### Constraints
- Do NOT use unnecessary external libraries
- Prioritize performance for large tournaments
- Ensure scalability for 100+ participants

---

### Security
- All endpoints must require authentication unless explicitly public
- Validate all inputs strictly
- Protect against common vulnerabilities (XSS, CSRF, SQL injection)

---

## Future Scope
- Real-time updates (WebSocket)
- Multi-device sync
- Advanced analytics
- Referee assignment system

## Development Phase

### Phase 1 (Current Scope)
- Admin authentication
- Tournament creation
- TournamentDay management

### Not in Scope (Do NOT implement yet)
- Match generation
- Team / Player management
- Score system
- Billing system
- PDF export
- Offline mode

---

## Current Models

- Admin
- Tournament
- TournamentDay

---

## Database Design Rules

- Keep schema minimal (MVP first)
- Avoid adding unused columns
- Prefer simple associations:
  - Tournament belongs_to Admin
  - TournamentDay belongs_to Tournament
- Use proper foreign keys and indexes
- Always include timestamps

---

## Code Generation Instructions (Updated)

- Generate only code relevant to Phase 1
- Do not assume future features
- Keep logic simple and extendable

## Database Design Policy (MVP)

### Core Principle

* Prioritize simplicity and speed for MVP
* Avoid over-engineering in early stages

---

### Tournament Category Design

* Use a **single table (`tournament_categories`)** to manage:

  * basic information (gender, event type, age, rank)
  * format settings (tournament / league / hybrid)
  * configuration (group size, advance count, etc.)

* Do NOT split into multiple tables (e.g., format_settings, rules) at this stage

---

### NULL Handling Policy（重要）

Define NULL explicitly as part of the system design:

There are two types of NULL in this system:

1. **Invalid NULL (Not Allowed)**

   * A value that should exist but is missing
   * Indicates broken or incomplete data
   * Must be prevented by validations

2. **Intentional NULL (Allowed)**

   * A value that is **not applicable by design** depending on `format_type`
   * Example:

     * tournament → `group_size`, `group_count` are NULL
     * league → `advance_count` may be NULL

👉 NULL is allowed only when it is **explicitly defined by the specification**

---

### Validation Policy

* Use model-level validations based on `format_type`

Examples:

* league:

  * `group_size` must be present

* tournament:

  * `group_size` must be NULL or ignored

* Never allow "undefined NULL"

---

### Refactoring Policy

* If:

  * NULL usage becomes complex
  * validations become difficult to manage
  * format-specific logic grows significantly

→ Then consider splitting into separate tables (e.g., rules)

* Do NOT optimize prematurely

---

### Code Generation Instructions

* When generating schema:

  * keep it minimal and simple
  * follow the single-table strategy for now

* When handling NULL:

  * always distinguish between:

    * "not applicable"
    * "missing data"

* Prefer explicit validation over implicit assumptions

## How to Work With Me

- Always follow Phase 1 scope strictly
- Do not implement out-of-scope features
- Ask questions if requirements are unclear
- When generating code:
  - Show only necessary files
  - Explain briefly before code
- Prefer step-by-step implementation over large changes
