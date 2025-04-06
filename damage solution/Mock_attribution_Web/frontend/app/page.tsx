"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const SECTION_STRUCTURE = {
  "Front of Trailer": [
    "Damage",
    "King pin",
    "Gladhands",
    "7-way connector",
    "Registration holder",
  ],
  "Rear Lights": ["Tail", "Brake", "Marker", "Left turn", "Right turn"],
  "Trailer Rear": [
    "Damage",
    "Mud flaps",
    "Door latch",
    "Door hinges",
    "License plate",
    "Reflective tape",
    "Rear Impact Guard",
  ],
  "Left Side of Trailer": ["Damage", "Reflective tape", "Marker / turn light"],
  "Right Side of Trailer": ["Damage", "Reflective tape", "Marker / turn light"],
  "Trailer Interior": [
    "Walls",
    "Damage",
    "Flooring",
    "Interior roof",
    "Tie down & Tracks",
  ],
  "Under Carriage": [
    "Damage",
    "Landing gear",
    "Air lines and Wiring",
    "Crossmembers and Substructures",
  ],
  "Left Side Wheels and Tires": [
    "Wheel / Rims",
    "Tread Condition",
    "Hub caps / Seals",
    "Condition of tires",
    "Tires are Goodyear G316",
  ],
  "Right Side Wheels and Tires": [
    "Hub odometer",
    "Wheel / Rims",
    "Tread Condition",
    "Hub caps / Seals",
    "Condition of tires",
    "Tires are Goodyear G316",
  ],
};

export default function DamageTrackingUI() {
  const [vin, setVin] = useState("");
  const [reportDate, setReportDate] = useState("");
  const [fieldStates, setFieldStates] = useState(() => {
    const initial = {};
    for (const section in SECTION_STRUCTURE) {
      initial[section] = {};
      SECTION_STRUCTURE[section].forEach((field) => {
        initial[section][field] = true;
      });
    }
    return initial;
  });

  const [locVin, setLocVin] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [locCustomer, setLocCustomer] = useState("");
  const [analyzeVin, setAnalyzeVin] = useState("");
  const [results, setResults] = useState(null);

  const resetPage = () => {
    window.location.reload();
  };

  const updateField = (section, field, value) => {
    setFieldStates((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const submitDamageReport = async () => {
    const formData = Object.entries(fieldStates).map(([section, fields]) => ({
      [section]: {
        fields: Object.fromEntries(
          Object.entries(fields).map(([fieldName, val]) => [
            fieldName,
            { value: val },
          ])
        ),
      },
    }));

    const data = {
      vin,
      created_time: new Date(reportDate).toISOString(),
      data: { formData },
    };

    await fetch("http://127.0.0.1:8000/add_inspection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    alert("✅ Inspection submitted!");
    resetPage();
  };

  const submitLocation = async () => {
    const data = {
      vin: locVin,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      start_location: startLocation,
      end_location: endLocation,
      customer: locCustomer,
    };

    await fetch("http://127.0.0.1:8000/add_location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    alert("✅ Driving record submitted!");
    resetPage();
  };

  const analyze = async () => {
    const res = await fetch(`http://127.0.0.1:8000/analyze/${analyzeVin}`);
    const data = await res.json();
    setResults(data);
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xl font-semibold">Submit Damage Report</h2>
          <Input
            placeholder="Trailer VIN"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
          />
          <Input
            type="datetime-local"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />

          {Object.entries(SECTION_STRUCTURE).map(([section, fields]) => (
            <div key={section} className="border p-3 rounded space-y-2">
              <h3 className="text-lg font-bold">{section}</h3>
              {fields.map((field) => (
                <div key={field} className="flex items-center justify-between">
                  <span>{field}</span>
                  <Switch
                    checked={fieldStates[section][field]}
                    onCheckedChange={(val) => updateField(section, field, val)}
                  />
                </div>
              ))}
            </div>
          ))}

          <Button onClick={submitDamageReport}>Submit Inspection</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xl font-semibold">Submit Driving Record</h2>
          <Input
            placeholder="Trailer VIN"
            value={locVin}
            onChange={(e) => setLocVin(e.target.value)}
          />
          <label className="block text-sm font-medium mt-2">Start Time</label>
          <Input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
          <label className="block text-sm font-medium mt-2">End Time</label>
          <Input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
          <Input
            placeholder="Start Location"
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
          />
          <Input
            placeholder="End Location"
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
          />
          <Input
            placeholder="Customer Name"
            value={locCustomer}
            onChange={(e) => setLocCustomer(e.target.value)}
          />
          <Button onClick={submitLocation}>Submit Location</Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-xl font-semibold">Analyze Damage by VIN</h2>
          <Input
            placeholder="Trailer VIN"
            value={analyzeVin}
            onChange={(e) => setAnalyzeVin(e.target.value)}
          />
          <Button onClick={analyze}>Analyze</Button>

          {results && (
            <div className="mt-4 space-y-2">
              {results.map((r, idx) => (
                <div key={idx} className="border p-3 rounded">
                  <p>
                    <strong>Damage Time:</strong> {r.damage_time}
                  </p>
                  <p>
                    <strong>Status:</strong> {r.status}
                  </p>
                  {r.customers?.length > 0 && (
                    <p>
                      <strong>Customers:</strong> {r.customers.join(", ")}
                    </p>
                  )}
                  {r.damaged_parts?.length > 0 && (
                    <p>
                      <strong>Damaged Parts:</strong>
                      <br />
                      {r.damaged_parts.map((part, i) => (
                        <span key={i}>
                          • {part}
                          <br />
                        </span>
                      ))}
                    </p>
                  )}
                  {r.movements?.length > 0 && (
                    <div>
                      <strong>Movements:</strong>
                      <table className="w-full mt-2 border text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left">Customer</th>
                            <th className="text-left">Start Time</th>
                            <th className="text-left">End Time</th>
                            <th className="text-left">Start Location</th>
                            <th className="text-left">End Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {r.movements.map((m, i) => (
                            <tr key={i} className="border-b">
                              <td>{m.customer}</td>
                              <td>{m.start_time}</td>
                              <td>{m.end_time}</td>
                              <td>{m.start_location}</td>
                              <td>{m.end_location}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
