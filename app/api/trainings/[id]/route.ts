import { NextResponse } from 'next/server';
import connectMongoDB from '@/libs/mongodb';
import Training from '@/models/training';
import Volunteer from '@/models/volunteer';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const training = await Training.findById(params.id).populate('volunteers', 'name');
    if (!training) {
      return NextResponse.json({ message: 'Training not found' }, { status: 404 });
    }
    return NextResponse.json({ data: training }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const { volunteers, removedVolunteers } = body;
    
    const updatedTraining = await Training.findByIdAndUpdate(
      params.id,
      body,
      { new: true }
    ).populate('volunteers', 'name');

    // Update each volunteer's trainings attended
    if (volunteers && volunteers.length > 0) {
      await Volunteer.updateMany(
        { _id: { $in: volunteers } },
        { $addToSet: { "trainingsAttended": params.id } }
      );
    }

    // Remove training from each removed volunteer's trainings attended
    if (removedVolunteers && removedVolunteers.length > 0) {
      await Volunteer.updateMany(
        { _id: { $in: removedVolunteers } },
        { $pull: { "trainingsAttended": params.id } }
      );
    }

    return NextResponse.json({ data: updatedTraining }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await connectMongoDB();
    const training = await Training.findByIdAndDelete(params.id);

    // Update each volunteer's trainings attended
    await Volunteer.updateMany(
      { _id: { $in: training.volunteers } },
      { $pull: { "trainingsAttended": params.id } }
    );

    return NextResponse.json({ message: 'Training deleted successfully' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
