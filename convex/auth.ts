import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";
import { convexAuth } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password,
    Anonymous,
  ],
});

// Get current authenticated user
export const getCurrentUser = query({
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return null;
    }

    // Get user document from database
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    return {
      userId: userId,
      email: user.email || null,
      name: user.name || (user.isAnonymous ? 'Anonymous User' : null),
      pictureUrl: user.picture || null,
      isAnonymous: user.isAnonymous || false,
    };
  },
});
