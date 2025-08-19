import jwt from "jsonwebtoken";

const dbUrl = "postgresql://postgres.dilzqtokckgaedjdroyq:reizend@123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const secret = "my-secret-key";

const token = jwt.sign(
  { dbUrl },
  secret,
  { expiresIn: "10h" } // expires in 1 hour
);

console.log("DB URL Token:", token);
