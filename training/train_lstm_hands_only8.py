import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.utils import to_categorical
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns
import matplotlib.pyplot as plt

# ==============================
# CONFIGURATION
# ==============================
DATA_PATH = "keypoints"
ACTIONS = np.array(["hello", "my", "name", "thankyou", "how", "you", "your", "what"])
SEQUENCE_LENGTH = 30

# Original feature layout per frame from your old extractor:
# pose: 33 * 3  =  99
# face: 468 * 3 = 1404
# lh:   21 * 3  =  63
# rh:   21 * 3  =  63
# total: 1629
POSE_FACE_FEATURES = (33 + 468) * 3    # 1503
HAND_FEATURES = (21 + 21) * 3          # 126

# ==============================
# LOAD DATA (HAND-ONLY)
# ==============================
sequences, labels = [], []

for idx, action in enumerate(ACTIONS):
    action_path = os.path.join(DATA_PATH, action)
    if not os.path.exists(action_path):
        print(f"⚠️ Skipping {action}, folder not found.")
        continue

    for seq_folder in os.listdir(action_path):
        seq_dir = os.path.join(action_path, seq_folder)
        if not os.path.isdir(seq_dir):
            continue

        for npy_file in os.listdir(seq_dir):
            if not npy_file.endswith(".npy"):
                continue

            arr = np.load(os.path.join(seq_dir, npy_file))   # (frames, features)

            # enforce sequence length
            if arr.shape[0] != SEQUENCE_LENGTH:
                continue

            # If this was saved with full pose+face+hands (1629 features),
            # slice out only the hand part. If it already is hand-only, keep it.
            if arr.shape[1] == (POSE_FACE_FEATURES + HAND_FEATURES):
                arr = arr[:, POSE_FACE_FEATURES:]  # keep last 126 features
            elif arr.shape[1] != HAND_FEATURES:
                print(f"Skipping {npy_file}: unexpected feature dim {arr.shape[1]}")
                continue

            sequences.append(arr)
            labels.append(idx)

X = np.array(sequences)
y = to_categorical(labels).astype(int)

print("✅ Data loaded (hand-only):", X.shape, y.shape)  # (N, 30, 126)

# ==============================
# TRAIN-TEST SPLIT
# ==============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.1, stratify=y, random_state=42
)
print("Train shape:", X_train.shape, "Test shape:", X_test.shape)

# ==============================
# BUILD LSTM MODEL (BIGGER + DROPOUT)
# ==============================
model = Sequential([
    LSTM(256, return_sequences=True, input_shape=(SEQUENCE_LENGTH, X.shape[2])),
    Dropout(0.3),
    LSTM(256, return_sequences=True),
    Dropout(0.3),
    LSTM(128, return_sequences=False),
    Dense(256, activation='relu'),
    Dropout(0.3),
    Dense(128, activation='relu'),
    Dense(len(ACTIONS), activation='softmax')
])

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=1e-4),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

model.summary()

# ==============================
# TRAIN
# ==============================
callbacks = [
    tf.keras.callbacks.EarlyStopping(
        monitor='val_accuracy',
        patience=12,
        restore_best_weights=True,
        verbose=1
    )
]

history = model.fit(
    X_train, y_train,
    validation_data=(X_test, y_test),
    epochs=120,
    batch_size=8,
    callbacks=callbacks
)

# ==============================
# EVALUATION
# ==============================
y_pred = model.predict(X_test)
y_true = np.argmax(y_test, axis=1)
y_pred_labels = np.argmax(y_pred, axis=1)

print("\n🔍 Classification Report (hand-only):")
print(classification_report(y_true, y_pred_labels, target_names=ACTIONS))

cm = confusion_matrix(y_true, y_pred_labels)
sns.heatmap(
    cm, annot=True, fmt='d', cmap='Blues',
    xticklabels=ACTIONS, yticklabels=ACTIONS
)
plt.xlabel("Predicted")
plt.ylabel("True")
plt.title("Confusion Matrix - Hand-only LSTM")
plt.show()

# ==============================
# SAVE MODEL + LABELS
# ==============================
os.makedirs("models", exist_ok=True)
model_path = "models/gesturetalk_lstm_hands6.keras"
labels_path = "models/gesturetalk_lstm_hands_labels6.npy"

model.save(model_path)
np.save(labels_path, ACTIONS)

print(f"✅ Model saved to {model_path}")
print(f"Labels saved to {labels_path}")
