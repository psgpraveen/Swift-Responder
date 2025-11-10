"use server";

import { suggestBestHospitals } from "../ai/flows/suggest-best-hospitals";
import type {
  SuggestBestHospitalsInput,
  SuggestBestHospitalsOutput,
} from "../ai/flows/suggest-best-hospitals";
import { z } from "zod";

const FormSchema = z.object({
  needs: z
    .string()
    .min(3, { message: "Medical need must be at least 3 characters." }),
  location: z
    .string()
    .min(3, { message: "Location must be at least 3 characters." }),
});

export type State = {
  errors?: {
    needs?: string[];
    location?: string[];
  };
  message?: string | null;
  data?: SuggestBestHospitalsOutput | null;
};

export async function getHospitalSuggestions(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = FormSchema.safeParse({
    needs: formData.get("needs"),
    location: formData.get("location"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid input. Please check the fields.",
    };
  }

  try {
    const results = await suggestBestHospitals(
      validatedFields.data as SuggestBestHospitalsInput
    );
    if (results && results.length > 0) {
      return { message: "Suggestions found.", data: results };
    } else {
      return {
        message: "No suitable hospitals found for the given criteria.",
        data: [],
      };
    }
  } catch (error) {
    console.error("AI flow error:", error);
    return {
      message:
        "An error occurred while fetching suggestions. Please try again later.",
    };
  }
}
