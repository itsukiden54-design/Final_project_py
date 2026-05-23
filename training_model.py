import os
import pickle

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score

os.makedirs("Model", exist_ok=True)

csv_path = "Data/Airline_Delay_Cause.csv"
df = pd.read_csv(csv_path)

print(df.columns.to_list())

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

model = DecisionTreeClassifier(
    max_depth=10,
    random_state=42
)

model.fit(X_train, y_train)

predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)

print(f"Accuracy = {accuracy:.2%}")

model_data = {
    "model": model,
    "feature_columns": feature_columns,
    "accuracy": accuracy
}

with open("Model/airline_delay_model.pkl", "wb") as file:
    pickle.dump(model_data, file)

print("Model saved successfully")