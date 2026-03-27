-- ============================================================
-- Migration 008: RLS write policies for admin operations
-- App handles auth via JWT middleware; these allow anon CRUD.
-- Already applied to production DB on 2026-03-26.
-- ============================================================

-- Products
CREATE POLICY IF NOT EXISTS "Allow insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update products" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete products" ON products FOR DELETE USING (true);

-- Product images
CREATE POLICY IF NOT EXISTS "Allow insert product_images" ON product_images FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update product_images" ON product_images FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete product_images" ON product_images FOR DELETE USING (true);

-- Categories
CREATE POLICY IF NOT EXISTS "Allow insert categories" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update categories" ON categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete categories" ON categories FOR DELETE USING (true);

-- Brands
CREATE POLICY IF NOT EXISTS "Allow insert brands" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update brands" ON brands FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete brands" ON brands FOR DELETE USING (true);

-- Orders
CREATE POLICY IF NOT EXISTS "Allow read all orders" ON orders FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "Allow update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete orders" ON orders FOR DELETE USING (true);

-- Order items
CREATE POLICY IF NOT EXISTS "Allow read all order_items" ON order_items FOR SELECT USING (true);

-- Wilayas
CREATE POLICY IF NOT EXISTS "Allow update wilayas" ON wilayas FOR UPDATE USING (true) WITH CHECK (true);

-- Coupons
CREATE POLICY IF NOT EXISTS "Allow insert coupons" ON coupons FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update coupons" ON coupons FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete coupons" ON coupons FOR DELETE USING (true);
CREATE POLICY IF NOT EXISTS "Allow read all coupons" ON coupons FOR SELECT USING (true);

-- Blog posts
CREATE POLICY IF NOT EXISTS "Allow insert blog_posts" ON blog_posts FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow update blog_posts" ON blog_posts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Allow delete blog_posts" ON blog_posts FOR DELETE USING (true);
CREATE POLICY IF NOT EXISTS "Allow read all blog_posts" ON blog_posts FOR SELECT USING (true);

-- Storage: product-images bucket
-- (Applied via Supabase dashboard, included for reference)
-- Allow anon upload/delete/update to product-images bucket
