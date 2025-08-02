import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { coreService, firestoreHelpers } from "~/lib/firestore";

export const firebaseCoreRouter = createTRPCRouter({
  // Get all core members
  getCoreMembers: publicProcedure.query(async () => {
    try {
      const coreMembers = await firestoreHelpers.getCoreMembers();
      return coreMembers;
    } catch (error) {
      console.error("Error fetching core members:", error);
      throw new Error("Failed to fetch core members");
    }
  }),

  // Get core member by ID
  getCoreMemberById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const coreMember = await coreService.getById(input.id);
        return coreMember;
      } catch (error) {
        console.error("Error fetching core member:", error);
        throw new Error("Failed to fetch core member");
      }
    }),

  // Add new core member (protected - admin only)
  addCoreMember: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      branch: z.string().min(1),
      position: z.string().min(1),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      imageSrc: z.string().url(),
      year: z.number().min(1).max(4),
      order: z.number().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        const coreMemberId = await coreService.create(input);
        return { success: true, id: coreMemberId };
      } catch (error) {
        console.error("Error creating core member:", error);
        throw new Error("Failed to create core member");
      }
    }),

  // Update core member (protected - admin only)
  updateCoreMember: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      branch: z.string().min(1).optional(),
      position: z.string().min(1).optional(),
      linkedin: z.string().url().optional(),
      github: z.string().url().optional(),
      imageSrc: z.string().url().optional(),
      year: z.number().min(1).max(4).optional(),
      order: z.number().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { id, ...updateData } = input;
        await coreService.update(id, updateData);
        return { success: true };
      } catch (error) {
        console.error("Error updating core member:", error);
        throw new Error("Failed to update core member");
      }
    }),

  // Delete core member (protected - admin only)
  deleteCoreMember: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await coreService.delete(input.id);
        return { success: true };
      } catch (error) {
        console.error("Error deleting core member:", error);
        throw new Error("Failed to delete core member");
      }
    }),
}); 