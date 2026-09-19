import React, { useState } from 'react';
import { submitReport } from '../api/reports';

export default function ReportIntake() {
  const [text, setText] = useState('');
  const [source, setSource] = useState('citizen');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await submitReport({ text, source });
      setStatus({ type: 'success', message: 'Report submitted successfully!' });
      setText('');
    } catch (err) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Emergency Report</h2>
      
      {status && (
        <div className={`p-4 mb-6 rounded-md ${status.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
          <select 
            value={source} 
            onChange={e => setSource(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
          >
            <option value="citizen">Citizen</option>
            <option value="sensor">Sensor</option>
            <option value="field_team">Field Team</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Details (Text / Voice Transcript)</label>
          <textarea 
            value={text} 
            onChange={e => setText(e.target.value)}
            required
            rows={4}
            className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
            placeholder="E.g. Flood at Alkapuri crossing, need boats..."
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !text.trim()}
          className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}
