/*
    Script: 08_restore.sql
    Purpose: Demonstrates restore procedure for RitualDB from full + diff + log backups.
    Warning: This script will overwrite the existing RitualDB database.
*/

USE master;
GO

DECLARE @BackupPath NVARCHAR(400) = N'/var/opt/mssql/backups';
DECLARE @FullPath NVARCHAR(400) = @BackupPath + N'/RitualDB_full.bak';
DECLARE @DiffPath NVARCHAR(400) = @BackupPath + N'/RitualDB_diff.bak';
DECLARE @LogPath  NVARCHAR(400) = @BackupPath + N'/RitualDB_log.trn';

IF DB_ID(N'RitualDB') IS NOT NULL
BEGIN
    ALTER DATABASE RitualDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END;

PRINT N'Restoring FULL backup...';
RESTORE DATABASE RitualDB
FROM DISK = @FullPath
WITH REPLACE,
     NORECOVERY,
     STATS = 5;

PRINT N'Restoring DIFFERENTIAL backup...';
RESTORE DATABASE RitualDB
FROM DISK = @DiffPath
WITH NORECOVERY,
     STATS = 5;

PRINT N'Restoring LOG backup...';
RESTORE LOG RitualDB
FROM DISK = @LogPath
WITH RECOVERY,
     STATS = 5;

ALTER DATABASE RitualDB SET MULTI_USER;

PRINT N'Restore completed successfully.';
GO

