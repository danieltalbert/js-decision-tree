// This is just the code necessary to actually run the program. It fetches
// iris.csv, and checks the data isn't broken before anything runs (the
// bouncer: the CSV must have rows and the expected columns). If anything
// fails, it shows an error on the page instead of crashing silently.
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

// runApp runs the whole demo: quick sanity checks on each piece, then the
// honest exam (train on 120, test on 30) with the accuracy printed to the page.
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

  // Split 120 for training, 30 for testing. The tree learns from the 120, then
  // faces the 30 it has never seen. Accuracy is just correct guesses divided
  // by the 30 test flowers. This is when you actually see how your program did.
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

// gini is essentially the representation of how "messy" the data is.
// In any given pile of flowers, it looks at how mixed up the species are,
// not just how many kinds but the proportions. In this case, it's looking
// at how many different kinds of flowers are in the dataset. You could think
// of this gini number with different kinds of cars, birds, or any category
// of thing that has variants.
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

// This function is what carries out the questions used to find out what kind
// of flower is being evaluated. You give it a question like "is the
// petal_length bigger than 2.5?", and it sorts the flowers into two piles
// based on the answer. It's just the way to split flowers up so the program
// can see which pile separates the species better.
function splitRows(rows, feature, threshold) {
  const left = rows.filter(r => r[feature] < threshold);
  const right = rows.filter(r => r[feature] >= threshold);
  return { left, right };
}

// weightedGini is a little hard to follow, but you can think of it as the
// combination of the splitRows function and the gini function. It is finding
// the gini score from within a group of data that was split from a splitRows
// function. So, if you had just one question, and that question was "Is the
// petal length more than 2.5?", you would then have two groups (since you've
// only asked one question so far on the dataset). Within those two groups,
// you can use weightedGini to find one blended gini score for the whole
// split, where each group's messiness counts in proportion to its size,
// so a big messy pile hurts more than a tiny one.
function weightedGini(left, right) {
  const total = left.length + right.length;
  return (left.length / total) * gini(left) + (right.length / total) * gini(right);
}

const FEATURES = ["sepal_length", "sepal_width", "petal_length", "petal_width"];

// bestSplit is all about finding the best possible question to ask that will
// help the program identify a given flower the fastest/easiest. Not all
// questions are made equally, in the sense that some questions separate the
// species more effectively than others. That's what this function does. It
// tries every possible question and measures the "before and after" of the
// gini score for each one: gain = messiness before minus messiness after.
// If asking a certain question drops the gini score more than a different
// question does, then you know which one will stay and which one won't.
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

// majoritySpecies is all about the representation of those groups that I
// mentioned earlier. When you have found the best possible questions to ask
// (using bestSplit), you end up having two groups as the answer to that
// question. This is done with the intention of having one species represented
// most in each group. Obviously, there can be multiple species in a group,
// even after the best questions, which is why it's ok to keep asking more
// questions. In our case, we decided that 5 levels of questions would be the
// max depth allowed. Tying this back into majoritySpecies: when a pile can't
// be split any further, the majoritySpecies (whichever species shows up most
// in that pile) becomes the leaf's answer.
function majoritySpecies(rows) {
  const counts = new Map();
  for (const r of rows) counts.set(r.species, (counts.get(r.species) || 0) + 1);
  let top = null, topCount = -1;
  for (const [species, c] of counts) {
    if (c > topCount) { top = species; topCount = c; }
  }
  return top;
}

// buildTree is the act of actually setting up the tree of these questions in
// order. It finds the best question with bestSplit, splits the flowers with
// splitRows, and then calls itself on the left pile and the right pile, which
// is recursion, the same job running on smaller piles. It stops and makes a
// leaf when a pile is pure (gini 0, nothing left to learn) or when it hits
// max depth 5 (a safety net so the tree can't grow forever). The whole system
// behind questions that identify flowers is done literally with the buildTree
// function and it builds upon the majoritySpecies concept along with the
// other ones I've mentioned.
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

// This is the final step. In any data science or machine learning project,
// it's important that you split the data into two groups. We do this to make
// practice data for the program (120 flowers to learn from) while still
// holding back a portion of the data (30 flowers) to actually test that the
// program can properly PREDICT what a flower will be based on the tree it
// made. If you gave the entire dataset to the program and left nothing for
// actual testing, you run the risk of not knowing if your program actually
// learned, and you won't know if there's something that needs to be refined
// in the case that this program is used in other datasets similar to the one
// used to make this program. The predict function itself is the walk: it
// starts at the top of the finished tree, checks the new flower's measurement
// against each question's threshold (under it go left, otherwise go right),
// and keeps going until it lands on a leaf, whose prediction is the answer.
// So predict is when you actually see how your program did.
function predict(tree, flower) {
  let node = tree;
  while (node.feature) {
    node = flower[node.feature] < node.threshold ? node.left : node.right;
  }
  return node.prediction;
}

// Shuffle the deck before dealing. The CSV is grouped by species, so without
// shuffling, the test pile could end up as all one flower and the exam would
// be rigged. Random order keeps the split honest.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
