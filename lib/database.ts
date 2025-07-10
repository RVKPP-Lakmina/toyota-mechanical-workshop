import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core"
import { eq, and, desc, asc, like } from "drizzle-orm"

/**
 * Returns a Drizzle client on the server.
 * In the browser we return `undefined` and every DB method below will throw
 * a clear error if it’s (accidentally) used on the client.
 */
function getServerDb() {
  if (typeof window !== "undefined") return undefined as never
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is missing – add it in your Vercel /local env before starting the server.")
  }
  return drizzle(neon(url))
}

export const db = getServerDb()

// Schema definitions
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  logoUrl: text("logo_url"),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("18.00"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const configurations = pgTable("configurations", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  configType: varchar("config_type", { length: 50 }).notNull(),
  configKey: varchar("config_key", { length: 100 }).notNull(),
  configValue: jsonb("config_value").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const parts = pgTable(
  "parts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    partName: varchar("part_name", { length: 255 }).notNull(),
    partCode: varchar("part_code", { length: 100 }).notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
    quantity: integer("quantity").notNull().default(0),
    minQuantity: integer("min_quantity").notNull().default(0),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniquePartCode: unique().on(table.companyId, table.partCode),
  }),
)

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  vehicle: varchar("vehicle", { length: 255 }), // Now optional
  customerType: varchar("customer_type", { length: 50 }).default("individual"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    billNumber: varchar("bill_number", { length: 100 }).notNull(),
    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerPhone: varchar("customer_phone", { length: 50 }),
    customerAddress: text("customer_address"),
    items: jsonb("items").notNull(),
    subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
    taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).notNull(),
    taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).notNull(),
    total: decimal("total", { precision: 10, scale: 2 }).notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    status: varchar("status", { length: 20 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueBillNumber: unique().on(table.companyId, table.billNumber),
  }),
)

export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  fileCategory: varchar("file_category", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
})

// Types
export type Company = typeof companies.$inferSelect
export type NewCompany = typeof companies.$inferInsert
export type Part = typeof parts.$inferSelect
export type NewPart = typeof parts.$inferInsert
export type Customer = typeof customers.$inferSelect
export type NewCustomer = typeof customers.$inferInsert
export type Bill = typeof bills.$inferSelect
export type NewBill = typeof bills.$inferInsert
export type Configuration = typeof configurations.$inferSelect
export type NewConfiguration = typeof configurations.$inferInsert
export type FileUpload = typeof fileUploads.$inferSelect
export type NewFileUpload = typeof fileUploads.$inferInsert

// Get default company ID (for single-tenant setup)
export async function getDefaultCompanyId(): Promise<string> {
  const company = await db.select().from(companies).limit(1)
  if (company.length === 0) {
    throw new Error("No company found. Please run database migrations.")
  }
  return company[0].id
}

// Database services

const assertServer = () => {
  if (typeof window !== "undefined") {
    throw new Error("Database services can only be used on the server.")
  }
}

