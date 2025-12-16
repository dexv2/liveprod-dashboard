"use client";

import { useState, useEffect } from "react";
import GCInputTextWithLabel from "@/components/global/GCInputTextWithLabel";

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

export default function CCTrainingManager({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [newTraining, setNewTraining] = useState<Training>({
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
  const [editingTraining, setEditingTraining] = useState<Training | null>(null);
  const [editSelectedVolunteers, setEditSelectedVolunteers] = useState<string[]>([]);

  useEffect(() => {
    fetchTrainings();
    fetchVolunteers();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch('/api/trainings');
      const result = await response.json();
      setTrainings(result.data || []);
    } catch (error) {
      console.error('Error fetching trainings:', error);
    }
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

  const addTrainor = () => {
    setNewTraining({
      ...newTraining,
      trainors: [...newTraining.trainors, ""]
    });
  };

  const removeTrainor = (index: number) => {
    const updatedTrainors = newTraining.trainors.filter((_, i) => i !== index);
    setNewTraining({
      ...newTraining,
      trainors: updatedTrainors.length > 0 ? updatedTrainors : [""]
    });
  };

  const updateTrainor = (index: number, value: string) => {
    const updatedTrainors = [...newTraining.trainors];
    updatedTrainors[index] = value;
    setNewTraining({
      ...newTraining,
      trainors: updatedTrainors
    });
  };

  const handleVolunteerSelection = (volunteerId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedVolunteers([...selectedVolunteers, volunteerId]);
    } else {
      setSelectedVolunteers(selectedVolunteers.filter(id => id !== volunteerId));
    }
  };

  const handleSubmit = async () => {
    try {
      const trainingData = {
        ...newTraining,
        trainors: newTraining.trainors.filter(trainor => trainor.trim() !== ""),
        volunteers: selectedVolunteers
      };

      const response = await fetch('/api/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainingData)
      });

      if (response.ok) {
        fetchTrainings();
        setNewTraining({
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
        setSelectedVolunteers([]);
      }
    } catch (error) {
      console.error('Error creating training:', error);
    }
  };

  return (
    <div className="w-full">


      {isAuthenticated && (
        <div className="p-4 bg-slate-50 border-b">
          <h3 className="text-lg font-semibold mb-4">Add New Training</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              label="Training Name"
              value={newTraining.trainingName}
              onChange={(e) => setNewTraining({...newTraining, trainingName: e.target.value})}
            />
            <GCInputTextWithLabel
              label="Date"
              type="date"
              value={newTraining.date}
              onChange={(e) => setNewTraining({...newTraining, date: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              label="Start Time"
              type="time"
              value={newTraining.startTime || ""}
              onChange={(e) => setNewTraining({...newTraining, startTime: e.target.value})}
            />
            <GCInputTextWithLabel
              label="End Time"
              type="time"
              value={newTraining.endTime || ""}
              onChange={(e) => setNewTraining({...newTraining, endTime: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <GCInputTextWithLabel
              label="Venue"
              value={newTraining.venue || ""}
              onChange={(e) => setNewTraining({...newTraining, venue: e.target.value})}
            />
            <div>
              <label className="block text-sm font-medium mb-1">Training Type</label>
              <select
                value={newTraining.trainingType || ""}
                onChange={(e) => setNewTraining({...newTraining, trainingType: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">Select training type</option>
                <option value="Technical">Technical</option>
                <option value="Orientation">Orientation</option>
                <option value="Refresher">Refresher</option>
                <option value="Advanced">Advanced</option>
                <option value="Workshop">Workshop</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <GCInputTextWithLabel
              label="Training Description"
              value={newTraining.description || ""}
              onChange={(e) => setNewTraining({...newTraining, description: e.target.value})}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Trainors:</label>
            {newTraining.trainors.map((trainor, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={trainor}
                  onChange={(e) => updateTrainor(index, e.target.value)}
                  placeholder={`Trainor ${index + 1} name`}
                  className="flex-1 p-2 border border-gray-300 rounded"
                />
                {newTraining.trainors.length > 1 && (
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
              Add Trainor
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

          <button
            onClick={handleSubmit}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Training
          </button>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Training Records</h3>
        {trainings.length === 0 ? (
          <p className="text-gray-500">No training records found.</p>
        ) : (
          <div className="space-y-4">
            {trainings.map((training) => (
              <div key={training._id} className="border border-gray-300 rounded p-4">
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
                    {isAuthenticated && (
                      <button
                        onClick={() => {
                          setEditingTraining(training);
                          setEditSelectedVolunteers(training.volunteers.map(v => v._id));
                        }}
                        className="mt-2 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div>
                    <h5 className="font-medium mb-1">Trainors:</h5>
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
              <div>
                <label className="block text-sm font-medium mb-1">Training Type</label>
                <select
                  value={editingTraining.trainingType || ""}
                  onChange={(e) => setEditingTraining({...editingTraining, trainingType: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">Select training type</option>
                  <option value="Technical">Technical</option>
                  <option value="Orientation">Orientation</option>
                  <option value="Refresher">Refresher</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Workshop">Workshop</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <GCInputTextWithLabel
                label="Training Description"
                value={editingTraining.description || ""}
                onChange={(e) => setEditingTraining({...editingTraining, description: e.target.value})}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Trainors:</label>
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
                Add Trainor
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