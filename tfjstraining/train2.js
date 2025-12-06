// train4-5.js  (hand-only LSTM with wrist-centered normalization + class weight for "name")
// eslint-disable-next-line no-undef, import/no-unresolved
const tf = require("@tensorflow/tfjs-node");
// eslint-disable-next-line no-undef
const fs = require("fs");
// eslint-disable-next-line no-undef
const path = require("path");

// eslint-disable-next-line no-undef
const DATA_DIR = path.join(__dirname, "data");
const SEQ_LENGTH = 30;
const HAND_DIM = 126; // 21 landmarks * 3 coords * 2 hands

// --------------------------------------------------
// 1. Load dataset (JSON sequences)
// --------------------------------------------------
function loadDataset() {
  let X = [];
  let y = [];

  const labels = fs
    .readdirSync(DATA_DIR)
    .filter((f) => fs.statSync(path.join(DATA_DIR, f)).isDirectory());

  console.log("Classes:", labels);

  labels.forEach((label, idx) => {
    const files = fs.readdirSync(path.join(DATA_DIR, label));

    files.forEach((file) => {
      if (!file.endsWith(".json")) return;

      const seq = JSON.parse(fs.readFileSync(path.join(DATA_DIR, label, file)));

      X.push(seq);
      y.push(idx);
    });
  });

  return { X, y, labels };
}

// --------------------------------------------------
// 2. Extract last 126 dims (hand-only)
// --------------------------------------------------
function extractHands(frame) {
  // frame may contain pose+face+hands; keep only the last 126 dims
  return frame.slice(frame.length - HAND_DIM);
}

// --------------------------------------------------
// 3. Wrist-centered normalization (match this in browser)
// --------------------------------------------------
function normalizeHandFrame(frame126) {
  // frame126: [x0,y0,z0, x1,y1,z1, ..., x41,y41,z41]
  if (frame126.length !== HAND_DIM) {
    throw new Error(`Expected 126-dim hand frame, got ${frame126.length}`);
  }

  const wristX = frame126[0];
  const wristY = frame126[1];
  const wristZ = frame126[2];

  const out = [];
  for (let i = 0; i < frame126.length; i += 3) {
    let x = frame126[i];
    let y = frame126[i + 1];
    let z = frame126[i + 2];

    /* eslint-disable no-restricted-globals */
    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(z)) z = 0;
    /* eslint-enable no-restricted-globals */

    out.push(x - wristX);
    out.push(y - wristY);
    out.push(z - wristZ);
  }

  return out;
}

// --------------------------------------------------
// 4. Pad/truncate sequences to 30 frames
// --------------------------------------------------
function padSequence(seq) {
  // seq: array of frames (full holistic frames)
  const cleaned = seq.map((f) => normalizeHandFrame(extractHands(f)));

  if (cleaned.length > SEQ_LENGTH) return cleaned.slice(0, SEQ_LENGTH);

  while (cleaned.length < SEQ_LENGTH) {
    cleaned.push(new Array(HAND_DIM).fill(0));
  }

  return cleaned;
}

// --------------------------------------------------
// 6. Build LSTM model
// --------------------------------------------------
function buildModel(numClasses) {
  const model = tf.sequential();

  model.add(
    tf.layers.lstm({
      units: 256,
      returnSequences: true,
      inputShape: [SEQ_LENGTH, HAND_DIM],
    }),
  );
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.lstm({ units: 256, returnSequences: true }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.lstm({ units: 128, returnSequences: false }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({ units: 256, activation: "relu" }));
  model.add(tf.layers.dropout({ rate: 0.3 }));

  model.add(tf.layers.dense({ units: 128, activation: "relu" }));

  model.add(tf.layers.dense({ units: numClasses, activation: "softmax" }));

  model.compile({
    optimizer: tf.train.adam(1e-4),
    loss: "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model;
}

// --------------------------------------------------
// 7. TRAIN
// --------------------------------------------------
async function main() {
  const { X, y, labels } = loadDataset();

  console.log("Total samples:", X.length);

  // class counts
  const counts = new Array(labels.length).fill(0);
  // eslint-disable-next-line no-plusplus
  y.forEach((c) => counts[c]++);
  console.log("Class counts:");
  labels.forEach((lab, i) => {
    console.log(`  ${lab}: ${counts[i]}`);
  });

  // class weights (default 1, boost "name")
  const classWeight = {};
  labels.forEach((lab, i) => {
    classWeight[i] = 1.0;
  });
  const nameIdx = labels.indexOf("name");
  if (nameIdx !== -1) {
    classWeight[nameIdx] = 3.0; // tune 2–5 as needed
  }
  console.log("Class weights:", classWeight);

  // Apply padding + wrist-centered normalization
  const padded = X.map(padSequence); // shape: [N, 30, 126]

  // eslint-disable-next-line no-undef
  const { trainX, trainY, testX, testY } = stratifiedSplit(padded, y, 0.1);

  const trainTensor = tf.tensor3d(trainX);
  const testTensor = tf.tensor3d(testX);

  const trainYtensor = tf.oneHot(tf.tensor1d(trainY, "int32"), labels.length);
  const testYtensor = tf.oneHot(tf.tensor1d(testY, "int32"), labels.length);

  const model = buildModel(labels.length);

  console.log(model.summary());

  await model.fit(trainTensor, trainYtensor, {
    epochs: 120,
    batchSize: 8,
    validationData: [testTensor, testYtensor],
    shuffle: true,
    classWeight, // <--- use weights
    callbacks: [
      tf.callbacks.earlyStopping({
        monitor: "val_accuracy",
        patience: 12,
        restoreBestWeight: true,
      }),
    ],
  });

  await model.save("file://./model4");
  fs.writeFileSync("labels.json", JSON.stringify(labels));

  console.log("\n Saved model4 (LSTM-hand-only, wrist-centered) + labels.json");
}

main().catch((err) => console.error(err));
