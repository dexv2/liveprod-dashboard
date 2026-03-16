import { NextResponse } from 'next/server';
import connectMongoDB from '@/libs/mongodb';
import Training from '@/models/training';
import Volunteer from '@/models/volunteer';

export async function GET() {
  try {
    await connectMongoDB();
    const trainings = await Training.find({})
      .populate('volunteers', 'name')
      .sort({ date: -1 });
    
    return NextResponse.json({ data: trainings }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectMongoDB();
    const body = await request.json();
    const { trainingName, date, description, trainors, volunteers, startTime, endTime, venue, trainingType } = body;

    // Create the training
    const training = await Training.create({
      trainingName,
      description,
      date: new Date(date),
      startTime,
      endTime,
      venue,
      trainingType,
      trainors,
      volunteers
    });

    // Update each volunteer's trainings attended
    if (volunteers && volunteers.length > 0) {
      await Volunteer.updateMany(
        { _id: { $in: volunteers } },
        { $addToSet: { "trainingsAttended": training._id } }
      );
    }

    const populatedTraining = await Training.findById(training._id)
      .populate('volunteers', 'name');

    return NextResponse.json({ data: populatedTraining }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating training:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}