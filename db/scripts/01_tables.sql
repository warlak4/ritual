/*
    Script: 01_tables.sql
    Purpose: Creates tables, constraints and indexes for RitualDB.
*/

USE RitualDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

IF OBJECT_ID(N'ref.roles', N'U') IS NULL
BEGIN
    CREATE TABLE ref.roles (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        code            NVARCHAR(50)  NOT NULL,
        name_ru         NVARCHAR(100) NOT NULL,
        name_en         NVARCHAR(100) NOT NULL,
        description     NVARCHAR(400) NULL,
        created_at      DATETIME2      NOT NULL CONSTRAINT DF_roles_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_roles_code UNIQUE (code)
    );
END;
GO

IF OBJECT_ID(N'domain.users', N'U') IS NULL
BEGIN
    CREATE TABLE domain.users (
        id               UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        email            NVARCHAR(255) NOT NULL,
        password_hash    NVARCHAR(255) NOT NULL,
        first_name       NVARCHAR(120) NOT NULL,
        last_name        NVARCHAR(120) NOT NULL,
        phone            NVARCHAR(50)  NULL,
        status           NVARCHAR(20)  NOT NULL,
        last_login_at    DATETIME2      NULL,
        created_at       DATETIME2      NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2      NULL,
        deleted_at       DATETIME2      NULL,
        CONSTRAINT CHK_users_status CHECK (status IN (N'active', N'pending', N'blocked')),
        CONSTRAINT UQ_users_email UNIQUE (email)
    );
END;
GO

IF OBJECT_ID(N'domain.user_profiles', N'U') IS NULL
BEGIN
    CREATE TABLE domain.user_profiles (
        user_id          UNIQUEIDENTIFIER PRIMARY KEY
                         CONSTRAINT FK_user_profiles_user REFERENCES domain.users(id),
        preferred_language NVARCHAR(5) NOT NULL CONSTRAINT DF_user_profiles_language DEFAULT N'ru',
        theme            NVARCHAR(30)  NOT NULL CONSTRAINT DF_user_profiles_theme DEFAULT N'dark',
        date_format      NVARCHAR(30)  NOT NULL CONSTRAINT DF_user_profiles_date_format DEFAULT N'dd.MM.yyyy',
        number_format    NVARCHAR(15)  NOT NULL CONSTRAINT DF_user_profiles_number_format DEFAULT N'1 234,56',
        page_size        INT           NOT NULL CONSTRAINT DF_user_profiles_page_size DEFAULT 20,
        saved_filters    NVARCHAR(MAX) NULL,
        created_at       DATETIME2     NOT NULL CONSTRAINT DF_user_profiles_created_at DEFAULT SYSDATETIME(),
        updated_at       DATETIME2     NULL
    );
END;
GO

IF OBJECT_ID(N'domain.user_roles', N'U') IS NULL
BEGIN
    CREATE TABLE domain.user_roles (
        user_id UNIQUEIDENTIFIER NOT NULL,
        role_id INT NOT NULL,
        assigned_at DATETIME2 NOT NULL CONSTRAINT DF_user_roles_assigned DEFAULT SYSDATETIME(),
        CONSTRAINT PK_user_roles PRIMARY KEY (user_id, role_id),
        CONSTRAINT FK_user_roles_user FOREIGN KEY (user_id) REFERENCES domain.users(id),
        CONSTRAINT FK_user_roles_role FOREIGN KEY (role_id) REFERENCES ref.roles(id)
    );
END;
GO

IF OBJECT_ID(N'domain.clients', N'U') IS NULL
BEGIN
    CREATE TABLE domain.clients (
        id                UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        user_id           UNIQUEIDENTIFIER NULL
                          CONSTRAINT FK_clients_user REFERENCES domain.users(id),
        full_name         NVARCHAR(200) NOT NULL,
        contact_email     NVARCHAR(255) NULL,
        contact_phone     NVARCHAR(50)  NULL,
        address_encrypted VARBINARY(MAX) NULL,
        passport_encrypted VARBINARY(MAX) NULL,
        notes             NVARCHAR(MAX) NULL,
        is_vip            BIT NOT NULL CONSTRAINT DF_clients_is_vip DEFAULT 0,
        created_at        DATETIME2 NOT NULL CONSTRAINT DF_clients_created_at DEFAULT SYSDATETIME(),
        updated_at        DATETIME2 NULL
    );
