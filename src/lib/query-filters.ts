export const ACTIVE_SALE = `COALESCE(s.status, 'active') = 'active'`;
export const ACTIVE_PURCHASE = `COALESCE(p.status, 'active') = 'active'`;
