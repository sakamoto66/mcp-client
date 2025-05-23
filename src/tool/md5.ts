import { LocalToolSchema } from "../types";
import { z } from "zod";
import crypto from 'crypto';

const md5Schema = z.object({
  text: z.string().describe("Text to hash"),
})

export const md5: LocalToolSchema = {
  name: "md5",
  description: "MD5 hash generator",
  params: md5Schema,
  func: async (params:z.infer<typeof md5Schema>):Promise<string> => {
    return crypto.createHash('md5').update(params.text).digest('hex');
  },
};
