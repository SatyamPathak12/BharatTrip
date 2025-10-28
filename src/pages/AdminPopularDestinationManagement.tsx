// AdminPopularDestinationManagement.tsx
import React, { useEffect, useState, ChangeEvent } from "react";
import { supabase } from "../lib/supabase";
import { Plus, Edit, Trash2 } from "lucide-react";

interface Destination {
  id: number;
  location_name: string;
  no_of_property: number;
  location_url: string;
}

const AdminPopularDestinationManagement: React.FC = () => {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<{
    location_name: string;
    no_of_property: string;
  }>({
    location_name: "",
    no_of_property: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch destinations
  const fetchDestinations = async () => {
    const { data, error } = await supabase
      .from("popular_destinations")
      .select("id, location_name, no_of_property, location_url");

    if (error) {
      console.error("Error fetching destinations:", error.message);
    } else {
      setDestinations((data as Destination[]) || []);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  // Handle File Select
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  // Handle Create or Update
  const handleCreateOrUpdate = async () => {
    if (!formData.location_name || !formData.no_of_property) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;

      // Upload image if selected
      if (selectedFile) {
        const filePath = `popular_destinations/${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("destination_images")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("destination_images")
          .getPublicUrl(filePath);

        imageUrl = urlData?.publicUrl;
      }

      if (editingId) {
        // Update existing destination
        const { error: updateError } = await supabase
          .from("popular_destinations")
          .update({
            location_name: formData.location_name,
            no_of_property: Number(formData.no_of_property),
            ...(imageUrl && { location_url: imageUrl }),
          })
          .eq("id", editingId);

        if (updateError) throw updateError;
      } else {
        // Create new destination
        if (!selectedFile) {
          alert("Please upload an image");
          setLoading(false);
          return;
        }

        const { error: insertError } = await supabase
          .from("popular_destinations")
          .insert([
            {
              location_name: formData.location_name,
              no_of_property: Number(formData.no_of_property),
              location_url: imageUrl,
            },
          ]);

        if (insertError) throw insertError;
      }

      // Reset form + refresh list
      setShowForm(false);
      setFormData({ location_name: "", no_of_property: "" });
      setSelectedFile(null);
      setEditingId(null);
      fetchDestinations();
    } catch (err: any) {
      console.error("Error creating/updating destination:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this destination?")) return;

    try {
      const { error } = await supabase
        .from("popular_destinations")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setDestinations(destinations.filter((dest) => dest.id !== id));
    } catch (err: any) {
      console.error("Error deleting destination:", err.message);
    }
  };

  // Handle Edit
  const handleEdit = (dest: Destination) => {
    setFormData({
      location_name: dest.location_name,
      no_of_property: dest.no_of_property.toString(),
    });
    setSelectedFile(null);
    setEditingId(dest.id);
    setShowForm(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Destinations</h1>
          <p className="text-gray-500">Create and manage your popular destinations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({ location_name: "", no_of_property: "" });
            setSelectedFile(null);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          <Plus size={18} /> Create New Destination
        </button>
      </div>

      {/* Destination Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {destinations.map((dest) => (
          <div
            key={dest.id}
            className="bg-white rounded-lg shadow-md overflow-hidden relative"
          >
            <img
              src={dest.location_url}
              alt={dest.location_name}
              className="h-40 w-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={() => handleEdit(dest)}
                className="bg-gray-100 p-2 rounded-full hover:bg-gray-200"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(dest.id)}
                className="bg-gray-100 p-2 rounded-full hover:bg-red-100 text-red-500"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-lg">{dest.location_name}</h3>
              <p className="text-gray-600">{dest.no_of_property}+ properties</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Update Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? "Update Destination" : "Create New Destination"}
            </h2>

            <input
              type="text"
              placeholder="Location Name"
              value={formData.location_name}
              onChange={(e) =>
                setFormData({ ...formData, location_name: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="number"
              placeholder="No. of Properties"
              value={formData.no_of_property}
              onChange={(e) =>
                setFormData({ ...formData, no_of_property: e.target.value })
              }
              className="w-full border p-2 rounded mb-3"
            />

            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="w-full border p-2 rounded mb-3"
            />

            <button
              onClick={handleCreateOrUpdate}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              {loading
                ? editingId
                  ? "Updating..."
                  : "Creating..."
                : editingId
                ? "Update Destination"
                : "Create Destination"}
            </button>

            <button
              onClick={() => setShowForm(false)}
              className="w-full mt-2 bg-gray-300 py-2 rounded hover:bg-gray-400 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPopularDestinationManagement;


