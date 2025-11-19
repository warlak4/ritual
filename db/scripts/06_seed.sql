/*
    Script: 06_seed.sql
    Purpose: Seeds reference data and demo dataset for RitualDB.
*/

USE RitualDB;

-- Reference data --------------------------------------------------------------
SET IDENTITY_INSERT ref.roles ON;
MERGE ref.roles AS target
USING (VALUES
    (1, N'admin',  N'Администратор', N'Administrator', N'Full system access'),
    (2, N'client', N'Клиент',        N'Client',        N'Operational staff role'),
    (3, N'guest',  N'Гость',         N'Guest',         N'Read-only access')
) AS src (id, code, name_ru, name_en, description)
ON target.code = src.code
WHEN MATCHED THEN UPDATE SET
    name_ru = src.name_ru,
    name_en = src.name_en,
    description = src.description
WHEN NOT MATCHED THEN
    INSERT (id, code, name_ru, name_en, description)
    VALUES (src.id, src.code, src.name_ru, src.name_en, src.description);
SET IDENTITY_INSERT ref.roles OFF;

MERGE ref.service_categories AS target
USING (VALUES
    (N'FUNERAL',   N'Организация похорон', N'Funeral Planning', 1),
    (N'CREMATION', N'Кремация',            N'Cremation',        2),
    (N'TRANSPORT', N'Транспорт',           N'Transport',        3),
    (N'FLOWERS',   N'Флористика',          N'Floral Services',  4),
    (N'MUSIC',     N'Музыка',              N'Music',            5)
) AS src (code, name_ru, name_en, sort_order)
ON target.code = src.code
WHEN MATCHED THEN UPDATE SET
    name_ru = src.name_ru,
    name_en = src.name_en,
    sort_order = src.sort_order
WHEN NOT MATCHED THEN
    INSERT (code, name_ru, name_en, sort_order)
    VALUES (src.code, src.name_ru, src.name_en, src.sort_order);

-- Users -----------------------------------------------------------------------
DECLARE @AdminId UNIQUEIDENTIFIER = NEWID();
DECLARE @ManagerId UNIQUEIDENTIFIER = NEWID();
DECLARE @GuestId UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.users (id, email, password_hash, first_name, last_name, phone, status)
VALUES
    (@AdminId,   N'admin@ritual.local',   N'$2b$12$ueicBUjWsXIik0Ej.pWHZ.oJE7898qIEehOEM9I0M9stKKVD7e8bq', N'Irina',  N'Smirnova', N'+7-495-000-0001', N'active'),
    (@ManagerId, N'manager@ritual.local', N'$2b$12$4GH18hfN14iYgqA7hrRlSOLu17hepzEepvupL5iRsbppiKtC8evK2', N'Anton',  N'Ivanov',   N'+7-495-000-0002', N'active'),
    (@GuestId,   N'guest@ritual.local',   N'$2b$12$XZ100CMPqkZvV/vlFia3weWluG2cPR4PBcphcgepYAVEzCt09eJI.', N'Guest',  N'User',     NULL,              N'active');

INSERT INTO domain.user_profiles (user_id, preferred_language, theme, date_format, number_format, page_size)
VALUES
    (@AdminId,   N'ru', N'dark',   N'dd.MM.yyyy', N'1 234,56', 25),
    (@ManagerId, N'en', N'light', N'MM/dd/yyyy', N'1,234.56', 20),
    (@GuestId,   N'ru', N'system',N'dd.MM.yyyy', N'1 234,56', 10);

INSERT INTO domain.user_roles (user_id, role_id)
VALUES
    (@AdminId, 1),
    (@ManagerId, 2),
    (@GuestId, 3);

-- Clients and deceased --------------------------------------------------------
OPEN SYMMETRIC KEY ClientDataKey DECRYPTION BY CERTIFICATE RitualDBCertificate;

DECLARE @ClientId UNIQUEIDENTIFIER = NEWID();
DECLARE @Client2Id UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.clients (id, user_id, full_name, contact_email, contact_phone, address_encrypted, passport_encrypted, notes, is_vip)
VALUES
    (@ClientId,  @ManagerId, N'Maria Ivanova', N'maria.ivanova@example.com', N'+7-915-123-4567',
        EncryptByKey(Key_GUID(N'ClientDataKey'), N'Moscow, Lenina 15'),
        EncryptByKey(Key_GUID(N'ClientDataKey'), N'4500 123456'),
        N'Repeat customer', 1),
    (@Client2Id, NULL,        N'John Peterson', N'john.peterson@example.com', N'+1-555-333-1212',
        EncryptByKey(Key_GUID(N'ClientDataKey'), N'Boston, Memorial Ave 10'),
        EncryptByKey(Key_GUID(N'ClientDataKey'), N'US987654321'),
        N'Partner referral', 0);

DECLARE @Deceased1 UNIQUEIDENTIFIER = NEWID();
DECLARE @Deceased2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.deceased (id, client_id, full_name, birth_date, death_date, cause_of_death, burial_type, religion, bio)
VALUES
    (@Deceased1, @ClientId,  N'Sergey Ivanov', '1950-01-12', '2025-02-10', N'Natural causes', N'burial',    N'Orthodox',   N'Engineer, family man'),
    (@Deceased2, @Client2Id, N'Elizabeth Peterson', '1945-05-03', '2025-03-22', N'Natural causes', N'cremation', N'Protestant', N'Teacher, community leader');

CLOSE SYMMETRIC KEY ClientDataKey;

-- Services --------------------------------------------------------------------
DECLARE @ServiceFuneral UNIQUEIDENTIFIER = NEWID();
DECLARE @ServiceHearse UNIQUEIDENTIFIER = NEWID();
DECLARE @ServiceFlower UNIQUEIDENTIFIER = NEWID();
DECLARE @ServiceMusic UNIQUEIDENTIFIER = NEWID();
DECLARE @ServiceCremation UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.services (id, code, category_id, name_ru, name_en, description_ru, description_en, base_price, currency)
VALUES
    (@ServiceFuneral,  N'FUNERAL_STD',  (SELECT id FROM ref.service_categories WHERE code = N'FUNERAL'),   N'Похоронное сопровождение', N'Funeral arrangement', N'Подготовка документов, церемония, координация', N'Paperwork, ceremony, coordination', 75000, N'RUB'),
    (@ServiceHearse,   N'TRANS_HEARSE', (SELECT id FROM ref.service_categories WHERE code = N'TRANSPORT'), N'Катафалк',                 N'Hearse transport',    N'Перевозка в пределах города',                     N'City transportation',                         15000, N'RUB'),
    (@ServiceFlower,   N'FLOWERS_PREM', (SELECT id FROM ref.service_categories WHERE code = N'FLOWERS'),   N'Флоральное оформление',    N'Floral design',       N'Композиции, венки, свечи',                       N'Flower arrangements and candles',              32000, N'RUB'),
    (@ServiceMusic,    N'MUSIC_QUART',  (SELECT id FROM ref.service_categories WHERE code = N'MUSIC'),     N'Струнный квартет',         N'String quartet',      N'Живая музыка, 60 минут',                        N'Live music for 60 minutes',                  18000, N'RUB'),
    (@ServiceCremation,N'CREMATION_STD',(SELECT id FROM ref.service_categories WHERE code = N'CREMATION'), N'Кремация стандарт',        N'Cremation standard',  N'Оформление, организация кремации',              N'Cremation scheduling and paperwork',          55000, N'RUB');

-- Packages --------------------------------------------------------------------
DECLARE @PackagePremium UNIQUEIDENTIFIER = NEWID();
DECLARE @PackageCremation UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.service_packages (id, code, name_ru, name_en, description_ru, description_en, base_price, currency)
VALUES
    (@PackagePremium,  N'PREMIUM_BURIAL',  N'Премиум похороны',    N'Premium burial',   N'Расширенный пакет с VIP сопровождением', N'Extended services with VIP assistance', 180000, N'RUB'),
    (@PackageCremation,N'CREMATION_PLUS',  N'Кремация плюс',       N'Cremation plus',   N'Кремация, транспорт, музыка, флористика', N'Cremation + transport + music + flowers', 145000, N'RUB');

INSERT INTO domain.package_services (package_id, service_id, quantity)
VALUES
    (@PackagePremium,  @ServiceFuneral,   1),
    (@PackagePremium,  @ServiceHearse,    1),
    (@PackagePremium,  @ServiceFlower,    1),
    (@PackagePremium,  @ServiceMusic,     1),
    (@PackageCremation,@ServiceCremation, 1),
    (@PackageCremation,@ServiceHearse,    1),
    (@PackageCremation,@ServiceFlower,    1);

-- Locations, staff, vehicles, inventory ---------------------------------------
DECLARE @LocationHall UNIQUEIDENTIFIER = NEWID();
DECLARE @LocationCrem UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.locations (id, type, name, address, contact_phone, capacity, is_partner)
VALUES
    (@LocationHall, N'chapel',      N'Прощальный зал "Веста"',  N'Moscow, Peace ave 5',         N'+7-495-111-2233', 80, 1),
    (@LocationCrem, N'crematorium', N'Крематорий "Южный"',      N'Moscow, South st 8',          N'+7-495-222-3344', 120, 1);

