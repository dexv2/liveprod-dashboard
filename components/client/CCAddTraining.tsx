"use client";

import { UPDATE_TRAINING } from '@/utils/constants';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import GCInputTextWithLabel from '../global/GCInputTextWithLabel';
import { postAddTraining } from '@/utils/apis/post';
import GCSelect from '../global/GCSelect';
import { getTrainingById } from '@/utils/apis/get';
import { formatDateISO } from '@/utils/helpers';
import GCLoading from '../global/GCLoading';
import { putUpdateTraining } from '@/utils/apis/put';
import { toast } from 'react-toastify';

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
  volunteers: string[];
}

interface Volunteer {
  _id: string;
  name: string;
}

export default function CCAddTraining({ volunteers, id }: { volunteers: Volunteer[], id: string }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [training, setTraining] = useState<Training>({
    trainingName: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    trainingType: "",
    trainors: [""],
    volunteers: []
  });
  const [selectedVolunteers, setSelectedVolunteers] = useState<string[]>([]);
  const [removedVolunteers, setRemovedVolunteers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchTraining = async (id: string) => {
    setIsLoading(true);
    const response = await getTrainingById(id);
    if (response?.data) {
      setTraining(response.data);
      setSelectedVolunteers(response.data.volunteers.map((v: { _id: string }) => v._id));
    }
    setIsLoading(false);
  }

  useEffect(() => {
    if (id === "new") return;
    fetchTraining(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const hasUpdateTrainingPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(UPDATE_TRAINING);
  }, [session]);

  const closeModal = () => {
    router.back();
  }

  const addTrainor = () => {
    setTraining({
      ...training,
      trainors: [...training.trainors, ""]
    });
  };

  const removeTrainor = (index: number) => {
    const updatedTrainors = training.trainors.filter((_, i) => i !== index);
    setTraining({
      ...training,
      trainors: updatedTrainors.length > 0 ? updatedTrainors : [""]
    });
  };

  const updateTrainor = (index: number, value: string) => {
    const updatedTrainors = [...training.trainors];
    updatedTrainors[index] = value;
    setTraining({
      ...training,
      trainors: updatedTrainors
    });
  };

  const handleVolunteerSelection = (volunteerId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedVolunteers([...selectedVolunteers, volunteerId]);
      setRemovedVolunteers(removedVolunteers.filter(id => id !== volunteerId));
    } else {
      setRemovedVolunteers([...removedVolunteers, volunteerId]);
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
    }
  };

  const validateRequiredFields = (trainingData: Training): boolean => {
    if (!trainingData.date) {
      toast.error("Please select a date for the training");
      return false;
    } else if (!trainingData.trainingName) {
      toast.error("Please enter a training name");
      return false;
    } else if (trainingData.trainors.length === 0) {
      toast.error("Please add at least one trainer");
      return false;
    }
    return true;
  }

  const handleSubmit = async () => {
    try {
      const trainingData: Training = {
        ...training,
        trainors: training.trainors.filter(trainor => trainor.trim() !== ""),
        volunteers: selectedVolunteers
      };

      if (!validateRequiredFields(trainingData)) return;

      await postAddTraining(trainingData);
      closeModal();
    } catch (error) {
      console.error('Error training creation:', error);
    }
  };

  const updateTraining = async (trainingId: string) => {
    try {
      const trainingData = {
        ...training,
        trainors: training.trainors.filter(trainor => trainor.trim() !== ""),
        volunteers: selectedVolunteers,
        removedVolunteers: removedVolunteers
      };

      if (!validateRequiredFields(trainingData)) return;

      await putUpdateTraining(trainingId, trainingData);
      closeModal();
    } catch (error) {
      console.error('Error training update:', error);
    }
  }

  return (
    <div className="w-full">
      {isLoading && <GCLoading />}
      {hasUpdateTrainingPermission && (
        <div className="p-4 bg-slate-50 border-b">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              required
              label="Training Name"
              value={training.trainingName}
              onChange={(e) => setTraining({...training, trainingName: e.target.value})}
            />
            <GCInputTextWithLabel
              required
              label="Date"
              type="date"
              value={formatDateISO(training.date)}
              onChange={(e) => setTraining({...training, date: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              label="Start Time"
              type="time"
              value={training.startTime || ""}
              onChange={(e) => setTraining({...training, startTime: e.target.value})}
            />
            <GCInputTextWithLabel
              label="End Time"
              type="time"
              value={training.endTime || ""}
              onChange={(e) => setTraining({...training, endTime: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              label="Venue"
              value={training.venue || ""}
              onChange={(e) => setTraining({...training, venue: e.target.value})}
            />
            <GCSelect
              label="Training Type" 
              value={training.trainingType || ""} 
              onChange={(e) => setTraining({...training, trainingType: e.target.value})}
              options={["Technical", "Orientation", "Refresher", "Advanced", "Workshop", "Others"]}
            />
          </div>
          
          <div className="mb-4">
            <GCInputTextWithLabel
              label="Training Description"
              value={training.description || ""}
              onChange={(e) => setTraining({...training, description: e.target.value})}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Trainers:</label>
            {training.trainors.map((trainor, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  required
                  type="text"
                  value={trainor}
                  onChange={(e) => updateTrainor(index, e.target.value)}
                  placeholder={`Trainer ${index + 1} name`}
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                {training.trainors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTrainor(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addTrainor}
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
                    checked={selectedVolunteers.includes(volunteer._id)}
                    onChange={(e) => handleVolunteerSelection(volunteer._id, e.target.checked)}
                    className="mr-2"
                  />
                  {volunteer.name}
                </label>
              ))}
            </div>
          </div>
          
          {training?._id ? (
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={() => updateTraining(training._id as string)}
            >
              Update Training
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Training
            </button>
          )}
        </div>
      )}
    </div>
  );
}