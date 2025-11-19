/*
    Script: 03_security.sql
    Purpose: Configures database roles, users, and grants for RitualDB.
*/

USE RitualDB;
GO

-- Database roles mapped to application roles
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ritual_admin')
    CREATE ROLE ritual_admin AUTHORIZATION dbo;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ritual_manager')
    CREATE ROLE ritual_manager AUTHORIZATION dbo;
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'ritual_guest')
    CREATE ROLE ritual_guest AUTHORIZATION dbo;
GO

-- Admins: full access
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON SCHEMA::domain TO ritual_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::ref TO ritual_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::audit TO ritual_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA::admin TO ritual_admin;
GO

-- Managers (application clients) : restricted modifications
GRANT SELECT ON SCHEMA::ref TO ritual_manager;
GRANT SELECT, INSERT, UPDATE ON SCHEMA::domain TO ritual_manager;
DENY DELETE ON SCHEMA::domain TO ritual_manager;
GRANT EXECUTE ON SCHEMA::domain TO ritual_manager;
GO

-- Guests: read only
GRANT SELECT ON SCHEMA::ref TO ritual_guest;
GRANT SELECT ON SCHEMA::domain TO ritual_guest;
DENY SELECT ON audit.audit_log TO ritual_guest;
DENY SELECT ON admin.backup_jobs TO ritual_guest;
GO

-- Sensitive data masking via column level permissions
DENY SELECT ON OBJECT::domain.clients (address_encrypted) TO ritual_guest;
DENY SELECT ON OBJECT::domain.clients (passport_encrypted) TO ritual_guest;
DENY SELECT ON OBJECT::domain.clients (address_encrypted) TO ritual_manager;
DENY SELECT ON OBJECT::domain.clients (passport_encrypted) TO ritual_manager;
DENY SELECT ON OBJECT::domain.vw_clients_secure TO ritual_manager;
DENY SELECT ON OBJECT::domain.vw_clients_secure TO ritual_guest;
GO

-- Example contained users (replace with actual login mapping in production)
/*
CREATE USER ritual_api_admin WITH PASSWORD = 'StrongPassword!1';
ALTER ROLE ritual_admin ADD MEMBER ritual_api_admin;

CREATE USER ritual_api_manager WITH PASSWORD = 'AnotherStrongPassword!1';
ALTER ROLE ritual_manager ADD MEMBER ritual_api_manager;

CREATE USER ritual_api_guest WITH PASSWORD = 'GuestPassword!1';
ALTER ROLE ritual_guest ADD MEMBER ritual_api_guest;
*/

PRINT N'Security roles and grants configured.';
GO