export const companyService = {
  async get() {
    assertServer()
    const result = await db.select().from(companies).limit(1)
    return result[0] || null
  },

  async update(id: string, data: Partial<NewCompany>) {
    assertServer()
    const result = await db
      .update(companies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning()
    return result[0]
  },
}

export const configurationService = {
  async getByType(companyId: string, configType: string) {
    assertServer()
    return await db
      .select()
      .from(configurations)
      .where(
        and(
          eq(configurations.companyId, companyId),
          eq(configurations.configType, configType),
          eq(configurations.isActive, true),
        ),
      )
  },

  async upsert(companyId: string, configType: string, configKey: string, configValue: any) {
    assertServer()
    // Try to update first
    const existing = await db
      .select()
      .from(configurations)
      .where(
        and(
          eq(configurations.companyId, companyId),
          eq(configurations.configType, configType),
          eq(configurations.configKey, configKey),
        ),
      )
      .limit(1)

    if (existing.length > 0) {
      return await db
        .update(configurations)
        .set({ configValue, updatedAt: new Date() })
        .where(eq(configurations.id, existing[0].id))
        .returning()
    } else {
      return await db
        .insert(configurations)
        .values({
          companyId,
          configType,
          configKey,
          configValue,
        })
        .returning()
    }
  },
}

export const partsService = {
  async getAll(companyId: string) {
    assertServer()
    return await db
      .select()
      .from(parts)
      .where(and(eq(parts.companyId, companyId), eq(parts.isActive, true)))
      .orderBy(asc(parts.partName))
  },

  async getLowStock(companyId: string) {
    assertServer()
    const allParts = await this.getAll(companyId)
    return allParts.filter((part) => part.quantity <= part.minQuantity && part.quantity > 0)
  },

  async getOutOfStock(companyId: string) {
    assertServer()
    const allParts = await this.getAll(companyId)
    return allParts.filter((part) => part.quantity === 0)
  },

  async create(data: NewPart) {
    assertServer()
    const result = await db.insert(parts).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<NewPart>) {
    assertServer()
    const result = await db
      .update(parts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(parts.id, id))
      .returning()
    return result[0]
  },

  async softDelete(id: string) {
    assertServer()
    return await this.update(id, { isActive: false })
  },
}

export const customersService = {
  async getAll(companyId: string) {
    assertServer()
    return await db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(asc(customers.name))
  },

  async create(data: NewCustomer) {
    assertServer()
    const result = await db.insert(customers).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<NewCustomer>) {
    assertServer()
    const result = await db
      .update(customers)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning()
    return result[0]
  },

  async delete(id: string) {
    assertServer()
    await db.delete(customers).where(eq(customers.id, id))
  },
}

export const billsService = {
  async getAll(companyId: string) {
    assertServer()
    return await db.select().from(bills).where(eq(bills.companyId, companyId)).orderBy(desc(bills.createdAt))
  },

  async getByType(companyId: string, type: "bill" | "quotation") {
    assertServer()
    return await db
      .select()
      .from(bills)
      .where(and(eq(bills.companyId, companyId), eq(bills.type, type)))
      .orderBy(desc(bills.createdAt))
  },

  async create(data: NewBill) {
    assertServer()
    const result = await db.insert(bills).values(data).returning()
    return result[0]
  },

  async update(id: string, data: Partial<NewBill>) {
    assertServer()
    const result = await db
      .update(bills)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bills.id, id))
      .returning()
    return result[0]
  },

  async delete(id: string) {
    assertServer()
    await db.delete(bills).where(eq(bills.id, id))
  },

  async generateBillNumber(companyId: string, type: "bill" | "quotation"): Promise<string> {
    assertServer()
    const prefix = type === "bill" ? "INV" : "QUO"
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, "0")

    const lastBill = await db
      .select()
      .from(bills)
      .where(
        and(eq(bills.companyId, companyId), eq(bills.type, type), like(bills.billNumber, `${prefix}-${year}${month}%`)),
      )
      .orderBy(desc(bills.billNumber))
      .limit(1)

    let nextNumber = 1
    if (lastBill.length > 0) {
      const lastNumber = lastBill[0].billNumber.split("-").pop()
      nextNumber = Number.parseInt(lastNumber || "0") + 1
    }

    return `${prefix}-${year}${month}${String(nextNumber).padStart(4, "0")}`
  },
}

export const fileUploadService = {
  async getByCategory(companyId: string, category: string) {
    assertServer()
    return await db
      .select()
      .from(fileUploads)
      .where(
        and(
          eq(fileUploads.companyId, companyId),
          eq(fileUploads.fileCategory, category),
          eq(fileUploads.isActive, true),
        ),
      )
      .orderBy(desc(fileUploads.createdAt))
  },

  async create(data: NewFileUpload) {
    assertServer()
    const result = await db.insert(fileUploads).values(data).returning()
    return result[0]
  },

  async delete(id: string) {
    assertServer()
    await db.update(fileUploads).set({ isActive: false, updatedAt: new Date() }).where(eq(fileUploads.id, id))
  },
}
