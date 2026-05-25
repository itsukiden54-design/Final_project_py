from pathlib import Path
import pickle

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score


BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "Data" / "Airline_Delay_Cause.csv"
MODEL_DIR = BASE_DIR / "Model"
MODEL_PATH = MODEL_DIR / "airline_delay_model.pkl"

MODEL_DIR.mkdir(exist_ok=True)

if not DATA_PATH.exists():
    raise FileNotFoundError(
        "Dataset not found. Put Airline_Delay_Cause.csv inside the Data folder."
    )

df = pd.read_csv(DATA_PATH)
df = df.dropna()

feature_columns = [
    "year",
    "month",
    "arr_flights",
    "carrier_ct",
    "weather_ct",
    "nas_ct",
    "security_ct",
    "late_aircraft_ct",
    "arr_cancelled",
    "arr_diverted"
]

required_columns = feature_columns + ["arr_del15"]
missing = [col for col in required_columns if col not in df.columns]

if missing:
    raise ValueError(f"Missing columns in CSV: {missing}")

df["delay_status"] = df["arr_del15"].apply(lambda x: 1 if x > 0 else 0)

X = df[feature_columns]
y = df["delay_status"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

model = DecisionTreeClassifier(max_depth=10, random_state=42)
model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

model_data = {
    "model": model,
    "feature_columns": feature_columns,
    "accuracy": accuracy
}

with open(MODEL_PATH, "wb") as file:
    pickle.dump(model_data, file)

print(f"Model saved at: {MODEL_PATH}")
print(f"Accuracy: {accuracy:.2%}")