END;
GO

IF OBJECT_ID(N'domain.deceased', N'U') IS NULL
BEGIN
    CREATE TABLE domain.deceased (
        id           UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        client_id    UNIQUEIDENTIFIER NOT NULL
                     CONSTRAINT FK_deceased_client REFERENCES domain.clients(id),
        full_name    NVARCHAR(200) NOT NULL,
        birth_date   DATE NULL,
        death_date   DATE NOT NULL,
        cause_of_death NVARCHAR(200) NULL,
        burial_type  NVARCHAR(20) NOT NULL,
        religion     NVARCHAR(100) NULL,
        bio          NVARCHAR(MAX) NULL,
        created_at   DATETIME2 NOT NULL CONSTRAINT DF_deceased_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT CHK_deceased_burial_type CHECK (burial_type IN (N'burial', N'cremation', N'other'))
    );
END;
GO

IF OBJECT_ID(N'ref.service_categories', N'U') IS NULL
BEGIN
    CREATE TABLE ref.service_categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        code NVARCHAR(50) NOT NULL CONSTRAINT UQ_service_categories_code UNIQUE,
        name_ru NVARCHAR(100) NOT NULL,
        name_en NVARCHAR(100) NOT NULL,
        sort_order INT NOT NULL CONSTRAINT DF_service_categories_sort DEFAULT 0
    );
END;
GO

IF OBJECT_ID(N'domain.services', N'U') IS NULL
BEGIN
    CREATE TABLE domain.services (
        id              UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        code            NVARCHAR(50) NOT NULL,
        category_id     INT NOT NULL CONSTRAINT FK_services_category REFERENCES ref.service_categories(id),
        name_ru         NVARCHAR(150) NOT NULL,
        name_en         NVARCHAR(150) NOT NULL,
        description_ru  NVARCHAR(MAX) NULL,
        description_en  NVARCHAR(MAX) NULL,
        base_price      DECIMAL(18,2) NOT NULL,
        currency        CHAR(3) NOT NULL,
        is_active       BIT NOT NULL CONSTRAINT DF_services_is_active DEFAULT 1,
        created_at      DATETIME2 NOT NULL CONSTRAINT DF_services_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2 NULL,
        CONSTRAINT UQ_services_code UNIQUE (code),
        CONSTRAINT CHK_services_price CHECK (base_price >= 0)
    );
END;
GO

IF OBJECT_ID(N'domain.service_packages', N'U') IS NULL
BEGIN
    CREATE TABLE domain.service_packages (
        id              UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        code            NVARCHAR(50) NOT NULL,
        name_ru         NVARCHAR(150) NOT NULL,
        name_en         NVARCHAR(150) NOT NULL,
        description_ru  NVARCHAR(MAX) NULL,
        description_en  NVARCHAR(MAX) NULL,
        base_price      DECIMAL(18,2) NOT NULL,
        currency        CHAR(3) NOT NULL,
        is_active       BIT NOT NULL CONSTRAINT DF_packages_is_active DEFAULT 1,
        created_at      DATETIME2 NOT NULL CONSTRAINT DF_packages_created_at DEFAULT SYSDATETIME(),
        updated_at      DATETIME2 NULL,
        CONSTRAINT UQ_service_packages_code UNIQUE (code),
        CONSTRAINT CHK_service_packages_price CHECK (base_price >= 0)
    );
END;
GO

IF OBJECT_ID(N'domain.package_services', N'U') IS NULL
BEGIN
    CREATE TABLE domain.package_services (
        package_id UNIQUEIDENTIFIER NOT NULL,
        service_id UNIQUEIDENTIFIER NOT NULL,
        quantity   DECIMAL(10,2) NOT NULL CONSTRAINT DF_package_services_quantity DEFAULT 1,
        CONSTRAINT PK_package_services PRIMARY KEY (package_id, service_id),
        CONSTRAINT FK_package_services_package FOREIGN KEY (package_id) REFERENCES domain.service_packages(id),
        CONSTRAINT FK_package_services_service FOREIGN KEY (service_id) REFERENCES domain.services(id),
        CONSTRAINT CHK_package_services_quantity CHECK (quantity > 0)
    );
END;
GO

