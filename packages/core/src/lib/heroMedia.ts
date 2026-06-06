import { z as defaultZ } from "zod";

type SchemaBuilder = typeof defaultZ;
type ImageSchemaFactory = () => unknown;

export function createHeroMediaSchema(
  schema: SchemaBuilder = defaultZ,
  image?: ImageSchemaFactory,
) {
  const imageSrc = image
    ? schema.union([image() as never, schema.string().min(1)])
    : schema.string().min(1);

  return schema.discriminatedUnion("kind", [
    schema
      .object({
        kind: schema.literal("image"),
        src: imageSrc,
        alt: schema.string().min(1),
        caption: schema.string().min(1).optional(),
      })
      .strict(),
    schema
      .object({
        kind: schema.literal("video"),
        src: schema.string().min(1),
        title: schema.string().min(1),
        aspect: schema.string().min(1).default("16/9"),
        type: schema.enum(["iframe", "video"]).default("iframe"),
        caption: schema.string().min(1).optional(),
      })
      .strict(),
  ]);
}

export const heroMediaSchema = createHeroMediaSchema();
export type HeroMedia = defaultZ.infer<typeof heroMediaSchema>;
