import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { userService, firestoreHelpers } from "~/lib/firestore";

export const firebaseUserRouter = createTRPCRouter({
  // Get user data by ID
  getUserData: publicProcedure
    .input(z.object({ userid: z.string() }))
    .query(async ({ input }) => {
      try {
        const user = await userService.getById(input.userid);
        return user;
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw new Error("Failed to fetch user data");
      }
    }),

  // Get user by email
  getUserByEmail: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .query(async ({ input }) => {
      try {
        const users = await firestoreHelpers.getUserByEmail(input.email);
        return users[0] || null; // Return first user or null
      } catch (error) {
        console.error("Error fetching user by email:", error);
        throw new Error("Failed to fetch user by email");
      }
    }),

  // Get user by username
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      try {
        const users = await firestoreHelpers.getUserByUsername(input.username);
        return users[0] || null; // Return first user or null
      } catch (error) {
        console.error("Error fetching user by username:", error);
        throw new Error("Failed to fetch user by username");
      }
    }),

  // Edit user data
  editUserData: publicProcedure
    .input(z.object({
      userid: z.string(),
      name: z.string().min(1),
      bio: z.string(),
      phone: z.string(),
      branch: z.string(),
      github: z.string().url(),
      linkedin: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { userid, ...updateData } = input;
        await userService.update(userid, updateData);
        return { success: true };
      } catch (error) {
        console.error("Error updating user data:", error);
        throw new Error("Failed to update user data");
      }
    }),

  // Create new user (for Firebase Auth integration)
  createUser: publicProcedure
    .input(z.object({
      id: z.string(), // Firebase Auth UID
      name: z.string().optional(),
      email: z.string().email().optional(),
      image: z.string().url().optional(),
      username: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Check if user already exists
        const existingUser = await userService.getById(input.id);
        if (existingUser) {
          return { success: true, id: input.id, message: "User already exists" };
        }

        // Create new user
        const userId = await userService.create({
          id: input.id,
          name: input.name,
          email: input.email,
          image: input.image,
          username: input.username,
          role: "user",
          isAdmin: false,
        });

        return { success: true, id: userId };
      } catch (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user");
      }
    }),

  // Update user profile picture
  updateProfilePicture: protectedProcedure
    .input(z.object({
      userid: z.string(),
      imageUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        await userService.update(input.userid, { image: input.imageUrl });
        return { success: true };
      } catch (error) {
        console.error("Error updating profile picture:", error);
        throw new Error("Failed to update profile picture");
      }
    }),

  // Get all users (admin only)
  getAllUsers: protectedProcedure.query(async () => {
    try {
      const users = await userService.getAll();
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw new Error("Failed to fetch users");
    }
  }),

  // Update user role (admin only)
  updateUserRole: protectedProcedure
    .input(z.object({
      userid: z.string(),
      role: z.enum(["user", "admin", "moderator"]),
      isAdmin: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { userid, ...updateData } = input;
        await userService.update(userid, updateData);
        return { success: true };
      } catch (error) {
        console.error("Error updating user role:", error);
        throw new Error("Failed to update user role");
      }
    }),
}); 