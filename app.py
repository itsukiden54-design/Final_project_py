import os
import csv
import pickle
from datetime import datetime

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI(title="Airline Delay Predictor")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = "Model/airline_delay_model.pkl"
ANALYTICS_FILE = "analytics.csv"

with open(MODEL_PATH, "rb") as file:
    model_data = pickle.load(file)

model = model_data["model"]
feature_columns = model_data["feature_columns"]
model_accuracy = model_data["accuracy"]


class AirlineInput(BaseModel):
    year: int
    month: int
    arr_flights: float
    carrier_ct: float
    weather_ct: float
    nas_ct: float
    security_ct: float
    late_aircraft_ct: float
    arr_cancelled: float
    arr_diverted: float


def save_analytics(data, prediction):
    file_exists = os.path.isfile(ANALYTICS_FILE)

    with open(ANALYTICS_FILE, "a", newline="") as file:
        writer = csv.writer(file)

        if not file_exists:
            writer.writerow([
                "timestamp",
                "year",
                "month",
                "arr_flights",
                "carrier_ct",
                "weather_ct",
                "nas_ct",
                "security_ct",
                "late_aircraft_ct",
                "arr_cancelled",
                "arr_diverted",
                "prediction"
            ])

        writer.writerow([
            datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            data.year,
            data.month,
            data.arr_flights,
            data.carrier_ct,
            data.weather_ct,
            data.nas_ct,
            data.security_ct,
            data.late_aircraft_ct,
            data.arr_cancelled,
            data.arr_diverted,
            prediction
        ])


@app.get("/")
def home():
    return {
        "message": "Airline Delay Prediction API is running",
        "model_accuracy": round(model_accuracy * 100, 2)
    }


@app.post("/predict")
def predict(data: AirlineInput):
    input_df = pd.DataFrame([[
        data.year,
        data.month,
        data.arr_flights,
        data.carrier_ct,
        data.weather_ct,
        data.nas_ct,
        data.security_ct,
        data.late_aircraft_ct,
        data.arr_cancelled,
        data.arr_diverted
    ]], columns=feature_columns)

    prediction = model.predict(input_df)[0]

    result = "Delayed" if prediction == 1 else "Not Delayed"

    save_analytics(data, result)

    return {
        "prediction": result
    }


@app.get("/analytics")
def get_analytics():
    if not os.path.isfile(ANALYTICS_FILE):
        return {
            "total_predictions": 0,
            "delayed": 0,
            "not_delayed": 0,
            "recent_inputs": []
        }

    df = pd.read_csv(ANALYTICS_FILE)

    total = len(df)
    delayed = len(df[df["prediction"] == "Delayed"])
    not_delayed = len(df[df["prediction"] == "Not Delayed"])

    recent_inputs = df.tail(5).to_dict(orient="records")

    return {
        "total_predictions": total,
        "delayed": delayed,
        "not_delayed": not_delayed,
        "recent_inputs": recent_inputs
    }