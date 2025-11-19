/*
    Script: 07_backup.sql
    Purpose: Demonstrates full/differential/log backup sequence for RitualDB.
    Note: Adjust backup path for your environment. Works inside Docker (see ops/compose).
*/

USE master;
GO

DECLARE @BackupPath NVARCHAR(400) = N'/var/opt/mssql/backups';
DECLARE @FullPath NVARCHAR(400) = @BackupPath + N'/RitualDB_full.bak';
DECLARE @DiffPath NVARCHAR(400) = @BackupPath + N'/RitualDB_diff.bak';
DECLARE @LogPath NVARCHAR(400)  = @BackupPath + N'/RitualDB_log.trn';

PRINT N'Starting FULL backup of RitualDB...';
BACKUP DATABASE RitualDB
TO DISK = @FullPath
   WITH FORMAT,
        COMPRESSION,
        INIT,
        STATS = 5;

EXEC RitualDB.admin.sp_register_backup
    @JobName = N'Backup_FULL',
    @BackupType = N'full',
    @TargetPath = @FullPath,
    @Status = N'success',
    @Comments = N'Nightly full backup';

PRINT N'Creating DIFFERENTIAL backup...';
BACKUP DATABASE RitualDB
TO DISK = @DiffPath
   WITH DIFFERENTIAL,
        COMPRESSION,
        INIT,
        STATS = 5;

EXEC RitualDB.admin.sp_register_backup
    @JobName = N'Backup_DIFF',
    @BackupType = N'diff',
    @TargetPath = @DiffPath,
    @Status = N'success',
    @Comments = N'Daily diff backup';

PRINT N'Capturing LOG backup...';
BACKUP LOG RitualDB
TO DISK = @LogPath
   WITH INIT,
        STATS = 5;

EXEC RitualDB.admin.sp_register_backup
    @JobName = N'Backup_LOG',
    @BackupType = N'log',
    @TargetPath = @LogPath,
    @Status = N'success',
    @Comments = N'Hourly log backup';

PRINT N'Backup sequence completed.';
GO

