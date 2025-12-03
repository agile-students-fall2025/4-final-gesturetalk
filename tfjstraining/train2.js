// train5.js  (hand-only LSTM + class weight for "name" + early stopping)

const tf = require("@tensorflow/tfjs-node");
const fs = require("fs");
const path = require("path");

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

      const seq = JSON.parse(
        fs.readFileSync(path.join(DATA_DIR, label, file))
      );

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
// 3. Wrist-centered normalization (match browser)
// --------------------------------------------------
function normalizeHandFrame(frame126) {
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

    if (!isFinite(x)) x = 0;
    if (!isFinite(y)) y = 0;
    if (!isFinite(z)) z = 0;

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
// 5. Stratified train/test split (like sklearn)
// --------------------------------------------------
function stratifiedSplit(X, y, test_ratio = 0.1) {
  let trainX = [];
  let trainY = [];
  let testX = [];
  let testY = [];

  const labelGroups = {};

  y.forEach((label, idx) => {
    if (!labelGroups[label]) labelGroups[label] = [];
    labelGroups[label].push(idx);
  });

  Object.keys(labelGroups).forEach((label) => {
    const indices = labelGroups[label];
    const testCount = Math.max(1, Math.floor(indices.length * test_ratio));

    const shuffled = indices.slice().sort(() => Math.random() - 0.5);

    const testIdxs = shuffled.slice(0, testCount);
    const trainIdxs = shuffled.slice(testCount);

    trainIdxs.forEach((i) => {
      trainX.push(X[i]);
      trainY.push(y[i]);
    });

    testIdxs.forEach((i) => {
      testX.push(X[i]);
      testY.push(y[i]);
    });
  });

  return { trainX, trainY, testX, testY };
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
    })
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
    classWeight[nameIdx] = 4.0; // tune 3–6 if you want
  }
  console.log("Class weights:", classWeight);

  // Apply padding + wrist-centered normalization
  const padded = X.map(padSequence); // [N, 30, 126]

  const { trainX, trainY, testX, testY } = stratifiedSplit(padded, y, 0.1);

  const trainTensor = tf.tensor3d(trainX);
  const testTensor = tf.tensor3d(testX);

  const trainYtensor = tf.oneHot(tf.tensor1d(trainY, "int32"), labels.length);
  const testYtensor = tf.oneHot(tf.tensor1d(testY, "int32"), labels.length);

  const model = buildModel(labels.length);

  console.log(model.summary());

  // Early stopping when val_accuracy stops improving
  const earlyStop = tf.callbacks.earlyStopping({
    monitor: "val_accuracy",
    patience: 10,       // stop if no improv. for 10 epochs
    minDelta: 0.0005,   // ignore tiny fluctuations
    restoreBestWeight: true,
  });

  await model.fit(trainTensor, trainYtensor, {
    epochs: 120,
    batchSize: 8,
    validationData: [testTensor, testYtensor],
    shuffle: true,
    classWeight,
    callbacks: [earlyStop],
  });

  await model.save("file://./model5");
  fs.writeFileSync("labels.json", JSON.stringify(labels));

  console.log("\n Saved model5 (LSTM-hand-only, wrist-centered) + labels.json");
}

main().catch((err) => console.error(err));