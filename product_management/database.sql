-- Categories (Hierarchical)
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast parent → children lookup
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- Prevent duplicate category names under same parent
CREATE UNIQUE INDEX uq_categories_parent_name
ON categories(parent_id, name);


-- Product Status ENUM
CREATE TYPE product_status AS ENUM ('draft', 'active', 'inactive');


-- Products 
CREATE TABLE products (
    id UUID PRIMARY KEY,
    seller_id UUID NOT NULL, -- owned by User Service, no FK
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    status product_status DEFAULT 'draft',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ownership & seller dashboard queries
CREATE INDEX idx_products_seller_id ON products(seller_id);

-- Product lifecycle filtering
CREATE INDEX idx_products_status ON products(status);

-- Common listing queries
CREATE INDEX idx_products_created_at ON products(created_at);


-- Product Attributes (Flexible Metadata)
CREATE TABLE product_attributes (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    attributes JSONB NOT NULL
);

-- Fast attribute filtering
CREATE INDEX idx_product_attributes_jsonb
ON product_attributes
USING GIN (attributes);


-- Product ↔ Category (Many-to-Many)
CREATE TABLE product_categories (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- Category → products lookup
CREATE INDEX idx_product_categories_category_id
ON product_categories(category_id);

-- Inventory
CREATE TABLE inventory (
    product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    stock INTEGER NOT NULL CHECK (stock >= 0),
    updated_at TIMESTAMPTZ DEFAULT now()
);
