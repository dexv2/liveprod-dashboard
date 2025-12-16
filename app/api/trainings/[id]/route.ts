import { NextResponse } from 'next/server';
import connectMongoDB from '@/libs/mongodb';
import Training from '@/models/training';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const body = await request.json();
    
    const updatedTraining = await Training.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    ).populate('volunteers', 'name');

    return NextResponse.json({ data: updatedTraining }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}