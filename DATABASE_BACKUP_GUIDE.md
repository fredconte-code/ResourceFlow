# Database Backup & Restore Guide

## Overview

ResourceFlow now includes a comprehensive database backup and restore system accessible through the Settings page. This feature allows you to export your complete database as a JSON file and import it back when needed.

## Accessing the Feature

1. Navigate to **Settings** in the application
2. Scroll down to the **Data Management** section
3. Find the **Database Backup & Restore** subsection

## Features

### 🔄 Export Database
- **Purpose**: Create a complete backup of your database
- **Format**: JSON file with all data including:
  - Team Members
  - Projects
  - Holidays
  - Vacations
  - Project Allocations
  - Settings
- **File Naming**: `resourceflow-backup-YYYY-MM-DD.json`

### 📥 Import Database
- **Purpose**: Restore your database from a previously exported backup
- **Format**: JSON file (must be exported from ResourceFlow)
- **Validation**: Automatic validation of file format and data integrity
- **Safety**: Replaces all existing data (backup recommended before import)

## How to Use

### Exporting Your Database

1. Click the **"Export Database"** button
2. Wait for the export to complete (shows loading spinner)
3. The file will automatically download to your default downloads folder
4. You'll see a success notification when complete

### Importing a Database Backup

1. Click the **"Import Database"** button
2. Select your backup JSON file
3. The system will validate the file format and data
4. If validation passes, the import will proceed
5. The page will refresh to show the imported data
6. You'll see a success notification when complete

## Validation Features

### ✅ Successful Validation
- Green notification with checkmark
- File is ready for import
- All data structures are valid

### ❌ Failed Validation
- Red notification with error details
- Lists specific validation errors
- Import is blocked until errors are resolved

### ⚠️ Warnings
- Yellow notification for non-critical issues
- Import can proceed but with warnings
- Examples: version compatibility warnings

## File Format

The backup file contains:

```json
{
  "teamMembers": [...],
  "projects": [...],
  "holidays": [...],
  "vacations": [...],
  "projectAllocations": [...],
  "settings": {...},
  "exportDate": "2025-08-01T19:30:00.000Z",
  "version": "1.0.0",
  "metadata": {
    "totalRecords": 169,
    "exportSource": "resourceflow",
    "exportType": "full"
  }
}
```

## Best Practices

### 🔒 Regular Backups
- Export your database weekly or before major changes
- Store backups in a secure location
- Keep multiple backup versions

### 📁 File Management
- Use descriptive filenames with dates
- Organize backups in a dedicated folder
- Don't modify backup files manually

### ⚠️ Import Safety
- Always export current data before importing
- Verify backup file integrity before import
- Test imports on a development environment first

### 🔄 Migration Strategy
- Export from old system
- Import to new system
- Verify all data transferred correctly
- Keep old backup as reference

## Troubleshooting

### Export Issues
- **Network Error**: Check server connection
- **File Download**: Check browser download settings
- **Large Files**: Ensure sufficient disk space

### Import Issues
- **Invalid File**: Ensure file is a valid ResourceFlow backup
- **Validation Errors**: Check error messages for specific issues
- **Import Fails**: Verify server is running and accessible

### Data Issues
- **Missing Data**: Check if all required fields are present
- **Corrupted Data**: Try importing from a different backup
- **Version Mismatch**: Update to latest version if needed

## Security Considerations

- Backup files contain all your data - keep them secure
- Don't share backup files with unauthorized users
- Consider encrypting backup files for sensitive data
- Regularly rotate backup storage locations

## Support

If you encounter issues with database backup/restore:

1. Check the validation messages for specific errors
2. Ensure you're using a valid ResourceFlow backup file
3. Verify your server is running and accessible
4. Contact support with error details and backup file information

---

**Note**: This feature is designed to work with ResourceFlow backup files only. Importing files from other systems may not work correctly. 