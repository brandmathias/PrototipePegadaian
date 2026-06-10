"use client";

import { createAuthClient } from "better-auth/react";

// Auth routes are served by the same Next.js app, so let Better Auth use the
// current browser origin instead of baking a Docker build-time URL into JS.
export const authClient = createAuthClient();
