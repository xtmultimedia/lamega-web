import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
});

export const config = {
  // /admin/login and /admin/invite must stay public: the invitee has no session
  // yet when setting their first password.
  matcher: ["/admin", "/admin/((?!login|invite).*)"],
};
