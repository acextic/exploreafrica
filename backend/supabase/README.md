# ExploreAfrica Backend – Supabase

This folder contains all backend infrastructure logic for the ExploreAfrica platform, including the database schema, row-level security policies, and triggers for user authentication.

## Structure
```
backend/
└── supabase/
    ├── schema.sql         # PostgreSQL schema for tables, types, constraints
    ├── policies.sql       # Row-Level Security (RLS) policies
    ├── triggers.sql       # Triggers for syncing Supabase auth with users table
    └── README.md          # This documentation file
```

## Prerequisites
- A [Supabase](https://supabase.com/) project set up
- Supabase Auth (email/password) enabled

## How to Apply These Scripts
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Paste and execute the contents of the following files, **in order**:

### 1. `schema.sql`
- Creates all tables: `users`, `bookings`, `packages`, `payments`, `accommodations`, etc.
- Includes constraints, foreign keys, enums, and defaults

### 2. `policies.sql`
- Enables Row-Level Security (RLS)
- Defines policies so users can only access their own data (bookings, messages, etc.)

### 3. `triggers.sql`
- Adds a trigger function that inserts a record into the `users` table after successful signup via Supabase Auth

## Important Notes
- These scripts are version-controlled but **must be manually applied** to your Supabase instance.
- The `user_id` in your `users` table must be a `UUID` to sync correctly with `auth.users.id`.
- Supabase does not run these files automatically — the SQL Editor or Supabase CLI must be used.

## Optional: Using Supabase CLI
If you prefer automating deployments:
```bash
supabase db push
```
This will push schema changes to the Supabase project, but requires CLI setup and DB migration files.

## Contributing
- Any changes to the schema or policies should be reflected in the corresponding `.sql` files.
- Always open a PR and include a clear description of what was added/changed.

---