import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  listDriverOrders,
  rowsToAdminOrders,
  assignDriverToBooking,
  updateBookingStatus,
  listAdminCustomers,
  listAdminDrivers,
  listAdminPayments,
  listAdminReviews,
  type AdminCustomerRow,
  type AdminDriverRow,
  type AdminPaymentRow,
  type AdminReviewRow,
} from "../services/adminOrderServices";

export type AdminOrderStatus = "Pending" | "In Progress" | "Completed";

export type AdminOrderItem = {
  name: string;
  quantity: number;
  price: number;
};

export type AdminOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  pickupDate: string;
  pickupTime: string;
  driver: string;
  driverPhone: string;
  status: AdminOrderStatus;
  placedAt: string;
  placedAtISO?: string;
  items: AdminOrderItem[];
  deliveryFee: number;
  paymentMethod: "Card" | "EFT" | "Cash";
  instructions: string;
  laundromat?: string;
  laundromatAddress?: string;
  bookingReference?: string;
};

export type AdminCustomer = {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  joinedDate: string;
  badgeColor: string;
  initialsColor: string;
};

export type AdminDriver = {
  id: string;
  initials: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  vehicle: string;
  registration: string;
  area: "Woodstock" | "Observatory" | "Maitland";
  joinedDate: string;
  badgeColor: string;
  initialsColor: string;
};

export type PriceEntry = {
  price: number;
  enabled: boolean;
};

export type Pricing = {
  delivery: PriceEntry;
  express: PriceEntry;
  distanceRate?: PriceEntry | null;
};

export type AdminService = {
  id: string;
  name: string;
  price: number;
};

export type AdminPayment = {
  id: string;
  bookingReference: string;
  customerName: string;
  amount: number;
  method: string;
  status: string;
  reference?: string;
  paidAt: string;
};

export type AdminReview = {
  id: string;
  bookingReference: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
};

type AdminContextValue = {
  orders: AdminOrder[];
  customers: AdminCustomer[];
  drivers: AdminDriver[];
  payments: AdminPayment[];
  reviews: AdminReview[];
  pricing: Pricing;
  services: AdminService[];
  addOrder: (order: AdminOrder) => void;
  refreshOrders: () => void;
  updateOrderStatus: (id: string, status: AdminOrderStatus) => void;
  updateOrder: (id: string, patch: Partial<AdminOrder>) => void;
  assignDriver: (
    id: string,
    driverId: string,
    driverName: string,
    driverPhone: string,
  ) => void;
  addCustomer: (customer: AdminCustomer) => void;
  updateCustomer: (id: string, patch: Partial<AdminCustomer>) => void;
  deleteCustomer: (id: string) => void;
  addDriver: (driver: AdminDriver) => void;
  updateDriver: (id: string, patch: Partial<AdminDriver>) => void;
  deleteDriver: (id: string) => void;
  updatePricing: (patch: Partial<Pricing>) => void;
  addService: (name: string, price: number) => void;
  updateService: (id: string, patch: Partial<Omit<AdminService, "id">>) => void;
  deleteService: (id: string) => void;
  validateDriverCredentials: (
    email: string,
    password: string,
  ) => AdminDriver | null;
};

const AdminContext = createContext<AdminContextValue | undefined>(undefined);

export function getOrderTotal(order: AdminOrder): number {
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return subtotal + order.deliveryFee;
}

