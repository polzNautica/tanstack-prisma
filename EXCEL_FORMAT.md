# Excel Import/Export Format

## Required Columns

Your Excel file should contain the following columns:

| Column Name | Description | Example |
|------------|-------------|---------|
| `id` | Unique identifier for the candidate | `CAND001`, `EMP-12345` |
| `name` | Full name of the candidate | `John Doe` |
| `email` | Email address | `john@example.com` |
| `organization` | Company or organization | `Acme Corp` |
| `invited_by` | Who invited/invited this person | `HR Department`, `Jane Manager` |

## Column Name Variations

The system accepts these variations (case-insensitive):

- **ID**: `id`, `ID`, `candidate_id`
- **Name**: `name`, `Name`, `full_name`, `Full Name`
- **Email**: `email`, `Email`, `email_address`, `Email Address`
- **Organization**: `organization`, `Organization`, `org`, `company`, `Company`
- **Invited By**: `invited_by`, `invitedBy`, `Invited By`, `referral`, `Referral`

## Example Excel File

```
id        | name          | email                  | organization  | invited_by
---------------------------------------------------------------------------
CAND001   | John Doe      | john@acme.com          | Acme Corp     | HR Dept
CAND002   | Jane Smith    | jane@tech.com          | Tech Inc      | HR Dept
CAND003   | Bob Johnson   | bob@startup.com        | Startup LLC   | John Doe
```

## Import Tips

1. **File Format**: Supports `.xlsx`, `.xls`, and `.csv`
2. **Headers**: First row must contain column headers
3. **Required Fields**: `id`, `name`, and `email` are required
4. **Duplicates**: Rows with duplicate IDs will be skipped
5. **Batch Size**: Can import hundreds of records at once

## Common Issues

- ❌ **Missing headers**: Make sure first row contains column names
- ❌ **Empty required fields**: id, name, and email must have values
- ❌ **Wrong column names**: Use the exact column names listed above
- ✅ **Extra columns**: Safe to add extra columns, they'll be ignored

## Export Format

When exporting, you'll get all candidate data including:
- All imported fields
- `is_attended`: Attendance status (true/false)
- `attended_at`: Timestamp when they checked in
- `created_at`: When record was created

This allows you to track who has attended and export attendance reports.
