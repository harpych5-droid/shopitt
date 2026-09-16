import { supabase } from "@/lib/supabase";

export type CatalogProduct = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  price_usd: number;
  seller_id: string;
  source: string;
  is_available: boolean;
  profile: { username: string | null; avatar_url: string | null } | null;
};

export type ShopTag = {
  id: string;
  post_id: string;
  item_name: string;
  price: number;
  position_x: number;
  position_y: number;
  created_by: string;
  linked_product_id: string | null;
  product: CatalogProduct | null;
};

const CATALOG_PRODUCT_SELECT = `
  id, title, description, image_url, price_usd, seller_id, source, is_available,
  profile:profiles!products_seller_id_fkey ( username, avatar_url )
`;

export async function fetchPostShopTags(postId: string) {
  const { data, error } = await (supabase as any)
    .from("post_product_tags")
    .select("id, post_id, item_name, price, position_x, position_y, created_by, linked_product_id")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) return { data: [] as ShopTag[], error: error.message };

  const rows = (data ?? []) as Array<Omit<ShopTag, "product">>;
  const linkedIds = rows.flatMap((row) => row.linked_product_id ? [row.linked_product_id] : []);
  let products: CatalogProduct[] = [];
  if (linkedIds.length) {
    const productResult = await (supabase as any)
      .from("products")
      .select(CATALOG_PRODUCT_SELECT)
      .in("id", linkedIds);
    products = (productResult.data ?? []) as CatalogProduct[];
  }
  return {
    data: rows.map((row) => ({
      ...row,
      linked_product_id: row.linked_product_id,
      product: products.find((product) => product.id === row.linked_product_id) ?? null,
      price: Number(row.price),
      position_x: Number(row.position_x),
      position_y: Number(row.position_y),
    })),
    error: null,
  };
}

export async function searchProducts(term: string) {
  let query = (supabase as any)
    .from("products")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("is_available", true)
    .order("updated_at", { ascending: false })
    .limit(12);
  if (term.trim()) query = query.ilike("title", `%${term.trim()}%`);
  const { data, error } = await query;
  return { data: (data ?? []) as CatalogProduct[], error: error?.message ?? null };
}

export async function fetchCatalogProductById(productId: string) {
  const { data, error } = await (supabase as any)
    .from("products")
    .select(CATALOG_PRODUCT_SELECT)
    .eq("id", productId)
    .eq("is_available", true)
    .maybeSingle();
  return { data: (data as CatalogProduct | null) ?? null, error: error?.message ?? null };
}

export async function createPostShopTags(
  postId: string,
  createdBy: string,
  tags: Array<Pick<ShopTag, "item_name" | "price" | "position_x" | "position_y" | "linked_product_id">>,
) {
  if (!tags.length) return { error: null };
  const { error } = await (supabase as any).from("post_product_tags").insert(
    tags.map((tag) => ({
      post_id: postId,
      created_by: createdBy,
      item_name: tag.item_name,
      price: tag.price,
      position_x: tag.position_x,
      position_y: tag.position_y,
      linked_product_id: tag.linked_product_id,
    })),
  );
  return { error: error?.message ?? null };
}
