"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Perbaikan bug icon marker Leaflet yang sering hilang di framework Next.js
const customIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

export default function MapPicker({ onLocationSelect }: MapPickerProps) {
  // Default koordinat diarahkan sekitar wilayah Kelurahan Ngemplakrejo, Pasuruan
  const [position, setPosition] = useState<[number, number]>([-7.6325, 112.9152]);

  // Sub-komponen untuk menangani deteksi klik kursor di area peta
  function MapEventsHandler() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        fetchAddressString(lat, lng);
      },
    });
    return <Marker position={position} icon={customIcon} />;
  }

  // Fungsi untuk mengubah koordinat latitude & longitude menjadi nama alamat teks asli
  const fetchAddressString = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      // Mengambil alamat ringkas atau full display name
      const cleanAddress = data.display_name || `${lat}, ${lng}`;
      onLocationSelect(lat, lng, cleanAddress);
    } catch (error) {
      console.error("Gagal mendapatkan alamat:", error);
      onLocationSelect(lat, lng, `${lat}, ${lng}`);
    }
  };

  // Otomatis lacak lokasi GPS perangkat warga saat pertama kali peta dimuat
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPosition([latitude, longitude]);
          fetchAddressString(latitude, longitude);
        },
        (error) => {
          console.log("Akses GPS ditolak, menggunakan lokasi default wilayah kelurahan.");
          fetchAddressString(-7.6325, 112.9152);
        }
      );
    }
  }, []);

  return (
    <div className="h-64 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner z-0 relative">
      <MapContainer center={position} zoom={16} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEventsHandler />
      </MapContainer>
    </div>
  );
}