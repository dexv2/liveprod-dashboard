import connectMongoDB from "@/libs/mongodb"
import { loginSchema } from "@/libs/zod";
import Admin from "@/models/admin"
import { configs } from "@/utils/constants";
import { saltAndHashPassword } from "@/utils/password";
import { NextResponse } from "next/server";

export async function POST(request: any, { params }: { params: { secretKey: string } }) {
  try {
    if (params.secretKey !== configs.ADMIN_SECRET_KEY) {
      throw new Error("Invalid secret key.");
    }

    const { username, password } = await loginSchema.parseAsync(await request.json());
    const hashedPassword = await saltAndHashPassword(password);
    await connectMongoDB();
    await Admin.create({ username, password: hashedPassword });

    return NextResponse.json({ message: `Admin "${username}" created.` }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: `An error occurred while registering the user: ${error.message}` }, { status: 500 });
  }
}
