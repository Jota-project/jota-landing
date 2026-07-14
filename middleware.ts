import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: [
    // Aplica a todo excepto API, _next, _vercel, archivos con extensión, y /components
    "/((?!api|_next|_vercel|components|.*\\..*).*)",
  ],
};