IF OBJECT_ID(N'domain.orders', N'U') IS NULL
BEGIN
    CREATE TABLE domain.orders (
        id                  UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        client_id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_orders_client REFERENCES domain.clients(id),
        responsible_user_id UNIQUEIDENTIFIER NULL CONSTRAINT FK_orders_responsible REFERENCES domain.users(id),
        deceased_id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_orders_deceased REFERENCES domain.deceased(id),
        package_id          UNIQUEIDENTIFIER NULL CONSTRAINT FK_orders_package REFERENCES domain.service_packages(id),
        status              NVARCHAR(30) NOT NULL,
        total_amount        DECIMAL(18,2) NOT NULL,
        currency            CHAR(3) NOT NULL,
        contract_number     NVARCHAR(50) NULL,
        created_at          DATETIME2 NOT NULL CONSTRAINT DF_orders_created_at DEFAULT SYSDATETIME(),
        updated_at          DATETIME2 NULL,
        deleted_at          DATETIME2 NULL,
        CONSTRAINT CHK_orders_status CHECK (status IN (N'draft', N'pending', N'confirmed', N'in_progress', N'completed', N'cancelled')),
        CONSTRAINT CHK_orders_total CHECK (total_amount >= 0)
    );
END;
GO

IF OBJECT_ID(N'domain.order_services', N'U') IS NULL
BEGIN
    CREATE TABLE domain.order_services (
        order_id    UNIQUEIDENTIFIER NOT NULL,
        service_id  UNIQUEIDENTIFIER NOT NULL,
        quantity    DECIMAL(10,2) NOT NULL CONSTRAINT DF_order_services_quantity DEFAULT 1,
        unit_price  DECIMAL(18,2) NOT NULL,
        discount    DECIMAL(18,2) NOT NULL CONSTRAINT DF_order_services_discount DEFAULT 0,
        notes       NVARCHAR(500) NULL,
        CONSTRAINT PK_order_services PRIMARY KEY (order_id, service_id),
        CONSTRAINT FK_order_services_order FOREIGN KEY (order_id) REFERENCES domain.orders(id),
        CONSTRAINT FK_order_services_service FOREIGN KEY (service_id) REFERENCES domain.services(id),
        CONSTRAINT CHK_order_services_quantity CHECK (quantity > 0),
        CONSTRAINT CHK_order_services_price CHECK (unit_price >= 0),
        CONSTRAINT CHK_order_services_discount CHECK (discount >= 0)
    );
END;
GO

IF OBJECT_ID(N'domain.locations', N'U') IS NULL
BEGIN
    CREATE TABLE domain.locations (
        id             UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        type           NVARCHAR(30) NOT NULL,
        name           NVARCHAR(200) NOT NULL,
        address        NVARCHAR(300) NOT NULL,
        contact_phone  NVARCHAR(50)  NULL,
        capacity       INT NULL,
        is_partner     BIT NOT NULL CONSTRAINT DF_locations_is_partner DEFAULT 0,
        created_at     DATETIME2 NOT NULL CONSTRAINT DF_locations_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT CHK_locations_type CHECK (type IN (N'funeral_home', N'cemetery', N'crematorium', N'chapel', N'restaurant', N'other'))
    );
END;
GO

IF OBJECT_ID(N'domain.ceremonies', N'U') IS NULL
BEGIN
    CREATE TABLE domain.ceremonies (
        id           UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        order_id     UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ceremonies_order REFERENCES domain.orders(id),
        location_id  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ceremonies_location REFERENCES domain.locations(id),
        start_at     DATETIME2 NOT NULL,
        end_at       DATETIME2 NOT NULL,
        status       NVARCHAR(30) NOT NULL,
        notes        NVARCHAR(MAX) NULL,
        created_at   DATETIME2 NOT NULL CONSTRAINT DF_ceremonies_created_at DEFAULT SYSDATETIME(),
        updated_at   DATETIME2 NULL,
        CONSTRAINT CHK_ceremonies_dates CHECK (start_at < end_at),
        CONSTRAINT CHK_ceremonies_status CHECK (status IN (N'draft', N'scheduled', N'completed', N'cancelled'))
    );
END;
GO