DECLARE @StaffDirector UNIQUEIDENTIFIER = NEWID();
DECLARE @StaffMC UNIQUEIDENTIFIER = NEWID();
DECLARE @StaffDriver UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.staff (id, user_id, full_name, role, phone, email, external_company)
VALUES
    (@StaffDirector, @AdminId, N'Irina Smirnova',   N'Director',        N'+7-495-333-4455', N'director@ritual.local', NULL),
    (@StaffMC,       NULL,     N'Maxim Lebedev',    N'Ceremony master', N'+7-495-777-8899', N'master@partners.ru',    N'Partners LLC'),
    (@StaffDriver,   NULL,     N'Alexey Gavrilov',  N'Driver',          N'+7-495-666-7788', N'driver@transport.ru',   N'Transport Corp');

DECLARE @VehicleHearse UNIQUEIDENTIFIER = NEWID();
DECLARE @VehicleBus UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.vehicles (id, plate_number, type, capacity)
VALUES
    (@VehicleHearse, N'А777АА197', N'hearse', 6),
    (@VehicleBus,   N'В555ВВ197', N'bus',   18);

DECLARE @InventoryUrn UNIQUEIDENTIFIER = NEWID();
DECLARE @InventoryWreath UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.inventory (id, name, sku, category, quantity_total, quantity_available)
VALUES
    (@InventoryUrn,    N'Урна гранитная',     N'URN-ELITE-001',  N'Urns',    25, 25),
    (@InventoryWreath, N'Венок мемориальный', N'WREATH-MEM-045', N'Wreaths', 100, 100);

-- Orders & ceremonies ---------------------------------------------------------
DECLARE @Order1 UNIQUEIDENTIFIER;
DECLARE @ServicesOrder1 domain.udt_OrderService;

INSERT INTO @ServicesOrder1 (service_id, quantity, unit_price, discount)
VALUES
    (@ServiceFuneral, 1, 75000, 0),
    (@ServiceHearse,  1, 15000, 0),
    (@ServiceFlower,  1, 32000, 2000);

EXEC domain.sp_create_order
    @ClientId = @ClientId,
    @DeceasedId = @Deceased1,
    @ResponsibleUserId = @AdminId,
    @PackageId = @PackagePremium,
    @Currency = N'RUB',
    @Services = @ServicesOrder1,
    @ContractNumber = N'RIT-2025-0001',
    @OrderId = @Order1 OUTPUT;

UPDATE domain.orders SET status = N'confirmed' WHERE id = @Order1;

DECLARE @Ceremony1 UNIQUEIDENTIFIER = NEWID();

INSERT INTO domain.ceremonies (id, order_id, location_id, start_at, end_at, status, notes)
VALUES
    (@Ceremony1, @Order1, @LocationHall, '2025-03-01T11:00:00', '2025-03-01T13:00:00', N'scheduled', N'VIP hall, closed family ceremony');

DECLARE @StaffAssign domain.udt_AssignStaff;
INSERT INTO @StaffAssign (staff_id, role, notes)
VALUES
    (@StaffDirector, N'Director', N'Supervises ceremony'),
    (@StaffMC,       N'Master',   N'Leads ceremony script');

DECLARE @VehicleAssign domain.udt_AssignVehicle;
INSERT INTO @VehicleAssign (vehicle_id, driver_id, start_at, end_at, notes)
VALUES
    (@VehicleHearse, @StaffDriver, '2025-03-01T09:30:00', '2025-03-01T14:30:00', N'Hearse with driver'),
    (@VehicleBus,    NULL,         '2025-03-01T10:30:00', '2025-03-01T15:30:00', N'Family shuttle');

DECLARE @InventoryAssign domain.udt_AssignInventory;
INSERT INTO @InventoryAssign (inventory_id, quantity, notes)
VALUES
    (@InventoryWreath, 10, N'Hall decoration'),
    (@InventoryUrn,     1, N'Reserved in advance');

EXEC domain.sp_assign_ceremony_resources
    @CeremonyId = @Ceremony1,
    @Staff = @StaffAssign,
    @Vehicles = @VehicleAssign,
    @Inventory = @InventoryAssign;

EXEC domain.sp_register_payment
    @OrderId = @Order1,
    @Amount = 50000,
    @Currency = N'RUB',
    @Method = N'cash',
    @TransactionRef = N'POS-00231',
    @Status = N'paid';

EXEC domain.sp_register_payment
    @OrderId = @Order1,
    @Amount = 70000,
    @Currency = N'RUB',
    @Method = N'card',
    @TransactionRef = N'POS-00232',
    @Status = N'paid';