export function getOrderSubtotal(order: AdminOrder): number {
  return order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

const seedDrivers: AdminDriver[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    initials: "SN",
    name: "Sipho Nkosi",
    email: "sipho@laundrypickup.co.za",
    password: "Sipho#Nkosi",
    phone: "083 214 5567",
    vehicle: "White VW Caddy",
    registration: "CA 482-113",
    area: "Woodstock",
    joinedDate: "Joined Feb 2026",
    badgeColor: "#E8F2FF",
    initialsColor: "#3678E5",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    initials: "TD",
    name: "Thabo Dube",
    email: "thabo@laundrypickup.co.za",
    password: "Thabo$Dube",
    phone: "081 556 9012",
    vehicle: "Silver Toyota Corolla",
    registration: "CA 391-887",
    area: "Maitland",
    joinedDate: "Joined Apr 2026",
    badgeColor: "#F0E9FF",
    initialsColor: "#7958D5",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    initials: "JE",
    name: "Jeff Erasmus",
    email: "jeff@laundrypickup.co.za",
    password: "Jeff!Erasmus",
    phone: "072 887 3419",
    vehicle: "Blue Ford Fiesta",
    registration: "CA 218-554",
    area: "Woodstock",
    joinedDate: "Joined Jun 2026",
    badgeColor: "#E7F8EE",
    initialsColor: "#21A86A",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    initials: "DM",
    name: "David Mthembu",
    email: "david@laundrypickup.co.za",
    password: "David#Mthe",
    phone: "079 412 6678",
    vehicle: "Grey Nissan Bakkie",
    registration: "CA 467-220",
    area: "Observatory",
    joinedDate: "Joined Mar 2026",
    badgeColor: "#FFF1D6",
    initialsColor: "#E89A12",
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    initials: "LM",
    name: "Lerato Mahlangu",
    email: "lerato@laundrypickup.co.za",
    password: "Lerato/Mahlangu",
    phone: "082 445 8899",
    vehicle: "White Toyota Bakkie",
    registration: "CA 533-091",
    area: "Maitland",
    joinedDate: "Joined Aug 2026",
    badgeColor: "#E9F7F8",
    initialsColor: "#228A92",
    
  },
  {
    id: "10000000-0000-0000-0000-000000000006",
    initials: "ZN",
    name: "Zanele Ndlovu",
    email: "zanele@laundrypickup.co.za",
    password: "Zanele!Ndlovu1",
    phone: "078 331 5520",
    vehicle: "Red Hyundai i20",
    registration: "CA 176-338",
    area: "Observatory",
    joinedDate: "Joined Oct 2026",
    badgeColor: "#FFE8EF",
    initialsColor: "#D95B82",
  },
];

const DEFAULT_PRICING: Pricing = {
  delivery: { price: 60, enabled: true },
  express: { price: 5, enabled: true },
  distanceRate: { price: 5, enabled: true },
};

const DEFAULT_SERVICES: AdminService[] = [];

