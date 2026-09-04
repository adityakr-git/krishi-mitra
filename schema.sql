-- ============================================================================
-- KRISHI MITRA (कृषि मित्र) — Production Database Schema
-- Compatible with PostgreSQL 15+ / Supabase
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER PROFILES & ROLES TABLE
CREATE TYPE user_role AS ENUM ('FARMER', 'OFFICER', 'ADMIN');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(15) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    role user_role NOT NULL DEFAULT 'FARMER',
    village VARCHAR(150),
    district VARCHAR(100) NOT NULL,
    kisan_id VARCHAR(50) UNIQUE,
    aadhaar_linked BOOLEAN DEFAULT FALSE,
    bank_account_masked VARCHAR(60),
    mandi_id VARCHAR(50),
    officer_badge VARCHAR(50),
    department VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);

-- 2. MANDI PROCUREMENT CENTERS TABLE
CREATE TYPE congestion_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');

CREATE TABLE mandi_centers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    lat DECIMAL(9, 6) NOT NULL,
    lng DECIMAL(9, 6) NOT NULL,
    capacity_max INTEGER NOT NULL DEFAULT 30,
    current_queue_count INTEGER NOT NULL DEFAULT 0,
    congestion congestion_level NOT NULL DEFAULT 'LOW',
    avg_wait_minutes INTEGER NOT NULL DEFAULT 15,
    active_weighbridges INTEGER NOT NULL DEFAULT 2,
    total_weighbridges INTEGER NOT NULL DEFAULT 3,
    phone_contact VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_mandi_district ON mandi_centers(district);

-- 3. PROCUREMENT TOKENS & QUEUE TABLE
CREATE TYPE token_status AS ENUM (
    'SCHEDULED', 
    'ARRIVED', 
    'QUALITY_CHECK', 
    'WEIGHING', 
    'PAYMENT_PROCESSING', 
    'COMPLETED', 
    'CANCELLED'
);

CREATE TYPE payment_status AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'FAILED');

CREATE TABLE procurement_tokens (
    id VARCHAR(20) PRIMARY KEY, -- e.g. 'A-142'
    token_number INTEGER NOT NULL,
    farmer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mandi_id VARCHAR(50) NOT NULL REFERENCES mandi_centers(id),
    crop VARCHAR(80) NOT NULL,
    crop_variety VARCHAR(80) NOT NULL,
    quantity_quintals DECIMAL(8, 2) NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_slot VARCHAR(50) NOT NULL,
    queue_position INTEGER NOT NULL DEFAULT 0,
    estimated_wait_minutes INTEGER NOT NULL DEFAULT 15,
    status token_status NOT NULL DEFAULT 'SCHEDULED',
    
    -- Quality Assessment
    moisture_percentage DECIMAL(4, 2),
    foreign_matter_percentage DECIMAL(4, 2),
    grade VARCHAR(20),
    inspected_by UUID REFERENCES users(id),
    inspected_at TIMESTAMP WITH TIME ZONE,
    
    -- Electronic Weighment
    gross_weight_kg DECIMAL(10, 2),
    tare_weight_kg DECIMAL(10, 2),
    net_weight_kg DECIMAL(10, 2),
    net_quintals DECIMAL(8, 2),
    scale_number INTEGER,
    weighed_at TIMESTAMP WITH TIME ZONE,
    
    -- Direct Benefit Transfer (DBT)
    msp_rate_per_quintal DECIMAL(10, 2) NOT NULL,
    gross_payable DECIMAL(12, 2) NOT NULL,
    deductions DECIMAL(10, 2) DEFAULT 0.00,
    net_disbursed DECIMAL(12, 2) NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    dbt_transaction_ref VARCHAR(100),
    payment_disbursed_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX idx_tokens_farmer ON procurement_tokens(farmer_id);
CREATE INDEX idx_tokens_mandi ON procurement_tokens(mandi_id);
CREATE INDEX idx_tokens_status ON procurement_tokens(status);
CREATE INDEX idx_tokens_queue ON procurement_tokens(mandi_id, queue_position);

-- 4. REAL-TIME AUDIT LOG
CREATE TABLE procurement_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id VARCHAR(20) NOT NULL REFERENCES procurement_tokens(id),
    actor_id UUID REFERENCES users(id),
    action VARCHAR(80) NOT NULL,
    previous_state VARCHAR(50),
    new_state VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE procurement_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandi_centers ENABLE ROW LEVEL SECURITY;

-- Farmers can only view their own tokens and public mandi info
CREATE POLICY farmer_read_own_tokens ON procurement_tokens
    FOR SELECT USING (auth.uid() = farmer_id);

-- Mandi Officers can read and process tokens assigned to their mandi
CREATE POLICY officer_manage_mandi_tokens ON procurement_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'OFFICER' 
            AND users.mandi_id = procurement_tokens.mandi_id
        )
    );

-- Everyone can read active Mandi Center information
CREATE POLICY public_read_mandis ON mandi_centers
    FOR SELECT USING (is_active = TRUE);
