from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import sqlite3
import json
import smtplib
from email.message import EmailMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
conn = sqlite3.connect("damage_tracking.db", check_same_thread=False)
c = conn.cursor()

# Create tables
c.execute(
    """
CREATE TABLE IF NOT EXISTS inspections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT,
    created_time TEXT,
    data TEXT,
    has_damage INTEGER
)
"""
)
c.execute(
    """
CREATE TABLE IF NOT EXISTS asset_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vin TEXT,
    start_time TEXT,
    end_time TEXT,
    start_location TEXT,
    end_location TEXT,
    customer TEXT
)
"""
)
conn.commit()

# Data Models
class Inspection(BaseModel):
    vin: str
    created_time: datetime
    data: dict


class AssetLocation(BaseModel):
    vin: str
    start_time: datetime
    end_time: datetime
    start_location: str
    end_location: str
    customer: str


# Utility function to check for damage in inspection
def detect_damage(data: dict) -> bool:
    for section in data.get("formData", []):
        for field in section.values():
            for value in field.get("fields", {}).values():
                if isinstance(value, dict) and value.get("value") is False:
                    return True
    return False


# Utility function to extract damaged parts
def extract_damaged_parts(data: dict) -> List[str]:
    damaged_parts = []
    for section in data.get("formData", []):
        for section_name, section_data in section.items():
            for field_name, value_dict in section_data.get("fields", {}).items():
                if isinstance(value_dict, dict) and value_dict.get("value") is False:
                    damaged_parts.append(f"{section_name} → {field_name}")
    return damaged_parts


# Utility: send email
def send_email(subject: str, content: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = "donaughty1215@gmail.com"
    msg["To"] = "wyjbssb@gmail.com"
    msg.set_content(content)

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login("donaughty1215@gmail.com", "vtbaikbmwbmsgfse")
            smtp.send_message(msg)
        print("✅ Email sent!")
    except Exception as e:
        print("❌ Email failed:", e)


# Reuse analysis logic
def run_analysis(vin: str, up_to_time: Optional[str] = None):
    c.execute("SELECT * FROM inspections WHERE vin = ? ORDER BY created_time", (vin,))
    inspections = c.fetchall()
    damage_inspections = [i for i in inspections if i[4] == 1]

    results = []
    for damage in damage_inspections:
        damage_time = datetime.fromisoformat(damage[2])
        if up_to_time and damage_time.isoformat() != up_to_time:
            continue

        previous = [
            i
            for i in inspections
            if datetime.fromisoformat(i[2]) < damage_time and i[4] == 0
        ]

        damage_data = json.loads(damage[3])
        damaged_parts = extract_damaged_parts(damage_data)

        if not previous:
            results.append(
                {
                    "damage_time": damage_time,
                    "status": "Manual review required",
                    "customers": [],
                    "damaged_parts": damaged_parts,
                    "movements": [],
                }
            )
            continue

        clean = previous[-1]
        clean_time = datetime.fromisoformat(clean[2])

        c.execute(
            "SELECT * FROM asset_locations WHERE vin = ? AND start_time > ? AND end_time < ?",
            (vin, clean_time.isoformat(), damage_time.isoformat()),
        )
        locations = c.fetchall()
        customers = list(set([loc[6] for loc in locations]))

        movements = [
            {
                "customer": loc[6],
                "start_time": loc[2],
                "end_time": loc[3],
                "start_location": loc[4],
                "end_location": loc[5],
            }
            for loc in locations
        ]

        if len(customers) == 0:
            status = "Manual review required"
        elif len(customers) == 1:
            status = f"Assigned to customer: {customers[0]}"
        else:
            status = "Suspicious customers identified"

        results.append(
            {
                "damage_time": damage_time,
                "status": status,
                "customers": customers,
                "damaged_parts": damaged_parts,
                "movements": movements,
            }
        )

    return results


# Endpoint to add inspection
@app.post("/add_inspection")
def add_inspection(inspection: Inspection):
    has_damage = int(detect_damage(inspection.data))
    c.execute(
        "INSERT INTO inspections (vin, created_time, data, has_damage) VALUES (?, ?, ?, ?)",
        (
            inspection.vin,
            inspection.created_time.isoformat(),
            json.dumps(inspection.data),
            has_damage,
        ),
    )
    conn.commit()

    if has_damage:
        damaged_parts = extract_damaged_parts(inspection.data)
        result = run_analysis(inspection.vin, inspection.created_time.isoformat())
        summary = json.dumps(result, indent=2, default=str)
        damage_list = "\n".join(f"- {p}" for p in damaged_parts)

        movement_section = ""
        for r in result:
            if r.get("movements"):
                movement_section += "\nMovements:\n"
                for m in r["movements"]:
                    movement_section += f"- {m['customer']}: {m['start_time']} @ {m['start_location']} → {m['end_time']} @ {m['end_location']}\n"

        send_email(
            subject=f"Damage Detected for VIN {inspection.vin}",
            content=(
                f"A new inspection detected damage.\n\n"
                f"VIN: {inspection.vin}\n"
                f"Detected damaged parts:\n{damage_list}\n"
                f"{movement_section}\n"
                f"Analysis result:\n{summary}"
            ),
        )

    return {"status": "success", "has_damage": bool(has_damage)}


# Endpoint to add asset location
@app.post("/add_location")
def add_location(location: AssetLocation):
    c.execute(
        "INSERT INTO asset_locations (vin, start_time, end_time, start_location, end_location, customer) VALUES (?, ?, ?, ?, ?, ?)",
        (
            location.vin,
            location.start_time.isoformat(),
            location.end_time.isoformat(),
            location.start_location,
            location.end_location,
            location.customer,
        ),
    )
    conn.commit()
    return {"status": "success"}


# Endpoint to run analysis manually
@app.get("/analyze/{vin}")
def analyze_damage(vin: str):
    return run_analysis(vin)
