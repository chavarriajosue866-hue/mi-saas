import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// ✅ Re-exportamos authOptions para que los demás archivos no fallen
export { authOptions };

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };