// types.d.ts or src/types.d.ts
import "next/server";
// This ensures the params context type is treated correctly for App Router
declare module "next/server" {
  export interface PageParams {
    params: Record<string, string>;
  }
}
