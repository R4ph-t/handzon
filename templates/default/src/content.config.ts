import { defineCollection } from "astro:content";
import {
  stepsLoader,
  stepsSchema,
  tutorialsLoader,
  tutorialsSchema,
} from "handzon-ui/collections.ts";

const tutorials = defineCollection({
  loader: tutorialsLoader(),
  schema: tutorialsSchema,
});

const steps = defineCollection({
  loader: stepsLoader(),
  schema: stepsSchema,
});

export const collections = { steps, tutorials };
