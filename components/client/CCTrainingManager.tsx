"use client";

import { useState, useEffect, useMemo, use } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { VIEW_TRAINING, UPDATE_TRAINING } from '@/utils/constants';
import GCSelect from '../global/GCSelect';
import { IoMdCloseCircle } from 'react-icons/io';
import { deleteTrainingData } from '@/utils/apis/delete';
import GCLoading from '../global/GCLoading';
import { getAllTrainings } from '@/utils/apis/get';

interface Training {
  _id?: string;
  trainingName: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  trainingType?: string;
  trainors: string[];
  volunteers: { _id: string; name: string }[];
  createdAt?: string;
}

interface Volunteer {
  _id: string;
  name: string;
}

export default function CCTrainingManager() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathName = usePathname();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [editSelectedVolunteers, setEditSelectedVolunteers] = useState<string[]>([]);
  const [newPath, setNewPath] = useState<string>(pathName);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const hasViewTrainingPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_TRAINING);
  }, [session]);

  const hasUpdateTrainingPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(UPDATE_TRAINING);
  }, [session]);

  useEffect(() => {
    const url = `${pathName}`
    const prevPath = newPath;
    setNewPath(url);

    if (pathName.startsWith('/volunteer/training') && prevPath.startsWith('/add-training')) {
      fetchTrainings();
    }
  }, [pathName, newPath]);

  useEffect(() => {
    if (!hasViewTrainingPermission) {
      router.push('/');
    }
  }, [hasViewTrainingPermission, router]);

  useEffect(() => {
    fetchTrainings();
    fetchVolunteers();
  }, []);

  const fetchTrainings = async () => {
    setIsLoading(true);
    const result = await getAllTrainings();
    setTrainings(result.data || []);
    setIsLoading(false);
  };

  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers');
      const result = await response.json();
      setVolunteers(result.data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const addNewTraining = () => {
    router.push('/add-training/new');
  }

  const deleteTraining = async (trainingId?: string) => {
    if (!trainingId) return;

    if (confirm("Are you sure you want to delete this training record?")) {
      await deleteTrainingData(trainingId);
      fetchTrainings();
    }
  }

  return (
    <div className='w-full'>
      {isLoading && <GCLoading />}
      <div className="pt-4">
        <div className='bg-slate-800 rounded-t-lg border border-slate-800 flex justify-between items-center px-6'>
          <h2 className="text-lg text-white font-semibold py-3">Training Records</h2>
          <button onClick={addNewTraining} className='text-white bg-slate-600 px-3 py-1 bg-opacity-80 rounded-md'>Add New Training</button>
        </div>
        <div className='bg-slate-100 rounded-b-lg p-4'>
          {trainings.length === 0 ? (
            <p className="text-gray-500">No training records found.</p>
            ) : (
              <div className="space-y-4">
                {trainings.map((training) => (
                  <div key={training._id} className="border border-gray-300 rounded-2xl p-4 relative">
                    <div className='absolute top-1 right-1 cursor-pointer text-slate-700 hover:text-rose-600'>
                      <IoMdCloseCircle
                        size={24}
                        onClick={() => deleteTraining(training?._id)}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <h4 className="font-semibold text-lg">{training.trainingName}</h4>
                        <p className="text-gray-600">
                          {new Date(training.date).toLocaleDateString()}
                        </p>
                        {training.startTime && training.endTime && (
                          <p className="text-sm text-gray-600">
                            {training.startTime} - {training.endTime}
                          </p>
                        )}
                        {training.venue && (
                          <p className="text-sm text-gray-600">📍 {training.venue}</p>
                        )}
                        {training.trainingType && (
                          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mt-1">
                            {training.trainingType}
                          </span>
                        )}
                        {training.description && (
                          <p className="text-sm text-gray-500 mt-1">{training.description}</p>
                        )}
                        {hasUpdateTrainingPermission && (
                          <button
                            onClick={() => {
                              router.push(`/add-training/${training._id}`);
                              // setEditingTraining(training);
                              // setEditSelectedVolunteers(training.volunteers.map(v => v._id));
                            }}
                            className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Trainers:</h5>
                        <ul className="text-sm text-gray-600">
                          {training.trainors.map((trainor, index) => (
                            <li key={index}>• {trainor}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Volunteers ({training.volunteers.length}):</h5>
                        <div className="text-sm text-gray-600 max-h-20 overflow-y-auto">
                          {training.volunteers.map((volunteer, index) => (
                            <div key={volunteer._id}>• {volunteer.name}</div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Total Attendees:</h5>
                        <p className="text-lg font-semibold text-gray-700">
                          {training.trainors.filter(t => t.trim() !== "").reduce((count, trainor) => {
                            return count + trainor.split(';').filter(name => name.trim() !== "").length;
                          }, 0) + training.volunteers.length}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {editingTraining && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Training</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <GCInputTextWithLabel
                label="Training Name"
                value={editingTraining.trainingName}
                onChange={(e) => setEditingTraining({...editingTraining, trainingName: e.target.value})}
              />
              <GCInputTextWithLabel
                label="Date"
                type="date"
                value={editingTraining.date}
                onChange={(e) => setEditingTraining({...editingTraining, date: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <GCInputTextWithLabel
                label="Start Time"
                type="time"
                value={editingTraining.startTime || ""}
                onChange={(e) => setEditingTraining({...editingTraining, startTime: e.target.value})}
              />
              <GCInputTextWithLabel
                label="End Time"
                type="time"
                value={editingTraining.endTime || ""}
                onChange={(e) => setEditingTraining({...editingTraining, endTime: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <GCInputTextWithLabel
                label="Venue"
                value={editingTraining.venue || ""}
                onChange={(e) => setEditingTraining({...editingTraining, venue: e.target.value})}
              />
              <GCSelect
                label="Training Type" 
                value={editingTraining.trainingType || ""} 
                onChange={(e) => setEditingTraining({...editingTraining, trainingType: e.target.value})}
                options={["Technical", "Orientation", "Refresher", "Advanced", "Workshop", "Others"]}
              />
            </div>
            
            <div className="mb-4">
              <GCInputTextWithLabel
                label="Training Description"
                value={editingTraining.description || ""}
                onChange={(e) => setEditingTraining({...editingTraining, description: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Trainers:</label>
              {editingTraining.trainors.map((trainor, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={trainor}
                    onChange={(e) => {
                      const updatedTrainors = [...editingTraining.trainors];
                      updatedTrainors[index] = e.target.value;
                      setEditingTraining({...editingTraining, trainors: updatedTrainors});
                    }}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  {editingTraining.trainors.length > 1 && (
                    <button
                      onClick={() => {
                        const updatedTrainors = editingTraining.trainors.filter((_, i) => i !== index);
                        setEditingTraining({...editingTraining, trainors: updatedTrainors});
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setEditingTraining({...editingTraining, trainors: [...editingTraining.trainors, ""]})}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Trainer
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Volunteers:</label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded p-2">
                {volunteers.sort((a, b) => a.name.localeCompare(b.name)).map((volunteer) => (
                  <label key={volunteer._id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={editSelectedVolunteers.includes(volunteer._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditSelectedVolunteers([...editSelectedVolunteers, volunteer._id]);
                        } else {
                          setEditSelectedVolunteers(editSelectedVolunteers.filter(id => id !== volunteer._id));
                        }
                      }}
                      className="mr-2"
                    />
                    {volunteer.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`/api/trainings/${editingTraining._id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...editingTraining,
                        trainors: editingTraining.trainors.filter(t => t.trim() !== ""),
                        volunteers: editSelectedVolunteers
                      })
                    });
                    
                    if (response.ok) {
                      fetchTrainings();
                      setEditingTraining(null);
                      setEditSelectedVolunteers([]);
                    }
                  } catch (error) {
                    console.error('Error updating training:', error);
                  }
                }}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Save Changes
              </button>
              <button
                onClick={() => {
                  setEditingTraining(null);
                  setEditSelectedVolunteers([]);
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}