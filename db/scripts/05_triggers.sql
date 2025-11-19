/*
    Script: 05_triggers.sql
    Purpose: Triggers for audit, validation, and automatic updates.
*/

USE RitualDB;
GO

-- Audit trigger for orders ----------------------------------------------------
IF OBJECT_ID(N'domain.trg_orders_audit', N'TR') IS NOT NULL
    DROP TRIGGER domain.trg_orders_audit;
GO

CREATE TRIGGER domain.trg_orders_audit
ON domain.orders
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @User UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, SESSION_CONTEXT(N'user_id'));
    DECLARE @Action NVARCHAR(100);

    IF EXISTS (SELECT 1 FROM inserted) AND EXISTS (SELECT 1 FROM deleted)
        SET @Action = N'UPDATE';
    ELSE IF EXISTS (SELECT 1 FROM inserted)
        SET @Action = N'INSERT';
    ELSE
        SET @Action = N'DELETE';

    INSERT INTO audit.audit_log (user_id, action, entity, entity_id, before_data, after_data, ip_address, user_agent)
    SELECT
        @User,
        @Action,
        N'order',
        COALESCE(CONVERT(NVARCHAR(100), i.id), CONVERT(NVARCHAR(100), d.id)),
        JSON_QUERY((SELECT d.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)),
        JSON_QUERY((SELECT i.* FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)),
        CONVERT(NVARCHAR(4000), SESSION_CONTEXT(N'ip_address')),
        CONVERT(NVARCHAR(4000), SESSION_CONTEXT(N'user_agent'))
    FROM inserted i
    FULL OUTER JOIN deleted d ON i.id = d.id;
END;
GO

-- Validate payments and enforce order totals ----------------------------------
IF OBJECT_ID(N'domain.trg_payments_validate', N'TR') IS NOT NULL
    DROP TRIGGER domain.trg_payments_validate;
GO

CREATE TRIGGER domain.trg_payments_validate
ON domain.payments
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM inserted WHERE amount <= 0)
    BEGIN
        RAISERROR (N'Payment amount must be positive.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    IF EXISTS (SELECT 1 FROM inserted WHERE status NOT IN (N'pending', N'authorized', N'paid', N'refunded', N'failed'))
    BEGIN
        RAISERROR (N'Invalid payment status.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    DECLARE @OrderId UNIQUEIDENTIFIER;
    SELECT TOP (1) @OrderId = order_id FROM inserted;

    DECLARE @OrderTotal DECIMAL(18,2) = (SELECT total_amount FROM domain.orders WHERE id = @OrderId);
    DECLARE @PaidTotal DECIMAL(18,2) = (
        SELECT ISNULL(SUM(amount), 0)
        FROM domain.payments
        WHERE order_id = @OrderId
          AND status IN (N'paid', N'authorized')
    );

    IF @PaidTotal > @OrderTotal + 0.01
    BEGIN
        RAISERROR (N'Paid amount cannot exceed contract total.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO

-- Inventory availability adjustments -----------------------------------------
IF OBJECT_ID(N'domain.trg_inventory_bookings_adjust', N'TR') IS NOT NULL
    DROP TRIGGER domain.trg_inventory_bookings_adjust;
GO

CREATE TRIGGER domain.trg_inventory_bookings_adjust
ON domain.inventory_bookings
AFTER INSERT, DELETE, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Affected TABLE (inventory_id UNIQUEIDENTIFIER PRIMARY KEY);
    INSERT INTO @Affected (inventory_id)
    SELECT DISTINCT inventory_id FROM inserted
    UNION
    SELECT DISTINCT inventory_id FROM deleted;

    UPDATE inv
    SET quantity_available = inv.quantity_total - ISNULL((
        SELECT SUM(ib.quantity)
        FROM domain.inventory_bookings ib
        INNER JOIN domain.ceremonies ce ON ce.id = ib.ceremony_id
        WHERE ib.inventory_id = inv.id
          AND ce.status IN (N'scheduled', N'draft')
    ), 0)
    FROM domain.inventory inv
    INNER JOIN @Affected a ON a.inventory_id = inv.id;

    IF EXISTS (SELECT 1 FROM domain.inventory WHERE quantity_available < 0)
    BEGIN
        RAISERROR (N'Inventory availability would become negative.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO

PRINT N'Triggers created.';
GO








