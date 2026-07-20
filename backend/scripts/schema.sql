IF DB_ID('OfficeManagement') IS NULL
BEGIN
    CREATE DATABASE OfficeManagement;
END
GO

USE OfficeManagement;
GO

IF OBJECT_ID('ticket_history', 'U') IS NOT NULL DROP TABLE ticket_history;
IF OBJECT_ID('tickets', 'U') IS NOT NULL DROP TABLE tickets;
IF OBJECT_ID('inventory', 'U') IS NOT NULL DROP TABLE inventory;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
GO

CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    phone NVARCHAR(30) NULL,
    role NVARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Help Desk', 'IT Team', 'Network Team', 'Cybersecurity')),
    password_hash NVARCHAR(255) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Sequence for Sr.No (auto-increment)
IF NOT EXISTS (SELECT * FROM sys.sequences WHERE name = 'inventory_sr_no_seq')
BEGIN
  CREATE SEQUENCE inventory_sr_no_seq START WITH 1 INCREMENT BY 1;
END
GO

CREATE TABLE inventory (
    id INT IDENTITY(1,1) PRIMARY KEY,

    -- Section 1: Basic Information
    sr_no INT NOT NULL DEFAULT (NEXT VALUE FOR inventory_sr_no_seq),
    ministry NVARCHAR(200) NOT NULL,
    department NVARCHAR(200) NOT NULL,
    mdo_location NVARCHAR(200) NULL,
    division NVARCHAR(200) NULL,
    asset_id NVARCHAR(100) NOT NULL,
    asset_category NVARCHAR(100) NOT NULL,
    other_asset_category NVARCHAR(200) NULL,
    serial_number NVARCHAR(200) NULL,

    -- Section 2: Asset Location
    block_name NVARCHAR(200) NOT NULL,
    floor NVARCHAR(100) NOT NULL,
    room NVARCHAR(100) NOT NULL,
    workstation NVARCHAR(100) NOT NULL,

    -- Section 3: Asset Details
    asset_description NVARCHAR(MAX) NULL,
    make_brand_model NVARCHAR(300) NULL,
    purchase_date DATE NULL,
    operating_system NVARCHAR(100) NULL,
    other_operating_system NVARCHAR(100) NULL,
    ip_address NVARCHAR(50) NULL,
    mac_address NVARCHAR(50) NULL,
    network_connection_type NVARCHAR(100) NULL,

    -- Section 4: Security & Management
    edr_installed NVARCHAR(10) NULL,
    reason_no_edr NVARCHAR(MAX) NULL,
    uem_installed NVARCHAR(10) NULL,
    reason_no_uem NVARCHAR(MAX) NULL,

    -- Section 5: Ownership & Assignment
    asset_user NVARCHAR(255) NOT NULL,
    asset_custodian NVARCHAR(255) NOT NULL,
    asset_current_status NVARCHAR(100) NULL,

    -- Section 6: Lifecycle & Support
    date_of_removal DATE NULL,
    installation_date DATE NULL,
    end_of_support_date DATE NULL,
    end_of_life_date DATE NULL,
    amc_warranty NVARCHAR(10) NULL,
    amc_warranty_expiry_date DATE NULL,
    critical NVARCHAR(10) NULL,
    remarks NVARCHAR(MAX) NULL,

    -- Legacy fields (for backward compatibility)
    designation NVARCHAR(200) NULL,
    email NVARCHAR(255) NULL,
    phone NVARCHAR(30) NULL,
    custodian NVARCHAR(255) NULL,

    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

-- Unique constraints: asset_id, serial_number (when present), mac_address (when present)
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UX_inventory_asset_id')
  CREATE UNIQUE INDEX UX_inventory_asset_id ON inventory(asset_id);
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UX_inventory_serial')
  CREATE UNIQUE INDEX UX_inventory_serial ON inventory(serial_number) WHERE serial_number IS NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UX_inventory_mac')
  CREATE UNIQUE INDEX UX_inventory_mac ON inventory(mac_address) WHERE mac_address IS NOT NULL;
GO

IF OBJECT_ID('lookup_values', 'U') IS NOT NULL DROP TABLE lookup_values;
GO

CREATE TABLE lookup_values (
    id INT IDENTITY(1,1) PRIMARY KEY,
    lookup_type NVARCHAR(100) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(100) NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UX_lookup_values_type_name')
  CREATE UNIQUE INDEX UX_lookup_values_type_name ON lookup_values(lookup_type, name);
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'UX_lookup_values_type_code')
  CREATE UNIQUE INDEX UX_lookup_values_type_code ON lookup_values(lookup_type, code);
GO

CREATE TABLE tickets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) NOT NULL CHECK (status IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed')),
    assigned_team NVARCHAR(100) NOT NULL CHECK (assigned_team IN ('IT Help Desk', 'IT Team', 'Network Team', 'Cybersecurity Team')),
    created_by INT NOT NULL,
    inventory_id INT NULL,
    work_notes NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_tickets_users FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT FK_tickets_inventory FOREIGN KEY (inventory_id) REFERENCES inventory(id)
);

CREATE TABLE ticket_history (
    id INT IDENTITY(1,1) PRIMARY KEY,
    ticket_id INT NOT NULL,
    action NVARCHAR(100) NOT NULL,
    from_team NVARCHAR(100) NULL,
    to_team NVARCHAR(100) NULL,
    note NVARCHAR(500) NULL,
    performed_by INT NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_ticket_history_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    CONSTRAINT FK_ticket_history_user FOREIGN KEY (performed_by) REFERENCES users(id)
);

CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_phone ON users(phone);
CREATE INDEX IX_inventory_asset_user ON inventory(asset_user);
CREATE INDEX IX_inventory_email ON inventory(email);
CREATE INDEX IX_inventory_phone ON inventory(phone);
CREATE INDEX IX_tickets_status ON tickets(status);
CREATE INDEX IX_tickets_assigned_team ON tickets(assigned_team);
CREATE INDEX IX_ticket_history_ticket ON ticket_history(ticket_id);
GO
