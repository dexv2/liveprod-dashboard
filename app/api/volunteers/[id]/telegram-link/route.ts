import { auth } from "@/auth";
import connectMongoDB from "@/libs/mongodb";
import {
  generateTelegramLink,
  getTelegramLinkStatus,
  TelegramLinkError,
  unlinkVolunteerTelegram
} from "@/services/telegram/telegramLinkService";
import { AssignmentAuthenticationError } from "@/utils/assignmentAuth";
import { requireTelegramLinkAdmin } from "@/utils/telegram/telegramLinkAuth";
import { NextResponse } from "next/server";

function errorResponse(error: unknown) {
  if (error instanceof AssignmentAuthenticationError || error instanceof TelegramLinkError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }
  console.error("Telegram link operation failed");
  return NextResponse.json({ message: "Telegram link operation failed" }, { status: 500 });
}

async function authorizedAdminId() {
  return requireTelegramLinkAdmin(await auth());
}

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const createdBy = await authorizedAdminId();
    return NextResponse.json(await generateTelegramLink({ volunteerId: params.id, createdBy }), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    await authorizedAdminId();
    return NextResponse.json(await getTelegramLinkStatus(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    await authorizedAdminId();
    return NextResponse.json(await unlinkVolunteerTelegram(params.id));
  } catch (error) {
    return errorResponse(error);
  }
}