IF OBJECT_ID(N'domain.staff', N'U') IS NULL
BEGIN
    CREATE TABLE domain.staff (
        id               UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        user_id          UNIQUEIDENTIFIER NULL CONSTRAINT FK_staff_user REFERENCES domain.users(id),
        full_name        NVARCHAR(200) NOT NULL,
        role             NVARCHAR(100) NOT NULL,
        phone            NVARCHAR(50)  NULL,
        email            NVARCHAR(255) NULL,
        external_company NVARCHAR(200) NULL,
        is_active        BIT NOT NULL CONSTRAINT DF_staff_is_active DEFAULT 1,
        created_at       DATETIME2 NOT NULL CONSTRAINT DF_staff_created_at DEFAULT SYSDATETIME()
    );
END;
GO

IF OBJECT_ID(N'domain.staff_assignments', N'U') IS NULL
BEGIN
    CREATE TABLE domain.staff_assignments (
        ceremony_id UNIQUEIDENTIFIER NOT NULL,
        staff_id    UNIQUEIDENTIFIER NOT NULL,
        role        NVARCHAR(100) NOT NULL,
        notes       NVARCHAR(400) NULL,
        assigned_at DATETIME2 NOT NULL CONSTRAINT DF_staff_assignments_assigned DEFAULT SYSDATETIME(),
        CONSTRAINT PK_staff_assignments PRIMARY KEY (ceremony_id, staff_id),
        CONSTRAINT FK_staff_assignments_ceremony FOREIGN KEY (ceremony_id) REFERENCES domain.ceremonies(id),
        CONSTRAINT FK_staff_assignments_staff FOREIGN KEY (staff_id) REFERENCES domain.staff(id)
    );
END;
GO

IF OBJECT_ID(N'domain.vehicles', N'U') IS NULL
BEGIN
    CREATE TABLE domain.vehicles (
        id            UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        plate_number  NVARCHAR(20) NOT NULL,
        type          NVARCHAR(50) NOT NULL,
        capacity      INT NULL,
        is_active     BIT NOT NULL CONSTRAINT DF_vehicles_is_active DEFAULT 1,
        created_at    DATETIME2 NOT NULL CONSTRAINT DF_vehicles_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT UQ_vehicles_plate UNIQUE (plate_number)
    );
END;
GO

IF OBJECT_ID(N'domain.vehicle_bookings', N'U') IS NULL
BEGIN
    CREATE TABLE domain.vehicle_bookings (
        ceremony_id UNIQUEIDENTIFIER NOT NULL,
        vehicle_id  UNIQUEIDENTIFIER NOT NULL,
        driver_id   UNIQUEIDENTIFIER NULL CONSTRAINT FK_vehicle_bookings_driver REFERENCES domain.staff(id),
        start_at    DATETIME2 NOT NULL,
        end_at      DATETIME2 NOT NULL,
        notes       NVARCHAR(400) NULL,
        CONSTRAINT PK_vehicle_bookings PRIMARY KEY (ceremony_id, vehicle_id),
        CONSTRAINT FK_vehicle_bookings_ceremony FOREIGN KEY (ceremony_id) REFERENCES domain.ceremonies(id),
        CONSTRAINT FK_vehicle_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES domain.vehicles(id),
        CONSTRAINT CHK_vehicle_bookings_dates CHECK (start_at < end_at)
    );
END;
GO

IF OBJECT_ID(N'domain.inventory', N'U') IS NULL
BEGIN
    CREATE TABLE domain.inventory (
        id                 UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        name               NVARCHAR(200) NOT NULL,
        sku                NVARCHAR(100) NOT NULL,
        category           NVARCHAR(100) NOT NULL,
        quantity_total     INT NOT NULL,
        quantity_available INT NOT NULL,
        created_at         DATETIME2 NOT NULL CONSTRAINT DF_inventory_created_at DEFAULT SYSDATETIME(),
        is_active          BIT NOT NULL CONSTRAINT DF_inventory_is_active DEFAULT 1,
        CONSTRAINT UQ_inventory_sku UNIQUE (sku),
        CONSTRAINT CHK_inventory_quantities CHECK (quantity_total >= 0 AND quantity_available >= 0 AND quantity_total >= quantity_available)
    );
END;
GO

