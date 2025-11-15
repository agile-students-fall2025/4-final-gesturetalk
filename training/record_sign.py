import cv2, os, time
import mediapipe as mp
import numpy as np

# CONFIGURATION 
DATA_PATH = "keypoints"
WORDS = ["what"]   # add more later
NUM_SEQUENCES = 30                # how many clips per word
SEQUENCE_LENGTH = 30              # frames per clip
DELAY_BETWEEN = 2.0               # seconds between recordings

# MEDIAPIPE SETUP 
mp_holistic = mp.solutions.holistic
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    # Each vector: x,y,z for each landmark, fill missing with zeros
    def flatten_landmarks(landmarks, expected):
        if landmarks:
            return np.array([[lm.x, lm.y, lm.z] for lm in landmarks]).flatten()
        else:
            return np.zeros(expected * 3)

    pose = flatten_landmarks(results.pose_landmarks.landmark if results.pose_landmarks else None, 33)
    face = flatten_landmarks(results.face_landmarks.landmark if results.face_landmarks else None, 468)
    lh = flatten_landmarks(results.left_hand_landmarks.landmark if results.left_hand_landmarks else None, 21)
    rh = flatten_landmarks(results.right_hand_landmarks.landmark if results.right_hand_landmarks else None, 21)
    return np.concatenate([pose, face, lh, rh])

# CREATE FOLDER STRUCTURE 
for word in WORDS:
    for seq in range(NUM_SEQUENCES):
        os.makedirs(os.path.join(DATA_PATH, word, str(seq)), exist_ok=True)

# START RECORDING 
cap = cv2.VideoCapture(0)

with mp_holistic.Holistic(min_detection_confidence=0.5,
                          min_tracking_confidence=0.5) as holistic:
    for word in WORDS:
        for seq in range(NUM_SEQUENCES):
            print(f"\n🎬 Recording {word.upper()} [{seq+1}/{NUM_SEQUENCES}]")

            # Countdown
            for i in range(3, 0, -1):
                ret, frame = cap.read()
                cv2.putText(frame, f"Get ready for '{word.upper()}' in {i}",
                            (30, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 3)
                cv2.imshow("Recording", frame)
                cv2.waitKey(1000)

            sequence = []
            for frame_num in range(SEQUENCE_LENGTH):
                ret, frame = cap.read()
                if not ret:
                    continue
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = holistic.process(image)
                keypoints = extract_keypoints(results)
                sequence.append(keypoints)

                # Draw landmarks for feedback
                image_bgr = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
                mp_drawing.draw_landmarks(image_bgr, results.pose_landmarks, mp_holistic.POSE_CONNECTIONS)
                mp_drawing.draw_landmarks(image_bgr, results.left_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                mp_drawing.draw_landmarks(image_bgr, results.right_hand_landmarks, mp_holistic.HAND_CONNECTIONS)
                cv2.putText(image_bgr, f"{word.upper()} #{seq+1} Frame {frame_num+1}/{SEQUENCE_LENGTH}",
                            (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)
                cv2.imshow("Recording", image_bgr)

                # Exit shortcut
                if cv2.waitKey(1) & 0xFF == ord('q'):
                    break

            # Save sequence
            np.save(os.path.join(DATA_PATH, word, str(seq), f"{word}_{seq}.npy"), np.array(sequence))
            print(f"Saved {word}_{seq}.npy ({len(sequence)} frames)")
            time.sleep(DELAY_BETWEEN)

cap.release()
cv2.destroyAllWindows()
print("\n Recording complete! All sequences saved under:", DATA_PATH)
