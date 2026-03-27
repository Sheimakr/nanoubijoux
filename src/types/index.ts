// ============================================
// Nano Bijoux — TypeScript Types
// ============================================

export interface Category {
  id: number;
  name_fr: string;
  name_ar: string;
  name_en: string;
  slug: string;
  image_url: string | null;
  parent_id: number | null;
  sort_order: number;
  product_count?: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  name_fr: string;
  name_ar: string;
  name_en: string;
  description_fr: string;
  description_ar: string;
  description_en: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  category_id: number;
  brand_id: number | null;
  material: string | null;
  motif: string | null;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  stock_quantity: number;
  sku: string;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  brand?: Brand;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: Review[];
  average_rating?: number;
  review_count?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  color_hex: string | null;
  size: string | null;
  price_override: number | null;
  stock_quantity: number;
  image_url: string | null;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  user?: UserProfile;
}

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar_url: string | null;
  default_address_id: string | null;
  role?: 'admin' | 'user';
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  wilaya: string;
  commune: string;
  address_line: string;
  is_default: boolean;
  created_at: string;
}

export interface Wilaya {
  id: number;
  name_fr: string;
  name_ar: string;
  name_en: string;
  shipping_fee: number;
  delivery_days: number;
}

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentMethod = 'cod' | 'baridimob' | 'ccp';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_address: Address;
  notes: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_snapshot: {
    name: string;
    image: string;
    sku: string;
  };
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_order_amount: number;
  usage_limit: number;
  used_count: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
}

export interface BlogPost {
  id: string;
  title_fr: string;
  title_ar: string;
  title_en: string;
  content_fr: string;
  content_ar: string;
  content_en: string;
  slug: string;
  featured_image: string | null;
  author_id: string;
  published_at: string | null;
  created_at: string;
}

// Cart types (Zustand store)
export interface CartItem {
  product: Product;
  variant: ProductVariant | null;
  quantity: number;
}

export type Locale = 'fr' | 'ar' | 'en';

// Filter types for shop page
export interface ShopFilters {
  category: string | null;
  brand: string | null;
  priceMin: number | null;
  priceMax: number | null;
  material: string | null;
  motif: string | null;
  sort: 'newest' | 'popular' | 'price_asc' | 'price_desc' | 'rating';
  page: number;
  perPage: number;
}
