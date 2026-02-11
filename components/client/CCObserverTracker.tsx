"use client";

import { useState, useEffect, useMemo } from "react";
import { FaEdit, FaCheck, FaClock, FaChartLine } from "react-icons/fa";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { VIEW_OBSERVER_TRACKER, UPDATE_OBSERVER_TRACKER } from '@/utils/constants';

interface ObserverLog {
  _id: string;
  volunteerId: {
    _id: string;
    firstName: string;
    lastName: string;
    volunteerId: string;
  };
  stage: string;
  orientationCompleted: boolean;
  orientationDate?: string;
  assignedMentor?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedPosition?: string;
  startDate?: string;
  trialDuration: number;
  assignedSchedule: string[];
  evaluations: Array<{
    date: string;
    punctuality: number;
    attitude: number;
    initiative: number;
    participation: number;
    notes?: string;
  }>;
  progressScore: number;
  status: string;
  nextCheckpoint?: string;
}



interface EvaluationForm {
  punctuality: number;
  attitude: number;
  initiative: number;
  participation: number;
  notes: string;
}

export default function CCObserverTracker() {
  const { data: session } = useSession();
  const router = useRouter();
  const [observerLogs, setObserverLogs] = useState<ObserverLog[]>([]);
  const [showEvalForm, setShowEvalForm] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationForm>({
    punctuality: 5,
    attitude: 5,
    initiative: 5,
    participation: 5,
    notes: ''
  });

  const hasViewObserverTrackerPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(VIEW_OBSERVER_TRACKER);
  }, [session]);

  const hasUpdateObserverTrackerPermission = useMemo(() => {
    const permissions = session?.user.permissions ?? [];
    return permissions.includes(UPDATE_OBSERVER_TRACKER);
  }, [session]);

  const isAuthenticated = useMemo(() => {
    return !!session?.user?.username;
  }, [session]);

  useEffect(() => {
    if (session && !hasViewObserverTrackerPermission) {
      router.push('/');
    }
  }, [session, hasViewObserverTrackerPermission, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchObserverLogs();
    }
  }, [isAuthenticated]);

  const fetchObserverLogs = async () => {
    try {
      // Auto-migrate existing observers first
      await fetch('/api/observer-logs/migrate', { method: 'POST' });
      
      // Auto-update observer statuses
      await fetch('/api/observer-logs/auto-update', { method: 'POST' });
      
      const response = await fetch('/api/observer-logs');
      const result = await response.json();
      if (result.success) {
        setObserverLogs(result.data);
      }
    } catch (error) {
      console.error('Error fetching observer logs:', error);
    }
  };

  const addEvaluation = async (logId: string) => {
    try {
      const log = observerLogs.find(l => l._id === logId);
      if (!log) return;

      const response = await fetch('/api/observer-logs/evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: log.volunteerId._id,
          mentorId: log.assignedMentor?._id,
          ...evaluation
        })
      });
      
      if (response.ok) {
        fetchObserverLogs();
        setShowEvalForm(null);
        setEvaluation({
          punctuality: 5,
          attitude: 5,
          initiative: 5,
          participation: 5,
          notes: ''
        });
      }
    } catch (error) {
      console.error('Error adding evaluation:', error);
    }
  };

  const updateStatus = async (logId: string, status: string) => {
    try {
      const response = await fetch('/api/observer-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: logId, status })
      });
      
      if (response.ok) {
        fetchObserverLogs();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updateMilestone = async (logId: string, milestone: string, checked: boolean) => {
    try {
      let updateData: any = { _id: logId };
      
      switch (milestone) {
        case 'orientationCompleted':
          updateData.orientationCompleted = checked;
          if (checked) updateData.stage = 'assignment';
          break;
        case 'assigned':
          if (checked && !observerLogs.find(l => l._id === logId)?.assignedPosition) {
            updateData.assignedPosition = 'FOH';
            updateData.stage = 'monitoring';
          }
          break;
        case 'promoted':
          updateData.status = checked ? 'active' : 'monitoring';
          // Update volunteer status to active
          if (checked) {
            const log = observerLogs.find(l => l._id === logId);
            if (log) {
              await fetch('/api/volunteers/' + log.volunteerId._id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' })
              });
            }
          }
          break;
      }
      
      const response = await fetch('/api/observer-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        fetchObserverLogs();
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'orientation': return 'text-yellow-600';
      case 'orientation_completed': return 'text-blue-600';
      case 'assigned': return 'text-purple-600';
      case 'monitoring': return 'text-orange-600';
      case 'review_pending': return 'text-red-600';
      case 'active': return 'text-green-600';
      case 'inactive': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'orientation': return <FaClock className="text-yellow-500" />;
      case 'assignment': return <FaEdit className="text-blue-500" />;
      case 'monitoring': return <FaChartLine className="text-orange-500" />;
      case 'feedback': return <FaCheck className="text-green-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  return (
    <div className="px-8 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Observer Tracker</h1>
        <span className="text-slate-600 font-medium">{observerLogs.length} observers</span>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {observerLogs.map((log) => (
          <div key={log._id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">
                {log.volunteerId.firstName} {log.volunteerId.lastName}
              </h3>
              <div className="flex items-center gap-2">
                {log.stage !== 'orientation' && getStageIcon(log.stage)}
                <span className={`text-sm font-medium ${getStatusColor(log.status)}`}>
                  {log.status === 'orientation' ? '' : log.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Goal Tracker */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium mb-2">Goal Tracker</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={log.orientationCompleted}
                    onChange={(e) => updateMilestone(log._id, 'orientationCompleted', e.target.checked)}
                    className="w-4 h-4"
                    disabled={!hasUpdateObserverTrackerPermission}
                  />
                  <span className="text-sm">Orientation</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!log.assignedPosition}
                    onChange={(e) => updateMilestone(log._id, 'assigned', e.target.checked)}
                    className="w-4 h-4"
                    disabled={!hasUpdateObserverTrackerPermission}
                  />
                  <span className="text-sm">Assigned</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={log.evaluations.length >= 3}
                    disabled
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Evaluated 3x</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={log.status === 'active'}
                    onChange={(e) => updateMilestone(log._id, 'promoted', e.target.checked)}
                    disabled={!log.orientationCompleted || !log.assignedPosition || log.evaluations.length < 3 || !hasUpdateObserverTrackerPermission}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Promoted {log.status === 'active' ? '🎉' : ''}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">ID:</span>
                <span className="text-sm font-mono">{log.volunteerId.volunteerId}</span>
              </div>
              
              {log.assignedPosition && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Position:</span>
                  <span className="text-sm">{log.assignedPosition}</span>
                </div>
              )}
              
              {log.assignedMentor && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Mentor:</span>
                  <span className="text-sm">{log.assignedMentor.firstName} {log.assignedMentor.lastName}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Progress:</span>
                <span className="text-sm font-semibold">{log.progressScore}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Evaluations:</span>
                <span className="text-sm">{log.evaluations.length}</span>
              </div>
            </div>

            {hasUpdateObserverTrackerPermission && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowEvalForm(log._id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                >
                  Add Evaluation
                </button>
                
                {log.status === 'review_pending' && (
                  <button
                    onClick={() => updateStatus(log._id, 'active')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Approve
                  </button>
                )}
              </div>
            )}

            {showEvalForm === log._id && (
              <div className="mt-4 p-4 bg-gray-50 rounded">
                <h4 className="font-medium mb-3">Add Evaluation</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['punctuality', 'attitude', 'initiative', 'participation'].map(field => (
                    <div key={field}>
                      <label className="text-sm capitalize">{field}:</label>
                      <select
                        value={evaluation[field as keyof EvaluationForm]}
                        onChange={(e) => setEvaluation({...evaluation, [field]: parseInt(e.target.value)})}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <textarea
                  value={evaluation.notes}
                  onChange={(e) => setEvaluation({...evaluation, notes: e.target.value})}
                  placeholder="Notes"
                  className="w-full border rounded px-2 py-1 text-sm mt-2"
                  rows={2}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addEvaluation(log._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowEvalForm(null)}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {observerLogs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No observers found. Volunteers with status &quot;observer&quot; will automatically appear here.</p>
        </div>
      )}
    </div>
  );
}