import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { propertyLimitsService, PropertyLimits } from '../lib/propertyLimitsService';

const AdminPropertyLimits: React.FC = () => {
  const [limits, setLimits] = useState<PropertyLimits>({
    max_bedrooms: 25,
    max_guests: 100,
    max_bathrooms: 100,
    max_property_size: 50000,
    max_beds_per_type: {
      singleBed: 25,
      doubleBed: 25,
      largeBed: 25,
      extraLargeBed: 25,
      bunkBed: 25,
      sofaBed: 25,
      futonMat: 25
    },
    max_total_beds_per_room: 25
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await propertyLimitsService.getPropertyLimits();
      
      if (result.success && result.limits) {
        setLimits(result.limits);
      } else {
        throw new Error(result.error || 'Failed to fetch property limits');
      }
    } catch (err: any) {
      console.error('Error fetching limits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const result = await propertyLimitsService.updatePropertyLimits(limits);
      
      if (result.success) {
        setSuccessMessage('Property limits updated successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to update property limits');
      }
    } catch (err: any) {
      console.error('Error saving limits:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (key: keyof PropertyLimits, value: string) => {
    setLimits(prev => ({
      ...prev,
      [key]: parseInt(value) || 0
    }));
  };

  const updateBedTypeLimit = (bedType: string, value: string) => {
    setLimits(prev => ({
      ...prev,
      max_beds_per_type: {
        ...prev.max_beds_per_type,
        [bedType]: parseInt(value) || 0
      }
    }));
  };

  const resetToDefaults = () => {
    if (window.confirm('Are you sure you want to reset all limits to default values?')) {
      setLimits({
        max_bedrooms: 25,
        max_guests: 100,
        max_bathrooms: 100,
        max_property_size: 50000,
        max_beds_per_type: {
          singleBed: 25,
          doubleBed: 25,
          largeBed: 25,
          extraLargeBed: 25,
          bunkBed: 25,
          sofaBed: 25,
          futonMat: 25
        },
        max_total_beds_per_room: 25
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property limits...</p>
        </div>
      </div>
    );
  }

  const bedTypes = [
    { key: 'singleBed', label: 'Single Bed', description: '90-130 cm wide' },
    { key: 'doubleBed', label: 'Double Bed', description: '131-150 cm wide' },
    { key: 'largeBed', label: 'Large Bed (King)', description: '151-180 cm wide' },
    { key: 'extraLargeBed', label: 'Extra-Large Bed (Super-King)', description: '181-210 cm wide' },
    { key: 'bunkBed', label: 'Bunk Bed', description: 'Variable size' },
    { key: 'sofaBed', label: 'Sofa Bed', description: 'Variable size' },
    { key: 'futonMat', label: 'Futon Mat', description: 'Variable size' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Property Limits Settings</h2>
          <p className="text-gray-600 mt-1">Configure maximum limits for property listings</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLimits}
            className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Basic Limits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Basic Property Limits</h3>
          <Settings className="h-5 w-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Bedrooms
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={limits.max_bedrooms}
              onChange={(e) => updateLimit('max_bedrooms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of bedrooms allowed</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Guests
            </label>
            <input
              type="number"
              min="1"
              max="1000"
              value={limits.max_guests}
              onChange={(e) => updateLimit('max_guests', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum guest capacity</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Bathrooms
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={limits.max_bathrooms}
              onChange={(e) => updateLimit('max_bathrooms', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum number of bathrooms</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Property Size (sq ft)
            </label>
            <input
              type="number"
              min="100"
              max="1000000"
              value={limits.max_property_size}
              onChange={(e) => updateLimit('max_property_size', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Maximum property size</p>
          </div>
        </div>
      </div>

      {/* Bed Configuration Limits */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Bed Configuration Limits</h3>
            <p className="text-sm text-gray-600 mt-1">Set maximum limits for different bed types</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Total Beds Per Room
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={limits.max_total_beds_per_room}
            onChange={(e) => updateLimit('max_total_beds_per_room', e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Maximum total beds allowed in a single room</p>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Maximum Per Bed Type</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bedTypes.map((bedType) => (
              <div key={bedType.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {bedType.label}
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={limits.max_beds_per_type[bedType.key as keyof typeof limits.max_beds_per_type]}
                  onChange={(e) => updateBedTypeLimit(bedType.key, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{bedType.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Important Notes</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>These limits will apply to all new property submissions</li>
              <li>Existing properties will not be affected by limit changes</li>
              <li>Hosts will see these limits when creating or editing properties</li>
              <li>Changes take effect immediately after saving</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={resetToDefaults}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          Reset to Defaults
        </button>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Last Updated */}
      {limits.updated_at && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(limits.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AdminPropertyLimits;