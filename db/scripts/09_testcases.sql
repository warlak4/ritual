/*
    Script: 09_testcases.sql
    Purpose: SQL snippets used in automated/manual testing to validate data integrity.
*/

USE RitualDB;
GO

-- Test 1: CRUD cycle for orders
SELECT TOP (5) * FROM domain.orders ORDER BY created_at DESC;

-- Test 2: Verify RBAC masks sensitive data (run under guest login to ensure DENY works)
SELECT client_id, address_encrypted, passport_encrypted FROM domain.clients;

-- Test 3: Validate audit entries exist after seeding
SELECT TOP (10) * FROM audit.audit_log ORDER BY created_at DESC;

-- Test 4: Ensure ceremony schedule view returns joined dataset
SELECT * FROM domain.vw_ceremony_schedule WHERE start_at >= SYSDATETIME();

-- Test 5: Validate function for order totals
SELECT o.id, domain.fn_order_total(o.id) AS calculated_total, o.total_amount
FROM domain.orders o;

-- Test 6: Inventory availability check
SELECT * FROM domain.vw_inventory_load;

-- Test 7: Payment validation (should not exceed total)
BEGIN TRY
    EXEC domain.sp_register_payment
        @OrderId = (SELECT TOP 1 id FROM domain.orders ORDER BY created_at DESC),
        @Amount = 999999,
        @Currency = N'RUB',
        @Method = N'test',
        @Status = N'paid';
END TRY
BEGIN CATCH
    SELECT ERROR_NUMBER() AS error_number, ERROR_MESSAGE() AS error_message;
END CATCH;

ROLLBACK TRANSACTION; -- Ensure the previous test does not persist data if run within explicit transaction.

