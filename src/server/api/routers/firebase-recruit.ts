import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { recruitService, firestoreHelpers } from "~/lib/firestore";
import { sendWelcomeEmail } from "~/utils/email";
import { Timestamp } from "firebase/firestore";

export const firebaseRecruitRouter = createTRPCRouter({
  // Submit recruitment form
  submitRecruitForm: publicProcedure
    .input(z.object({
      name: z.string().min(1),
      dateOfBirth: z.string(), // DD/MM/YYYY format
      usn: z.string().min(1),
      yearOfStudy: z.string().min(1),
      branch: z.string().min(1),
      mobileNumber: z.string().min(10),
      personalEmail: z.string().email(),
      collegeEmail: z.string().email().optional(),
      membershipPlan: z.string().min(1),
      csiIdea: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        // Parse DD/MM/YYYY format to Date object
        const dateParts = input.dateOfBirth.split('/');
        if (dateParts.length !== 3) {
          throw new Error("Invalid date format. Expected DD/MM/YYYY");
        }
        
        const day = Number(dateParts[0]);
        const month = Number(dateParts[1]);
        const year = Number(dateParts[2]);
        
        // Validate that all parts are valid numbers
        if (isNaN(day) || isNaN(month) || isNaN(year)) {
          throw new Error("Invalid date values");
        }
        
        const dateOfBirth = Timestamp.fromDate(new Date(year, month - 1, day));

        // Create recruit in Firestore
        const recruitId = await recruitService.create({
          name: input.name,
          dateOfBirth: dateOfBirth,
          usn: input.usn,
          yearOfStudy: input.yearOfStudy,
          branch: input.branch,
          mobileNumber: input.mobileNumber,
          personalEmail: input.personalEmail,
          collegeEmail: input.collegeEmail,
          membershipPlan: input.membershipPlan,
          csiIdea: input.csiIdea,
        });

        // Send welcome email
        try {
          await sendWelcomeEmail(
            input.name,
            input.personalEmail,
            input.membershipPlan,
            input.usn
          );
        } catch (emailError) {
          console.error("Error sending welcome email:", emailError);
          // Don't fail the entire request if email fails
        }
        
        return { success: true, recruitId };
      } catch (error) {
        console.error("Error creating recruit:", error);
        throw new Error("Failed to submit recruit form");
      }
    }),

  // Get all recruits (admin only)
  getAllRecruits: protectedProcedure.query(async () => {
    try {
      const recruits = await firestoreHelpers.getRecruitsByDate();
      return recruits;
    } catch (error) {
      console.error("Error fetching recruits:", error);
      throw new Error("Failed to fetch recruits");
    }
  }),

  // Get recruit by ID
  getRecruitById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      try {
        const recruit = await recruitService.getById(input.id);
        return recruit;
      } catch (error) {
        console.error("Error fetching recruit:", error);
        throw new Error("Failed to fetch recruit");
      }
    }),

  // Update recruit (admin only)
  updateRecruit: protectedProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      dateOfBirth: z.string().optional(), // DD/MM/YYYY format
      usn: z.string().min(1).optional(),
      yearOfStudy: z.string().min(1).optional(),
      branch: z.string().min(1).optional(),
      mobileNumber: z.string().min(10).optional(),
      personalEmail: z.string().email().optional(),
      collegeEmail: z.string().email().optional(),
      membershipPlan: z.string().min(1).optional(),
      csiIdea: z.string().min(1).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const { id, dateOfBirth, ...updateData } = input;
        
        // Convert dateOfBirth if provided
        let dateOfBirthTimestamp: Timestamp | undefined;
        if (dateOfBirth) {
          const dateParts = dateOfBirth.split('/');
          if (dateParts.length === 3) {
            const day = Number(dateParts[0]);
            const month = Number(dateParts[1]);
            const year = Number(dateParts[2]);
            dateOfBirthTimestamp = Timestamp.fromDate(new Date(year, month - 1, day));
          }
        }

        await recruitService.update(id, {
          ...updateData,
          ...(dateOfBirthTimestamp && { dateOfBirth: dateOfBirthTimestamp }),
        });

        return { success: true };
      } catch (error) {
        console.error("Error updating recruit:", error);
        throw new Error("Failed to update recruit");
      }
    }),

  // Delete recruit (admin only)
  deleteRecruit: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      try {
        await recruitService.delete(input.id);
        return { success: true };
      } catch (error) {
        console.error("Error deleting recruit:", error);
        throw new Error("Failed to delete recruit");
      }
    }),

  // Get recruits by branch
  getRecruitsByBranch: publicProcedure
    .input(z.object({ branch: z.string() }))
    .query(async ({ input }) => {
      try {
        const recruits = await recruitService.query([
          { field: 'branch', operator: '==', value: input.branch }
        ]);
        return recruits;
      } catch (error) {
        console.error("Error fetching recruits by branch:", error);
        throw new Error("Failed to fetch recruits by branch");
      }
    }),

  // Get recruits by year of study
  getRecruitsByYear: publicProcedure
    .input(z.object({ yearOfStudy: z.string() }))
    .query(async ({ input }) => {
      try {
        const recruits = await recruitService.query([
          { field: 'yearOfStudy', operator: '==', value: input.yearOfStudy }
        ]);
        return recruits;
      } catch (error) {
        console.error("Error fetching recruits by year:", error);
        throw new Error("Failed to fetch recruits by year");
      }
    }),
}); 