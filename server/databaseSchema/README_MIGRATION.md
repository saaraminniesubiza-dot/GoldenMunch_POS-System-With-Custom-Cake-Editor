# Database Migration: Add kiosk_setting Table

## Issue
The backend code expects a `kiosk_setting` table (singular) for storing system settings including payment QR codes, but this table doesn't exist in your database.

## Solution
Run the migration SQL file to create the missing table.

## How to Apply the Migration

### Option 1: Using MySQL Command Line
```bash
mysql -u your_username -p your_database_name < server/databaseSchema/add_kiosk_setting_table.sql
```

### Option 2: Using MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Click **File > Open SQL Script**
4. Select `server/databaseSchema/add_kiosk_setting_table.sql`
5. Click **Execute** (lightning bolt icon)

### Option 3: Using phpMyAdmin
1. Login to phpMyAdmin
2. Select your database
3. Click on **SQL** tab
4. Copy and paste the contents of `add_kiosk_setting_table.sql`
5. Click **Go**

### Option 4: Using the mysql client
```bash
# Navigate to the project directory
cd GoldenMunch_POS-System-With-Custom-Cake-Editor

# Run the migration
mysql -u root -p defaultdb < server/databaseSchema/add_kiosk_setting_table.sql
```

## What This Migration Does

1. **Creates the `kiosk_setting` table** with the following columns:
   - `setting_id` - Auto-incrementing primary key
   - `setting_key` - Unique key for the setting (e.g., 'gcash_qr_code_url')
   - `setting_value` - The value of the setting
   - `setting_type` - Type of value (string, number, boolean, json)
   - `description` - Human-readable description
   - `updated_by` - Admin who last updated the setting
   - `updated_at` - Timestamp of last update

2. **Inserts default settings** including:
   - Kiosk timeout settings
   - Loyalty program configuration
   - Tax rates
   - Store information
   - Contact details

3. **Payment QR codes** (gcash_qr_code_url, paymaya_qr_code_url) will be added automatically when you upload them via the admin interface.

## Verification

After running the migration, verify it worked by running:

```sql
SELECT * FROM kiosk_setting;
```

You should see the default settings listed.

## Next Steps

After the migration is complete:
1. Restart your backend server
2. Go to **Payment QR** in the admin sidebar
3. Upload your GCash and PayMaya QR codes
4. The codes will be stored in this table and displayed to customers during checkout
