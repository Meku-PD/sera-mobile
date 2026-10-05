import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

export type CartItem = {
  id: string; // the product id
  name: string;
  price: number;
  category: string | null;
  region: string | null;
  image_url: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

type CartRow = {
  product_id: string;
  quantity: number;
  products:
    | { id: string; name: string; price: number; category: string | null; region: string | null; image_url: string | null }
    | { id: string; name: string; price: number; category: string | null; region: string | null; image_url: string | null }[]
    | null;
};

const Ctx = createContext<CartCtx | null>(null);
// Report whether a save to Supabase worked (errors used to be hidden)
function report(label: string, p: PromiseLike<{ error: { message: string } | null }>) {
  p.then(({ error }) => {
    if (error) console.error("[cart write FAILED]", label, error.message);
    else console.log("[cart write ok]", label);
  });
}


// Before signing in, the cart lives in memory only (the app asks you to sign in to keep it)
let guestMemory: CartItem[] = [];
function readGuest(): CartItem[] {
  return guestMemory;
}
function writeGuest(items: CartItem[]) {
  guestMemory = items;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  const lastWrite = useRef(0); // when this device last changed the cart

  const apply = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  // Read the signed-in user's cart from Supabase
  const load = useCallback(
    async (uid: string) => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("product_id, quantity, products(id, name, price, category, region, image_url)")
        .eq("user_id", uid)
        .order("updated_at", { ascending: true });
      if (error || !data) return;
      const next: CartItem[] = [];
      for (const r of data as unknown as CartRow[]) {
        const p = Array.isArray(r.products) ? r.products[0] : r.products;
        if (!p) continue;
        next.push({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          category: p.category,
          region: p.region,
          image_url: p.image_url,
          quantity: r.quantity,
        });
      }
      apply(next);
    },
    [apply]
  );

  // When the user signs in or out: load the right cart, and listen for live changes
  useEffect(() => {
    if (loading) return;
    let cancelled = false;

    if (!userId) {
      apply(readGuest());
      setReady(true);
      return;
    }

    (async () => {
      // Merge anything added before signing in into the account cart, once
      const guest = readGuest();
      if (guest.length > 0) {
        const { data: existing } = await supabase
          .from("cart_items")
          .select("product_id, quantity")
          .eq("user_id", userId);
        const have = new Map(
          ((existing ?? []) as { product_id: string; quantity: number }[]).map((r) => [r.product_id, r.quantity])
        );
        await supabase.from("cart_items").upsert(
          guest.map((g) => ({
            user_id: userId,
            product_id: g.id,
            quantity: (have.get(g.id) ?? 0) + g.quantity,
            updated_at: new Date().toISOString(),
          })),
          { onConflict: "user_id,product_id" }
        );
        writeGuest([]);
      }
      if (!cancelled) {
        await load(userId);
        setReady(true);
      }
    })();

    // Any change to the cart table (from this browser or the phone) reloads the cart
    const channel = supabase
      .channel(`cart-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, () => {
        load(userId);
      })
      .subscribe((status) => {
        console.log("[cart realtime]", status);
      });

    // Safety net: also check every 3 seconds, so the other device's changes always show up
    const poll = setInterval(() => {
      if (Date.now() - lastWrite.current < 4000) return; // don't fight a change we just made
      load(userId);
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [userId, loading, apply, load]);

  // Show the change on screen right away, and keep the guest copy up to date when signed out
  const commit = (next: CartItem[]) => {
    lastWrite.current = Date.now();
    apply(next);
    if (!userId) writeGuest(next);
  };

  const add = (p: Product, qty = 1) => {
    const cur = itemsRef.current;
    const existing = cur.find((i) => i.id === p.id);
    const newQty = (existing?.quantity ?? 0) + qty;
    const next = existing
      ? cur.map((i) => (i.id === p.id ? { ...i, quantity: newQty } : i))
      : [
          ...cur,
          {
            id: p.id,
            name: p.name,
            price: Number(p.price),
            category: p.category,
            region: p.region,
            image_url: p.image_url,
            quantity: newQty,
          },
        ];
    commit(next);
    if (userId) {
      report(
        "add",
        supabase
          .from("cart_items")
          .upsert(
            { user_id: userId, product_id: p.id, quantity: newQty, updated_at: new Date().toISOString() },
            { onConflict: "user_id,product_id" }
          )
      );
    }
  };

  const setQty = (id: string, qty: number) => {
    if (qty < 1) {
      remove(id);
      return;
    }
    commit(itemsRef.current.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
    if (userId) {
      report(
        "setQty",
        supabase
          .from("cart_items")
          .update({ quantity: qty, updated_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("product_id", id)
      );
    }
  };

  const remove = (id: string) => {
    commit(itemsRef.current.filter((i) => i.id !== id));
    if (userId) {
      report("remove", supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", id));
    }
  };

  const clear = () => {
    commit([]);
    if (userId) {
      report("clear", supabase.from("cart_items").delete().eq("user_id", userId));
    }
  };

  const count = items.reduce((n, i) => n + i.quantity, 0);
  const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);

  return (
    <Ctx.Provider value={{ items, count, subtotal, ready, add, setQty, remove, clear }}>{children}</Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}