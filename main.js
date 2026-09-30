Papa.parse("iris.csv", {
  download: true,
  header: true,
  dynamicTyping: true,
  skipEmptyLines: true,
  complete: function(results) {
    try {
      if (!results.data || results.data.length === 0) throw new Error("CSV loaded but contained no rows.");
      const first = results.data[0];
      for (const f of [...FEATURES, "species"]) {
        if (!(f in first)) throw new Error("CSV is missing expected column: " + f);
      }
      runApp(results.data);
    } catch (err) {
      document.getElementById("result").textContent = "Error: " + err.message;
      console.error(err);
    }
  },
  error: function(err) {
    document.getElementById("result").textContent = "Could not load iris.csv: " + err.message;
  }
});

function runApp(allRows) {
  console.log("Rows:", allRows.length);
  console.log("First flower:", allRows[0]);
  console.log("Columns:", Object.keys(allRows[0]));

  const s = splitRows(allRows, "petal_length", 2.5);
  console.log("left:", s.left.length, "right:", s.right.length);
  console.log("left gini:", gini(s.left), "right gini:", gini(s.right));

  console.log("weighted gini:", weightedGini(s.left, s.right));
  console.log("full gini:", gini(allRows));

  console.log(bestSplit(allRows));

  const tree = buildTree(allRows);
  console.log(JSON.stringify(tree, null, 1));

  console.log(predict(tree, {petal_length: 1.4, petal_width: 0.2, sepal_length: 5.1, sepal_width: 3.5}));
  console.log(predict(tree, allRows[70]));
  console.log(predict(tree, allRows[120]));

  const shuffled = shuffle(allRows);
  const trainRows = shuffled.slice(0, 120);
  const testRows = shuffled.slice(120);
  const finalTree = buildTree(trainRows);
  console.log(trainRows.length, testRows.length);

  let correct = 0;
  const predictions = [];
  for (const flower of testRows) {
    const guess = predict(finalTree, flower);
    predictions.push(guess);
    if (guess === flower.species) correct++;
  }
  const accuracy = correct / testRows.length;
  console.log(`Accuracy: ${correct}/${testRows.length} = ${(accuracy * 100).toFixed(1)}%`);

  document.getElementById("result").textContent =
    `The tree classified ${correct} of ${testRows.length} test flowers correctly (${(accuracy * 100).toFixed(1)}% accuracy).`;
}

function gini(rows) {
  const counts = new Map();
  for (const row of rows) {
    counts.set(row.species, (counts.get(row.species) || 0) + 1);
  }
  let impurity = 1;
  for (const count of counts.values()) {
    const p = count / rows.length;
    impurity -= p * p;
  }
  return impurity;
}

// Gini tests: expect 0 and 0.5
const pure = [{species: "setosa"}, {species: "setosa"}, {species: "setosa"}];
const mixed = [{species: "setosa"}, {species: "versicolor"}];
console.log(gini(pure));
console.log(gini(mixed));

function splitRows(rows, feature, threshold) {
  const left = rows.filter(r => r[feature] < threshold);
  const right = rows.filter(r => r[feature] >= threshold);
  return { left, right };
}

function weightedGini(left, right) {
  const total = left.length + right.length;
  return (left.length / total) * gini(left) + (right.length / total) * gini(right);
}

const FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"];

function bestSplit(rows) {
  let best = { gain: 0, feature: null, threshold: null };
  const currentGini = gini(rows);
  for (const feature of FEATURES) {
    const values = [...new Set(rows.map(r => r[feature]))].sort((a, b) => a - b);
    for (const threshold of values) {
      const { left, right } = splitRows(rows, feature, threshold);
      if (left.length === 0 || right.length === 0) continue;
      const gain = currentGini - weightedGini(left, right);
      if (gain > best.gain) {
        best = { gain, feature, threshold };
      }
    }
  }
  return best;
}

function majoritySpecies(rows) {
  const counts = new Map();
  for (const r of rows) counts.set(r.species, (counts.get(r.species) || 0) + 1);
  let top = null, topCount = -1;
  for (const [species, c] of counts) {
    if (c > topCount) { top = species; topCount = c; }
  }
  return top;
}

function buildTree(rows, depth = 0, maxDepth = 5) {
  if (rows.length === 0) return { prediction: null };
  if (gini(rows) === 0 || depth >= maxDepth) {
    return { prediction: majoritySpecies(rows) };
  }
  const { feature, threshold, gain } = bestSplit(rows);
  if (!feature || gain === 0) {
    return { prediction: majoritySpecies(rows) };
  }
  const { left, right } = splitRows(rows, feature, threshold);
  return {
    feature, threshold,
    left: buildTree(left, depth + 1, maxDepth),
    right: buildTree(right, depth + 1, maxDepth)
  };
}

function predict(tree, flower) {
  let node = tree;
  while (node.feature) {
    node = flower[node.feature] < node.threshold ? node.left : node.right;
  }
  return node.prediction;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
