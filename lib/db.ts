import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var __mongoose: Promise<typeof mongoose> | undefined;
}

export async function db() {
  if (!global.__mongoose) {
    global.__mongoose = mongoose.connect(process.env.MONGODB_URI!, {
      dbName: process.env.MONGODB_DB,
    });
  }
  return global.__mongoose;
}
