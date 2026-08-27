-- ============================================================
-- IT Asset & Ticket Management System
-- PostgreSQL Schema DDL
-- Generated: 2026-08-25
-- Source:  backend/scripts/schema.sql  (MSSQL → PG migration)
-- ============================================================

-- 1. Custom Sequences
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS inventory_sr_no_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- 2. Users Table
-- ============================================================

CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) NOT NULL,
    phone       VARCHAR(30),
    role        VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_role CHECK (
        role IN ('Admin', 'Help Desk', 'IT Team', 'Network Team', 'Cybersecurity')
    )
);

CREATE UNIQUE INDEX UX_users_email ON users (email);
CREATE INDEX IX_users_phone ON users (phone);

-- 3. Inventory Table
-- ============================================================

CREATE TABLE inventory (
    id                        SERIAL PRIMARY KEY,
    sr_no                     INTEGER NOT NULL DEFAULT nextval('inventory_sr_no_seq'),
    ministry                  VARCHAR(200) NOT NULL,
    department                VARCHAR(200) NOT NULL,
    mdo_location              VARCHAR(200),
    division                  VARCHAR(200),
    asset_id                  VARCHAR(50) NOT NULL,
    serial_number             VARCHAR(200),
    other_asset_category      VARCHAR(200),
    asset_category            VARCHAR(100) NOT NULL,
    block_name                VARCHAR(200) NOT NULL,
    floor                     VARCHAR(100) NOT NULL,
    room                      VARCHAR(100) NOT NULL,
    workstation               VARCHAR(100) NOT NULL,
    asset_description         TEXT,
    make_brand_model          VARCHAR(300),
    purchase_date             DATE,
    operating_system          VARCHAR(100),
    other_operating_system    VARCHAR(100),
    ip_address                VARCHAR(50),
    mac_address               VARCHAR(50),
    network_connection_type   VARCHAR(100),
    edr_installed             VARCHAR(10),
    reason_no_edr             TEXT,
    uem_installed             VARCHAR(10),
    reason_no_uem             TEXT,
    asset_user                VARCHAR(200) NOT NULL,
    asset_custodian           VARCHAR(255) NOT NULL,
    asset_current_status      VARCHAR(100) NOT NULL,
    date_of_removal           DATE,
    installation_date         DATE,
    end_of_support_date       DATE,
    end_of_life_date          DATE,
    amc_warranty              VARCHAR(10),
    amc_warranty_expiry_date  DATE,
    critical                  VARCHAR(10),
    remarks                   TEXT,
    designation               VARCHAR(200),
    email                     VARCHAR(255),
    phone                     VARCHAR(30),
    custodian                 VARCHAR(255),
    created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX UX_inventory_asset_id    ON inventory (asset_id);
CREATE UNIQUE INDEX UX_inventory_serial      ON inventory (serial_number) WHERE serial_number IS NOT NULL;
CREATE UNIQUE INDEX UX_inventory_mac         ON inventory (mac_address)     WHERE mac_address IS NOT NULL;
CREATE INDEX IX_inventory_asset_user         ON inventory (asset_user);
CREATE INDEX IX_inventory_ministry           ON inventory (ministry);
CREATE INDEX IX_inventory_status             ON inventory (asset_current_status);
CREATE INDEX IX_inventory_email              ON inventory (email);
CREATE INDEX IX_inventory_phone              ON inventory (phone);

-- 4. Tickets Table
-- ============================================================

CREATE TABLE tickets (
    id              SERIAL PRIMARY KEY,
    title           VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    status          VARCHAR(50) NOT NULL DEFAULT 'Open',
    created_by      INTEGER NOT NULL REFERENCES users(id),
    assigned_team   VARCHAR(100) NOT NULL DEFAULT 'IT Help Desk',
    inventory_id    INTEGER REFERENCES inventory(id),
    work_notes      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tickets_status CHECK (
        status IN ('Open', 'In Progress', 'Pending', 'Resolved', 'Closed')
    ),
    CONSTRAINT chk_tickets_team CHECK (
        assigned_team IN ('IT Help Desk', 'IT Team', 'Network Team', 'Cybersecurity Team')
    )
);

CREATE INDEX IX_tickets_status              ON tickets (status);
CREATE INDEX IX_tickets_assigned_team       ON tickets (assigned_team);
CREATE INDEX IX_tickets_created_by          ON tickets (created_by);
CREATE INDEX IX_tickets_inventory           ON tickets (inventory_id);

-- 5. Ticket History Table
-- ============================================================

CREATE TABLE ticket_history (
    id            SERIAL PRIMARY KEY,
    ticket_id     INTEGER NOT NULL REFERENCES tickets(id),
    action        VARCHAR(100) NOT NULL,
    from_team     VARCHAR(100),
    to_team       VARCHAR(100),
    note          VARCHAR(500),
    performed_by  INTEGER NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IX_ticket_history_ticket ON ticket_history (ticket_id);

-- 6. Lookup Values Table
-- ============================================================

CREATE TABLE lookup_values (
    id          SERIAL PRIMARY KEY,
    lookup_type VARCHAR(100) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    code        VARCHAR(100),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX UX_lookup_type_name ON lookup_values (lookup_type, name);
CREATE UNIQUE INDEX UX_lookup_type_code ON lookup_values (lookup_type, code) WHERE code IS NOT NULL;

-- 7. Seed Data (minimal)
-- ============================================================

INSERT INTO users (name, email, phone, role, password_hash, is_active) VALUES
    ('System Administrator', 'admin@system.local', '+10000000000', 'Admin',
     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true);
