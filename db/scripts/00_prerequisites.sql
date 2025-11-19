/*
    Script: 00_prerequisites.sql
    Purpose: Creates RitualDB database, encryption keys, default schemas, and utility types.
    Notes:
      - Replace the placeholder password before running in production.
      - Execute in SQL Server 2022 or later.
*/

IF DB_ID(N'RitualDB') IS NULL
BEGIN
    PRINT N'Creating database RitualDB...';
    CREATE DATABASE RitualDB
    COLLATE Cyrillic_General_100_CI_AS_SC_UTF8;
END;
GO

USE RitualDB;
GO

IF NOT EXISTS (SELECT 1 FROM sys.symmetric_keys WHERE name = N'RitualDBMasterKey')
BEGIN
    PRINT N'Creating database master key...';
    CREATE MASTER KEY ENCRYPTION BY PASSWORD = N'ChangeMe_ProvideStrongPassword!';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.certificates WHERE name = N'RitualDBCertificate')
BEGIN
    PRINT N'Creating certificate for encryption...';
    CREATE CERTIFICATE RitualDBCertificate
        WITH SUBJECT = N'Certificate for RitualDB sensitive data encryption';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.symmetric_keys WHERE name = N'ClientDataKey')
BEGIN
    PRINT N'Creating symmetric key for client data...';
    CREATE SYMMETRIC KEY ClientDataKey
        WITH ALGORITHM = AES_256
        ENCRYPTION BY CERTIFICATE RitualDBCertificate;
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'ref')
BEGIN
    EXEC(N'CREATE SCHEMA ref AUTHORIZATION dbo;');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'domain')
BEGIN
    EXEC(N'CREATE SCHEMA domain AUTHORIZATION dbo;');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'audit')
BEGIN
    EXEC(N'CREATE SCHEMA audit AUTHORIZATION dbo;');
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = N'admin')
BEGIN
    EXEC(N'CREATE SCHEMA admin AUTHORIZATION dbo;');
END;
GO

PRINT N'Prerequisites script completed.';
GO

