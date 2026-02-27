import { Schema, model } from "mongoose";

export type UserType = "admin" | "user";

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        type: { type: String, enum: ["admin", "user"], default: "user" },
    },
    { timestamps: true }
);

export const UserModel = model("User", UserSchema);
