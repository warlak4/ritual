/*
    Script: 04_programmability.sql
    Purpose: Creates stored procedures, functions, table types used by the application.
*/

USE RitualDB;
GO

-- Table types -----------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = N'udt_OrderService' AND is_table_type = 1)
BEGIN
    CREATE TYPE domain.udt_OrderService AS TABLE (
        service_id UNIQUEIDENTIFIER NOT NULL,
        quantity   DECIMAL(10,2) NOT NULL,
        unit_price DECIMAL(18,2) NOT NULL,
        discount   DECIMAL(18,2) NOT NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = N'udt_AssignStaff' AND is_table_type = 1)
BEGIN
    CREATE TYPE domain.udt_AssignStaff AS TABLE (
        staff_id UNIQUEIDENTIFIER NOT NULL,
        role     NVARCHAR(100) NOT NULL,
        notes    NVARCHAR(400) NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = N'udt_AssignVehicle' AND is_table_type = 1)
BEGIN
    CREATE TYPE domain.udt_AssignVehicle AS TABLE (
        vehicle_id UNIQUEIDENTIFIER NOT NULL,
        driver_id  UNIQUEIDENTIFIER NULL,
        start_at   DATETIME2 NOT NULL,
        end_at     DATETIME2 NOT NULL,
        notes      NVARCHAR(400) NULL
    );
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = N'udt_AssignInventory' AND is_table_type = 1)
BEGIN
    CREATE TYPE domain.udt_AssignInventory AS TABLE (
        inventory_id UNIQUEIDENTIFIER NOT NULL,
        quantity     INT NOT NULL,
        notes        NVARCHAR(400) NULL
    );
END;
GO

-- Functions -------------------------------------------------------------------
IF OBJECT_ID(N'domain.fn_order_total', N'FN') IS NOT NULL
    DROP FUNCTION domain.fn_order_total;
GO

CREATE FUNCTION domain.fn_order_total (@order_id UNIQUEIDENTIFIER)
RETURNS DECIMAL(18,2)
AS
BEGIN
    DECLARE @result DECIMAL(18,2);
    SELECT @result = ISNULL(SUM((os.unit_price - os.discount) * os.quantity), 0)
    FROM domain.order_services os
    WHERE os.order_id = @order_id;
    RETURN @result;
END;
GO

-- Stored Procedures -----------------------------------------------------------
IF OBJECT_ID(N'domain.sp_create_order', N'P') IS NOT NULL
    DROP PROCEDURE domain.sp_create_order;
GO

CREATE PROCEDURE domain.sp_create_order
    @ClientId UNIQUEIDENTIFIER,
    @DeceasedId UNIQUEIDENTIFIER,
    @ResponsibleUserId UNIQUEIDENTIFIER = NULL,
    @PackageId UNIQUEIDENTIFIER = NULL,
    @Currency CHAR(3),
    @Services domain.udt_OrderService READONLY,
    @ContractNumber NVARCHAR(50) = NULL,
    @OrderId UNIQUEIDENTIFIER OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TranStarted BIT = 0;
    BEGIN TRY
        IF @@TRANCOUNT = 0
        BEGIN
            SET @TranStarted = 1;
            BEGIN TRANSACTION;
        END

        IF NOT EXISTS (SELECT 1 FROM domain.clients WHERE id = @ClientId)
            THROW 50001, N'Client not found.', 1;

        IF NOT EXISTS (SELECT 1 FROM domain.deceased WHERE id = @DeceasedId AND client_id = @ClientId)
            THROW 50002, N'Deceased record not linked to client.', 1;

        IF @PackageId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM domain.service_packages WHERE id = @PackageId AND is_active = 1)
            THROW 50003, N'Service package is inactive or missing.', 1;

        DECLARE @NewOrderId UNIQUEIDENTIFIER;
        SET @NewOrderId = NEWID();

        INSERT INTO domain.orders (
            id, client_id, responsible_user_id, deceased_id, package_id,
            status, total_amount, currency, contract_number)
        VALUES (
            @NewOrderId, @ClientId, @ResponsibleUserId, @DeceasedId, @PackageId,
            N'pending', 0, @Currency, @ContractNumber);

        INSERT INTO domain.order_services (order_id, service_id, quantity, unit_price, discount, notes)
        SELECT
            @NewOrderId,
            s.service_id,
            s.quantity,
            s.unit_price,
            s.discount,
            NULL
        FROM @Services s;

        DECLARE @CalculatedTotal DECIMAL(18,2) = domain.fn_order_total(@NewOrderId);
        UPDATE domain.orders SET total_amount = @CalculatedTotal WHERE id = @NewOrderId;

        SET @OrderId = @NewOrderId;

        IF @TranStarted = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @TranStarted = 1 AND @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO

IF OBJECT_ID(N'domain.sp_assign_ceremony_resources', N'P') IS NOT NULL
    DROP PROCEDURE domain.sp_assign_ceremony_resources;
GO

CREATE PROCEDURE domain.sp_assign_ceremony_resources
    @CeremonyId UNIQUEIDENTIFIER,
    @Staff domain.udt_AssignStaff READONLY,
    @Vehicles domain.udt_AssignVehicle READONLY,
    @Inventory domain.udt_AssignInventory READONLY
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TranStarted BIT = 0;

    BEGIN TRY
        IF @@TRANCOUNT = 0
        BEGIN
            SET @TranStarted = 1;
            BEGIN TRANSACTION;
        END

        IF NOT EXISTS (SELECT 1 FROM domain.ceremonies WHERE id = @CeremonyId)
            THROW 50010, N'Ceremony not found.', 1;

        -- Validate vehicle overlaps
        IF EXISTS (
            SELECT 1
            FROM @Vehicles v
            INNER JOIN domain.vehicle_bookings vb
                ON vb.vehicle_id = v.vehicle_id
               AND vb.ceremony_id <> @CeremonyId
               AND v.start_at < vb.end_at
               AND v.end_at > vb.start_at
        )
        BEGIN
            THROW 50011, N'Vehicle schedule conflict detected.', 1;
        END;

        -- Validate inventory availability
        IF EXISTS (
            SELECT 1
            FROM @Inventory i
            INNER JOIN domain.inventory inv ON inv.id = i.inventory_id
            WHERE i.quantity > inv.quantity_available
        )
        BEGIN
            THROW 50012, N'Inventory quantity exceeds availability.', 1;
        END;

        DELETE FROM domain.staff_assignments WHERE ceremony_id = @CeremonyId;
        DELETE FROM domain.vehicle_bookings WHERE ceremony_id = @CeremonyId;
        DELETE FROM domain.inventory_bookings WHERE ceremony_id = @CeremonyId;

        INSERT INTO domain.staff_assignments (ceremony_id, staff_id, role, notes)
        SELECT @CeremonyId, staff_id, role, notes FROM @Staff;

        INSERT INTO domain.vehicle_bookings (ceremony_id, vehicle_id, driver_id, start_at, end_at, notes)
        SELECT @CeremonyId, vehicle_id, driver_id, start_at, end_at, notes FROM @Vehicles;

        INSERT INTO domain.inventory_bookings (ceremony_id, inventory_id, quantity, notes)
        SELECT @CeremonyId, inventory_id, quantity, notes FROM @Inventory;

        IF @TranStarted = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @TranStarted = 1 AND @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO

IF OBJECT_ID(N'domain.sp_register_payment', N'P') IS NOT NULL
    DROP PROCEDURE domain.sp_register_payment;
GO

CREATE PROCEDURE domain.sp_register_payment
    @OrderId UNIQUEIDENTIFIER,
    @Amount DECIMAL(18,2),
    @Currency CHAR(3),
    @Method NVARCHAR(30),
    @TransactionRef NVARCHAR(100) = NULL,
    @PaidAt DATETIME2 = NULL,
    @Status NVARCHAR(30) = N'paid'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TranStarted BIT = 0;

    BEGIN TRY
        IF @@TRANCOUNT = 0
        BEGIN
            SET @TranStarted = 1;
            BEGIN TRANSACTION;
        END

        IF NOT EXISTS (SELECT 1 FROM domain.orders WHERE id = @OrderId)
            THROW 50020, N'Order not found.', 1;

        IF @Amount <= 0
            THROW 50021, N'Payment amount must be positive.', 1;

        INSERT INTO domain.payments (
            order_id, amount, currency, method, status, transaction_ref, paid_at)
        VALUES (
            @OrderId, @Amount, @Currency, @Method, @Status, @TransactionRef, COALESCE(@PaidAt, SYSDATETIME()));

        DECLARE @OrderTotal DECIMAL(18,2) = (SELECT total_amount FROM domain.orders WHERE id = @OrderId);
        DECLARE @PaidTotal DECIMAL(18,2) = (
            SELECT ISNULL(SUM(amount), 0) FROM domain.payments WHERE order_id = @OrderId AND status IN (N'paid', N'authorized'));

        IF @PaidTotal >= @OrderTotal AND @OrderTotal > 0
            UPDATE domain.orders SET status = N'completed', updated_at = SYSDATETIME() WHERE id = @OrderId;
        ELSE
            UPDATE domain.orders SET status = N'in_progress', updated_at = SYSDATETIME() WHERE id = @OrderId;

        IF @TranStarted = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @TranStarted = 1 AND @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO

IF OBJECT_ID(N'domain.sp_upsert_client', N'P') IS NOT NULL
    DROP PROCEDURE domain.sp_upsert_client;
GO

CREATE PROCEDURE domain.sp_upsert_client
    @ClientId UNIQUEIDENTIFIER = NULL OUTPUT,
    @UserId UNIQUEIDENTIFIER = NULL,
    @FullName NVARCHAR(200),
    @ContactEmail NVARCHAR(255) = NULL,
    @ContactPhone NVARCHAR(50) = NULL,
    @AddressPlain NVARCHAR(MAX) = NULL,
    @PassportPlain NVARCHAR(MAX) = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @IsVip BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @TranStarted BIT = 0;

    BEGIN TRY
        IF @@TRANCOUNT = 0
        BEGIN
            SET @TranStarted = 1;
            BEGIN TRANSACTION;
        END

        OPEN SYMMETRIC KEY ClientDataKey DECRYPTION BY CERTIFICATE RitualDBCertificate;

        IF @ClientId IS NULL
        BEGIN
            SET @ClientId = NEWID();
            INSERT INTO domain.clients (
                id, user_id, full_name, contact_email, contact_phone,
                address_encrypted, passport_encrypted, notes, is_vip
            )
            VALUES (
                @ClientId, @UserId, @FullName, @ContactEmail, @ContactPhone,
                CASE WHEN @AddressPlain IS NULL THEN NULL ELSE EncryptByKey(Key_GUID(N'ClientDataKey'), @AddressPlain) END,
                CASE WHEN @PassportPlain IS NULL THEN NULL ELSE EncryptByKey(Key_GUID(N'ClientDataKey'), @PassportPlain) END,
                @Notes, @IsVip
            );
        END
        ELSE
        BEGIN
            UPDATE domain.clients
            SET user_id = @UserId,
                full_name = @FullName,
                contact_email = @ContactEmail,
                contact_phone = @ContactPhone,
                address_encrypted = CASE WHEN @AddressPlain IS NULL THEN address_encrypted ELSE EncryptByKey(Key_GUID(N'ClientDataKey'), @AddressPlain) END,
                passport_encrypted = CASE WHEN @PassportPlain IS NULL THEN passport_encrypted ELSE EncryptByKey(Key_GUID(N'ClientDataKey'), @PassportPlain) END,
                notes = @Notes,
                is_vip = @IsVip,
                updated_at = SYSDATETIME()
            WHERE id = @ClientId;
        END

        CLOSE SYMMETRIC KEY ClientDataKey;

        IF @TranStarted = 1
            COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @TranStarted = 1 AND @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        IF EXISTS (SELECT 1 FROM sys.openkeys WHERE key_id = KEY_ID('ClientDataKey'))
            CLOSE SYMMETRIC KEY ClientDataKey;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH;
END;
GO

-- Backup helper
IF OBJECT_ID(N'admin.sp_register_backup', N'P') IS NOT NULL
    DROP PROCEDURE admin.sp_register_backup;
GO

CREATE PROCEDURE admin.sp_register_backup
    @JobName NVARCHAR(100),
    @BackupType NVARCHAR(20),
    @TargetPath NVARCHAR(400),
    @Status NVARCHAR(20),
    @Comments NVARCHAR(400) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM admin.backup_jobs WHERE job_name = @JobName)
    BEGIN
        INSERT INTO admin.backup_jobs (job_name, backup_type, target_path, last_run_at, status, comments)
        VALUES (@JobName, @BackupType, @TargetPath, SYSDATETIME(), @Status, @Comments);
    END
    ELSE
    BEGIN
        UPDATE admin.backup_jobs
        SET backup_type = @BackupType,
            target_path = @TargetPath,
            last_run_at = SYSDATETIME(),
            status = @Status,
            comments = @Comments,
            updated_at = SYSDATETIME()
        WHERE job_name = @JobName;
    END
END;
GO

PRINT N'Programmability objects created.';
GO

