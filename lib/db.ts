import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "arabic_vocab",
  connectionLimit: 10,
  connectTimeout: 5000, // 5 seconds timeout
  waitForConnections: true,
  queueLimit: 0,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function query<T = any>(sql: string, params: any[] = []): Promise<[T[], any]> {
  try {
    const [rows, fields] = await pool.query(sql, params)
    return [rows as T[], fields]
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}


