flowchart LR
  %% Data sources
  SENSORS["Wearable biosensors\n(temperature, HR, uterine biomarkers,\nactivity levels, etc.)"]
  CAMS["Fixed cameras & environmental\nsensors (video, temp, humidity)"]

  %% Connectivity / edge
  EDGE["5G RAN / MEC Edge Node\n(ULTRA-LOW LATENCY, edge preprocess)"]
  GW["Secure Gateway\n(encryption, auth, buffering)"]

  %% Cloud ingestion & processing
  IOT["Azure IoT Hub / Event Hub\n(Livestock Pilot)"]
  STREAM["Stream Analytics / Edge Stream\n(preprocessing, windowing)"]
  STORE["Time-series DB / Blob Storage\n(archival + recent window)"]
  PREPROC["Feature store / ETL\n(signal cleaning, sync, augmentation)"]

  %% AI ensemble
  subgraph ENSEMBLE["Ensemble AI Models"]
    CNN["CNN\n(image & video feature extractor)"]
    RF["Random Forest\n(physiological & behavioral tabular data)"]
    KMEANS["k-Means\n(anomaly detection / clustering)"]
    LR["Logistic Regression\n(meta-learner / final probability)"]
  end

  %% Outputs & feedback
  ALERTS["Real-time Alerts & Dashboards\n(Vets, Farmers)"]
  FEEDBACK["Vet annotations / Intervention logs\n(Human-in-the-loop)"]
  MONITOR["Monitoring & Model Ops\n(Azure ML, CI/CD, versioning)"]

  %% Flow connections
  SENSORS -->|Telemetry over 5G| EDGE
  CAMS -->|Video streams over 5G| EDGE
  EDGE --> GW
  GW --> IOT
  IOT --> STREAM
  STREAM --> STORE
  STORE --> PREPROC

  PREPROC --> RF
  PREPROC --> KMEANS
  PREPROC --> CNN

  CNN --> LR
  RF --> LR
  KMEANS --> LR

  LR --> ALERTS
  ALERTS --> VETS["Veterinarians"]
  ALERTS --> FARM["Farmers / Farm managers"]

  VETS -->|Annotated labels, clinical notes| FEEDBACK
  FARM -->|Usage data, confirmations| FEEDBACK
  FEEDBACK --> IOT
  MONITOR -->|Model telemetry, retraining triggers| ENSEMBLE
