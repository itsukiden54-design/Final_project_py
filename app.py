import pickle
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

with open("Model/airline_delay_model.pkl", "rb") as file:
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


@app.get("/")
def home():
    return {
        "message": "Airline Delay Prediction API is running",
        "accuracy": round(model_accuracy * 100, 2)
    }


@app.post("/predict")
def predict(data: AirlineInput):

    input_df = pd.DataFrame(
        [[
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
        ]],
        columns=feature_columns
    )

    prediction = model.predict(input_df)[0]

    result = "Delayed" if prediction == 1 else "Not Delayed"

    return {
        "prediction": result
    }