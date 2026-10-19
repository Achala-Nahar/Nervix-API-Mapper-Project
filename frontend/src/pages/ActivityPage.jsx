import React, { useState } from 'react';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const activities = [
  { type: 'update', color: 'bg-success', text: "Service 'Payment Service' was updated", date: 'May 17, 2:15 PM', user: 'Krishna Singh' },
  { type: 'add', color: 'bg-success', text: "Dependency 'Payment → Inventory' was added", date: 'May 17, 2:10 PM', user: 'John Doe' },
  { type: 'create', color: 'bg-warning', text: "Service 'Email Service' was created", date: 'May 17, 1:45 PM', user: 'Smith Johnson' },
  { type: 'blast', color: 'bg-danger', text: 'Blast radius analysis was executed', date: 'May 17, 1:30 PM', user: 'Krishna Singh' },
  { type: 'update', color: 'bg-success', text: 'Project settings were updated', date: 'May 17, 12:30 PM', user: 'Krishna Singh' },
  { type: 'add', color: 'bg-success', text: "Service 'Auth Service' was added to the project", date: 'May 16, 4:20 PM', user: 'John Doe' },
  { type: 'update', color: 'bg-warning', text: "Dependency 'Auth → User' type was updated to REST API", date: 'May 16, 3:10 PM', user: 'Smith Johnson' },
  { type: 'delete', color: 'bg-danger', text: "Service 'Legacy API' was removed from the project", date: 'May 16, 11:45 AM', user: 'Krishna Singh' },
  { type: 'create', color: 'bg-success', text: "New team member 'Emily Davis' was invited", date: 'May 15, 9:30 AM', user: 'Krishna Singh' },
  { type: 'update', color: 'bg-warning', text: 'Blast radius analysis triggered for Inventory Service', date: 'May 15, 8:00 AM', user: 'John Doe' },
];

export default function ActivityPage({ onBack }) {
  const [filter, setFilter] = useState('All Activities');
  const [timeRange, setTimeRange] = useState('Last 7 Days');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-dark-card-2 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Activity Log</h1>
          <p className="text-sm text-text-muted mt-0.5">Track all changes in your project</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option>All Activities</option>
              <option>Service Updates</option>
              <option>Dependency Changes</option>
              <option>Team Changes</option>
              <option>Settings Updates</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 bg-dark-card-2 border border-dark-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-primary"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Last 3 Months</option>
              <option>All Time</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
        <div className="divide-y divide-dark-border">
          {activities.map((activity, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-dark-card-2/40 transition-colors">
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${activity.color}`}></div>
              <div className="flex-1 text-sm text-text-secondary">{activity.text}</div>
              <div className="text-sm text-text-muted w-36 text-right">{activity.date}</div>
              <div className="text-sm text-text-primary font-medium w-32 text-right">{activity.user}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
