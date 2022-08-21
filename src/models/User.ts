import { Schema, model } from "mongoose";

// 1. Create an interface representing a document in MongoDB.
interface IUser {
  username: string;
  joined_at: Date;
}

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  joined_at: { type: Date, required: true },
});

// 3. Create a Model.
const User = model<IUser>("User", userSchema);

export default User;
