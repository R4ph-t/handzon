import type { ZodString, ZodTypeAny } from "zod";

type ZodLike = {
  string: () => ZodString;
  union: <T extends readonly [ZodTypeAny, ZodTypeAny, ...ZodTypeAny[]]>(schemas: T) => ZodTypeAny;
};

export function createTutorialIconSchema(z: ZodLike, image: () => ZodTypeAny) {
  return z.union([image(), z.string()]);
}
