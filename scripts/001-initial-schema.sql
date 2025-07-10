-- Initial database schema for Toyota Workshop Manager
-- This will create all necessary tables in Neon PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (for multi-tenant support)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    tax_rate DECIMAL(5,2) DEFAULT 18.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuration table for dropdown values and templates
CREATE TABLE configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    config_type VARCHAR(50) NOT NULL, -- 'part_categories', 'bill_template', 'quotation_template'
    config_key VARCHAR(100) NOT NULL,
    config_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parts table
CREATE TABLE parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    part_name VARCHAR(255) NOT NULL,
    part_code VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, part_code)
);

-- Customers table (vehicle is now optional)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    vehicle VARCHAR(255), -- Now optional
    customer_type VARCHAR(50) DEFAULT 'individual', -- 'individual', 'business'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bills and Quotations table
CREATE TABLE bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    bill_number VARCHAR(100) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    items JSONB NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bill', 'quotation')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, bill_number)
);

-- File uploads table for multiple logos and documents
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    file_category VARCHAR(50) NOT NULL, -- 'logo', 'template', 'document'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_parts_company_id ON parts(company_id);
CREATE INDEX idx_parts_category ON parts(category);
CREATE INDEX idx_parts_is_active ON parts(is_active);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_bills_company_id ON bills(company_id);
CREATE INDEX idx_bills_customer_id ON bills(customer_id);
CREATE INDEX idx_bills_type ON bills(type);
CREATE INDEX idx_bills_status ON bills(status);
CREATE INDEX idx_bills_created_at ON bills(created_at);
CREATE INDEX idx_configurations_company_id ON configurations(company_id);
CREATE INDEX idx_configurations_type ON configurations(config_type);
CREATE INDEX idx_file_uploads_company_id ON file_uploads(company_id);
CREATE INDEX idx_file_uploads_category ON file_uploads(file_category);

-- Insert default company
INSERT INTO companies (name, address, phone, email, tax_rate) 
VALUES ('Toyota Workshop', '123 Main Street, City, State - 123456', '+91 98765 43210', 'info@toyotaworkshop.com', 18.00);

-- Insert default part categories configuration
INSERT INTO configurations (company_id, config_type, config_key, config_value) 
SELECT id, 'part_categories', 'categories', 
'["Engine Parts", "Brake System", "Suspension", "Electrical", "Body Parts", "Filters", "Fluids", "Electronics", "Accessories", "Other"]'::jsonb
FROM companies WHERE name = 'Toyota Workshop';

-- Insert default customer types
INSERT INTO configurations (company_id, config_type, config_key, config_value) 
SELECT id, 'customer_types', 'types', 
'["Individual", "Business", "Fleet Owner", "Dealer"]'::jsonb
FROM companies WHERE name = 'Toyota Workshop';
