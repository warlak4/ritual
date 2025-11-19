/*
    Script: 02_views.sql
    Purpose: Creates reporting views for RitualDB.
*/

USE RitualDB;
GO

IF OBJECT_ID(N'domain.vw_active_orders', N'V') IS NOT NULL
    DROP VIEW domain.vw_active_orders;
GO

CREATE VIEW domain.vw_active_orders AS
SELECT
    o.id,
    o.contract_number,
    o.status,
    o.total_amount,
    o.currency,
    o.created_at,
    c.full_name         AS client_name,
    u.first_name + N' ' + u.last_name AS manager_name,
    d.full_name         AS deceased_name,
    COUNT(os.service_id) AS services_count
FROM domain.orders o
INNER JOIN domain.clients c ON c.id = o.client_id
INNER JOIN domain.deceased d ON d.id = o.deceased_id
LEFT JOIN domain.users u ON u.id = o.responsible_user_id
LEFT JOIN domain.order_services os ON os.order_id = o.id
WHERE o.status IN (N'pending', N'confirmed', N'in_progress')
GROUP BY
    o.id, o.contract_number, o.status, o.total_amount, o.currency, o.created_at,
    c.full_name, u.first_name, u.last_name, d.full_name;
GO

IF OBJECT_ID(N'domain.vw_ceremony_schedule', N'V') IS NOT NULL
    DROP VIEW domain.vw_ceremony_schedule;
GO

CREATE VIEW domain.vw_ceremony_schedule AS
SELECT
    ce.id,
    ce.start_at,
    ce.end_at,
    ce.status,
    ce.notes,
    lo.name AS location_name,
    lo.type AS location_type,
    lo.address,
    ord.contract_number,
    cl.full_name AS client_name,
    dc.full_name AS deceased_name
FROM domain.ceremonies ce
INNER JOIN domain.locations lo ON lo.id = ce.location_id
INNER JOIN domain.orders ord ON ord.id = ce.order_id
INNER JOIN domain.clients cl ON cl.id = ord.client_id
INNER JOIN domain.deceased dc ON dc.id = ord.deceased_id;
GO

IF OBJECT_ID(N'domain.vw_financial_summary', N'V') IS NOT NULL
    DROP VIEW domain.vw_financial_summary;
GO

CREATE VIEW domain.vw_financial_summary AS
SELECT
    ord.id AS order_id,
    ord.contract_number,
    ord.status,
    SUM(pay.amount) AS amount_paid,
    COUNT(CASE WHEN pay.status = N'paid' THEN 1 END) AS paid_transactions,
    MIN(pay.paid_at) AS first_payment_at,
    MAX(pay.paid_at) AS last_payment_at
FROM domain.orders ord
LEFT JOIN domain.payments pay ON pay.order_id = ord.id
GROUP BY ord.id, ord.contract_number, ord.status;
GO

IF OBJECT_ID(N'domain.vw_inventory_load', N'V') IS NOT NULL
    DROP VIEW domain.vw_inventory_load;
GO

CREATE VIEW domain.vw_inventory_load AS
SELECT
    inv.id        AS inventory_id,
    inv.name,
    inv.category,
    inv.quantity_total,
    inv.quantity_available,
    SUM(CASE WHEN ce.start_at >= SYSDATETIME() THEN ib.quantity ELSE 0 END) AS booked_upcoming,
    SUM(CASE WHEN ce.start_at < SYSDATETIME() THEN ib.quantity ELSE 0 END) AS booked_past
FROM domain.inventory inv
LEFT JOIN domain.inventory_bookings ib ON ib.inventory_id = inv.id
LEFT JOIN domain.ceremonies ce ON ce.id = ib.ceremony_id
GROUP BY inv.id, inv.name, inv.category, inv.quantity_total, inv.quantity_available;
GO

IF OBJECT_ID(N'domain.vw_clients_secure', N'V') IS NOT NULL
    DROP VIEW domain.vw_clients_secure;
GO

CREATE VIEW domain.vw_clients_secure
AS
SELECT
    cl.id,
    cl.full_name,
    cl.contact_email,
    cl.contact_phone,
    CONVERT(NVARCHAR(MAX),
        DecryptByKeyAutoCert(CERT_ID(N'RitualDBCertificate'), NULL, cl.address_encrypted)
    ) AS address_plain,
    CONVERT(NVARCHAR(MAX),
        DecryptByKeyAutoCert(CERT_ID(N'RitualDBCertificate'), NULL, cl.passport_encrypted)
    ) AS passport_plain,
    cl.notes,
    cl.is_vip,
    cl.created_at,
    cl.updated_at
FROM domain.clients cl;
GO

PRINT N'Views created.';
GO

