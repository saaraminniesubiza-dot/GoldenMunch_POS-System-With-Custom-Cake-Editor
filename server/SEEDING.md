# Database Seeding Guide

This guide explains how to seed default admin and cashier credentials into your Golden Munch POS database.

## Why Use the Seeder?

The seeder creates default credentials with **Node.js bcrypt hashes** that are guaranteed to work with the authentication system. Running the seeder ensures:

- ✅ Correct hash format (`$2b$` instead of PHP's `$2y$`)
- ✅ Automatic verification after seeding
- ✅ Works with both new and existing databases
- ✅ Updates existing credentials if they already exist

## Prerequisites

1. MySQL server running
2. Database created: `CREATE DATABASE GoldenMunchPOS;`
3. Tables created (run the schema SQL first)
4. `.env` file configured with database credentials

## Method 1: Quick JavaScript Seeder (Recommended)

The simplest way - just run the standalone JavaScript file:

```bash
cd server
node seedCredentials.js
```

This will:
- Connect to your database
- Generate secure bcrypt hashes
- Create/update admin and cashier accounts
- Verify the credentials work
- Display login information

## Method 2: TypeScript Seeder (via npm script)

If you prefer using the TypeScript version:

```bash
cd server
npm run seed:admin
```

## Default Credentials

After seeding, you can login with:

### Admin Login
- **URL**: http://localhost:5000/admin
- **Username**: `admin`
- **Password**: `password`

### Cashier Login
- **URL**: http://localhost:5000/pos
- **Cashier Code**: `CASH001`
- **PIN**: `1234`

## ⚠️ Security Warning

**These are default credentials for development only!**

After your first login, immediately:
1. Change the admin password
2. Change the cashier PIN
3. Create new accounts with secure credentials

## Troubleshooting

### "Connection refused" error
- Make sure MySQL is running
- Check your DB_HOST, DB_PORT in `.env`

### "Database doesn't exist" error
```sql
CREATE DATABASE GoldenMunchPOS;
```

### "Table doesn't exist" error
Run the schema SQL file first:
```bash
mysql -u root -p GoldenMunchPOS < databaseSchema/GoldenMunchPOSV2.sql
```

### "Invalid credentials" after seeding
This should not happen with the seeder! If it does:
1. Run the seeder again
2. Check the verification output
3. Check server logs for detailed error messages

## What the Seeder Does

1. **Connects** to your MySQL database
2. **Generates** bcrypt hashes using Node.js bcrypt (10 rounds)
3. **Updates** existing credentials OR **creates** new ones if they don't exist
4. **Verifies** the credentials by comparing the plain passwords with the hashes
5. **Displays** success message with login information

## Files

- `seedCredentials.js` - Standalone JavaScript version (no build needed)
- `src/seeders/seedAdminAndCashier.ts` - TypeScript version (requires ts-node)
- `generateHash.js` - Hash generator utility (for manual hash generation)
- `databaseSchema/update_credentials.sql` - SQL update script (not recommended - use seeder instead)

## Need Help?

If you encounter any issues:
1. Check the error message carefully
2. Verify your database is running and accessible
3. Ensure your `.env` file has correct credentials
4. Make sure tables exist in the database