const BADGE_COLORS = [
  '#E8F2FF',
  '#F0E9FF',
  '#E7F8EE',
  '#FFF1D6',
  '#E9F7F8',
  '#FFE8EF',
];
const INITIAL_COLORS = [
  '#3678E5',
  '#7958D5',
  '#21A86A',
  '#E89A12',
  '#228A92',
  '#D95B82',
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function joinedDateLabel(iso: string): string {
  const date = new Date(iso);
  return `Joined ${date.toLocaleString('en-US', {
    month: 'short',
  })} ${date.getFullYear()}`;
}

function customerRowToAdminCustomer(
  row: AdminCustomerRow,
  index: number
): AdminCustomer {
  return {
    id: row.id,
    initials: initialsOf(row.name) || 'CU',
    name: row.name,
    email: row.email,
    phone: row.phone ?? '',
    totalOrders: Number(row.total_orders ?? 0),
    joinedDate: joinedDateLabel(row.created_at),
    badgeColor: BADGE_COLORS[index % BADGE_COLORS.length],
    initialsColor: INITIAL_COLORS[index % INITIAL_COLORS.length],
  };
}

function driverRowToAdminDriver(
  row: AdminDriverRow,
  index: number,
  password: string
): AdminDriver {
  return {
    id: row.id,
    initials: initialsOf(row.name) || 'DR',
    name: row.name,
    email: row.email,
    password,
    phone: row.phone ?? '',
    vehicle: row.vehicle ?? '',
    registration: row.registration ?? '',
    area: (row.area || 'Woodstock') as AdminDriver['area'],
    joinedDate: joinedDateLabel(row.created_at),
    badgeColor: BADGE_COLORS[index % BADGE_COLORS.length],
    initialsColor: INITIAL_COLORS[index % INITIAL_COLORS.length],
  };
}

function mergeDrivers(db: AdminDriver[], prev: AdminDriver[]): AdminDriver[] {
  const dbEmails = new Set(db.map((d) => d.email.toLowerCase()));
  const prevByEmail = new Map(prev.map((d) => [d.email.toLowerCase(), d]));
  const merged = db.map((row) => {
    const existing = prevByEmail.get(row.email.toLowerCase());
    return existing ? { ...row, password: existing.password } : row;
  });
  for (const prevItem of prev) {
    if (!dbEmails.has(prevItem.email.toLowerCase())) {
      merged.push(prevItem);
    }
  }
  return merged;
}

const SEED_DRIVER_PASSWORDS = new Map(
  seedDrivers.map((driver) => [driver.email.toLowerCase(), driver.password])
);

function paymentRowToAdminPayment(row: AdminPaymentRow): AdminPayment {
  return {
    id: row.id,
    bookingReference: row.booking_reference,
    customerName: row.customer_name,
    amount: Number(row.amount ?? 0),
    method: row.method,
    status: row.status,
    reference: row.reference ?? undefined,
    paidAt: row.paid_at,
  };
}

function reviewRowToAdminReview(row: AdminReviewRow): AdminReview {
  return {
    id: row.id,
    bookingReference: row.booking_reference ?? '',
    customerName: row.customer_name,
    rating: Number(row.rating ?? 0),
    comment: row.comment,
    createdAt: row.created_at,
  };
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [drivers, setDrivers] = useState<AdminDriver[]>(seedDrivers);
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pricing, setPricing] = useState<Pricing>(DEFAULT_PRICING);
  const [services, setServices] = useState<AdminService[]>(DEFAULT_SERVICES);

  const addOrder = useCallback((order: AdminOrder) => {
    setOrders((prev) => [order, ...prev]);
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const rows = await listDriverOrders();
      const dbOrders = rowsToAdminOrders(rows);
      setOrders((prev) => {
        const refs = new Set(
          dbOrders
            .map((o) => o.bookingReference)
            .filter((r): r is string => !!r),
        );
        const localOnly = prev.filter(
          (o) => !o.bookingReference || !refs.has(o.bookingReference),
        );
        return [...dbOrders, ...localOnly];
      });
    } catch {
      // DB not reachable yet - keep local state.
    }

    try {
      const customerRows = await listAdminCustomers();
      setCustomers(customerRows.map(customerRowToAdminCustomer));
    } catch {
      // Keep existing customers on failure.
    }

    try {
      const driverRows = await listAdminDrivers();
      setDrivers((prev) => {
        const prevByEmail = new Map(
          prev.map((driver) => [driver.email.toLowerCase(), driver]),
        );
        return mergeDrivers(
          driverRows.map((row, index) =>
            driverRowToAdminDriver(
              row,
              index,
              prevByEmail.get(row.email.toLowerCase())?.password ??
                SEED_DRIVER_PASSWORDS.get(row.email.toLowerCase()) ??
                '',
            ),
          ),
          prev,
        );
      });
    } catch {
      // Keep seed/local drivers on failure.
    }

    try {
      const paymentRows = await listAdminPayments();
      setPayments(paymentRows.map(paymentRowToAdminPayment));
    } catch {
      // Keep existing payments on failure.
    }

    try {
      const reviewRows = await listAdminReviews();
      setReviews(reviewRows.map(reviewRowToAdminReview));
    } catch {
      // Keep existing reviews on failure.
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  useEffect(() => {
    const handle = setInterval(refreshOrders, 5000);
    return () => clearInterval(handle);
  }, [refreshOrders]);

  const updateOrderStatus = useCallback(
    (id: string, status: AdminOrderStatus) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === id ? { ...order, status } : order)),
      );
      const target = orders.find((o) => o.id === id);
      if (target?.bookingReference) {
        updateBookingStatus(target.bookingReference, status).catch(() => {
          // Keep the optimistic local update even if persistence fails.
        });
      }
    },
    [orders],
  );

  const updateOrder = useCallback((id: string, patch: Partial<AdminOrder>) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...patch } : order)),
    );
  }, []);

  const assignDriver = useCallback(
    async (
      id: string,
      driverId: string,
      driverName: string,
      driverPhone: string,
    ) => {
      const target = orders.find((o) => o.id === id);

      setOrders((prev) =>
        prev.map((order) => {
          if (order.id !== id) return order;
          return {
            ...order,
            driver: driverName,
            driverPhone,
            status: order.status === "Pending" ? "In Progress" : order.status,
          };
        }),
      );

      if (target?.bookingReference && driverId) {
        try {
          await assignDriverToBooking(target.bookingReference, driverId);
        } catch {
          // Keep the optimistic local assignment even if persistence fails.
        }
      }
    },
    [orders],
  );

  const addCustomer = useCallback((customer: AdminCustomer) => {
    setCustomers((prev) => [customer, ...prev]);
  }, []);

  const updateCustomer = useCallback(
    (id: string, patch: Partial<AdminCustomer>) => {
      setCustomers((prev) =>
        prev.map((customer) =>
          customer.id === id ? { ...customer, ...patch } : customer,
        ),
      );
    },
    [],
  );

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id));
  }, []);

  const addDriver = useCallback((driver: AdminDriver) => {
    setDrivers((prev) => [driver, ...prev]);
  }, []);

  const updateDriver = useCallback(
    (id: string, patch: Partial<AdminDriver>) => {
      setDrivers((prev) =>
        prev.map((driver) =>
          driver.id === id ? { ...driver, ...patch } : driver,
        ),
      );
    },
    [],
  );

  const deleteDriver = useCallback((id: string) => {
    setDrivers((prev) => prev.filter((driver) => driver.id !== id));
  }, []);

  const validateDriverCredentials = useCallback(
    (email: string, password: string): AdminDriver | null => {
      const match = drivers.find(
        (d) =>
          d.email.toLowerCase() === email.trim().toLowerCase() &&
          d.password === password.trim(),
      );
      return match ?? null;
    },
    [drivers],
  );

  const updatePricing = useCallback((patch: Partial<Pricing>) => {
    setPricing((prev) => ({ ...prev, ...patch }));
  }, []);

  const addService = useCallback((name: string, price: number) => {
    setServices((prev) => [
      ...prev,
      { id: `svc-${Date.now()}`, name, price },
    ]);
  }, []);

  const updateService = useCallback(
    (id: string, patch: Partial<Omit<AdminService, "id">>) => {
      setServices((prev) =>
        prev.map((service) =>
          service.id === id ? { ...service, ...patch } : service,
        ),
      );
    },
    [],
  );

  const deleteService = useCallback((id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id));
  }, []);

  const value = useMemo<AdminContextValue>(
    () => ({
      orders,
      customers,
      drivers,
      payments,
      reviews,
      pricing,
      services,
      addOrder,
      refreshOrders,
      updateOrderStatus,
      updateOrder,
      assignDriver,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addDriver,
      updateDriver,
      deleteDriver,
      updatePricing,
      addService,
      updateService,
      deleteService,
      validateDriverCredentials,
    }),
    [
      orders,
      customers,
      drivers,
      payments,
      reviews,
      pricing,
      services,
      addOrder,
      refreshOrders,
      updateOrderStatus,
      updateOrder,
      assignDriver,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addDriver,
      updateDriver,
      deleteDriver,
      updatePricing,
      addService,
      updateService,
      deleteService,
      validateDriverCredentials,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextValue {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
