import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const developmentPaths = ['/test'];
  const currentPath = req.nextUrl.pathname;
  const isDevelopmentPath = developmentPaths.some(path => currentPath.startsWith(path));
  const isProduction = process.env.NODE_ENV === 'production';
  if (isDevelopmentPath && isProduction) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}