IF OBJECT_ID(N'domain.inventory_bookings', N'U') IS NULL
BEGIN
    CREATE TABLE domain.inventory_bookings (
        ceremony_id UNIQUEIDENTIFIER NOT NULL,
        inventory_id UNIQUEIDENTIFIER NOT NULL,
        quantity    INT NOT NULL,
        notes       NVARCHAR(400) NULL,
        booked_at   DATETIME2 NOT NULL CONSTRAINT DF_inventory_bookings_booked_at DEFAULT SYSDATETIME(),
        CONSTRAINT PK_inventory_bookings PRIMARY KEY (ceremony_id, inventory_id),
        CONSTRAINT FK_inventory_bookings_ceremony FOREIGN KEY (ceremony_id) REFERENCES domain.ceremonies(id),
        CONSTRAINT FK_inventory_bookings_inventory FOREIGN KEY (inventory_id) REFERENCES domain.inventory(id),
        CONSTRAINT CHK_inventory_bookings_quantity CHECK (quantity > 0)
    );
END;
GO

IF OBJECT_ID(N'domain.payments', N'U') IS NULL
BEGIN
    CREATE TABLE domain.payments (
        id             UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        order_id       UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_payments_order REFERENCES domain.orders(id),
        amount         DECIMAL(18,2) NOT NULL,
        currency       CHAR(3) NOT NULL,
        method         NVARCHAR(30) NOT NULL,
        status         NVARCHAR(30) NOT NULL,
        transaction_ref NVARCHAR(100) NULL,
        paid_at        DATETIME2 NULL,
        receipt_url    NVARCHAR(400) NULL,
        created_at     DATETIME2 NOT NULL CONSTRAINT DF_payments_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT CHK_payments_amount CHECK (amount >= 0),
        CONSTRAINT CHK_payments_status CHECK (status IN (N'pending', N'authorized', N'paid', N'refunded', N'failed'))
    );
END;
GO

IF OBJECT_ID(N'domain.documents', N'U') IS NULL
BEGIN
    CREATE TABLE domain.documents (
        id            UNIQUEIDENTIFIER DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        order_id      UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_documents_order REFERENCES domain.orders(id),
        type          NVARCHAR(50) NOT NULL,
        title         NVARCHAR(200) NOT NULL,
        file_path     NVARCHAR(500) NOT NULL,
        generated_at  DATETIME2 NOT NULL,
        sign_status   NVARCHAR(20) NOT NULL,
        created_at    DATETIME2 NOT NULL CONSTRAINT DF_documents_created_at DEFAULT SYSDATETIME(),
        CONSTRAINT CHK_documents_sign_status CHECK (sign_status IN (N'draft', N'signed', N'pending', N'cancelled'))
    );
END;
GO

IF OBJECT_ID(N'audit.audit_log', N'U') IS NULL
BEGIN
    CREATE TABLE audit.audit_log (
        id            BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id       UNIQUEIDENTIFIER NULL,
        action        NVARCHAR(100) NOT NULL,
        entity        NVARCHAR(100) NOT NULL,
        entity_id     NVARCHAR(100) NOT NULL,
        before_data   NVARCHAR(MAX) NULL,
        after_data    NVARCHAR(MAX) NULL,
        ip_address    NVARCHAR(45) NULL,
        user_agent    NVARCHAR(400) NULL,
        created_at    DATETIME2 NOT NULL CONSTRAINT DF_audit_log_created_at DEFAULT SYSDATETIME()
    );
END;
GO

IF OBJECT_ID(N'admin.backup_jobs', N'U') IS NULL
BEGIN
    CREATE TABLE admin.backup_jobs (
        id           INT IDENTITY(1,1) PRIMARY KEY,
        job_name     NVARCHAR(100) NOT NULL,
        backup_type  NVARCHAR(20) NOT NULL,
        target_path  NVARCHAR(400) NOT NULL,
        last_run_at  DATETIME2 NULL,
        status       NVARCHAR(20) NOT NULL,
        comments     NVARCHAR(400) NULL,
        created_at   DATETIME2 NOT NULL CONSTRAINT DF_backup_jobs_created_at DEFAULT SYSDATETIME(),
        updated_at   DATETIME2 NULL,
        CONSTRAINT CHK_backup_jobs_type CHECK (backup_type IN (N'full', N'diff', N'log')),
        CONSTRAINT CHK_backup_jobs_status CHECK (status IN (N'pending', N'running', N'success', N'failed'))
    );
END;
GO

PRINT N'Table creation script completed.';
GO

